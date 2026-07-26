'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogImage from '@/components/ui/CatalogImage';
import { Rotate3d, Layers, Eye, ShieldCheck, Sparkles } from 'lucide-react';
import {
  createTelescopicBatonGroup,
  createCampingTentGroup,
  createHologramProductDisplay,
} from '@/lib/three-tactical-models';

interface Product3DGalleryProps {
  productName: string;
  images: { url: string }[];
}

export default function Product3DGallery({ productName, images }: Product3DGalleryProps) {
  const [activeTab, setActiveTab] = useState<'3D' | 'PHOTOS'>('3D');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [explodedStep, setExplodedStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [modelTypeLabel, setModelTypeLabel] = useState('3D TELESCOPIC BATON');

  const mountRef = useRef<HTMLDivElement>(null);
  const explosionRef = useRef(0);

  useEffect(() => {
    explosionRef.current = explodedStep / 100;
  }, [explodedStep]);

  useEffect(() => {
    if (activeTab !== '3D') return;

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x121212, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const spotOrange = new THREE.SpotLight(0xff6600, 4);
    spotOrange.position.set(4, 5, 4);
    scene.add(spotOrange);

    const spotGreen = new THREE.SpotLight(0x2f4f2f, 3);
    spotGreen.position.set(-4, -2, -2);
    scene.add(spotGreen);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(20, 40, 0xff6600, 0x2a2a2a);
    gridHelper.position.y = -1.25;
    scene.add(gridHelper);

    // Build Model according to productName
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let activeBatonAnim: ((time: number, isExtending: boolean) => void) | null = null;
    let activeTentAnim: ((time: number) => void) | null = null;
    let activeHologramAnim: ((time: number) => void) | null = null;

    const nameLower = (productName || '').toLowerCase();
    const primaryImg = images && images[0]?.url ? images[0].url : '';

    if (nameLower.includes('stick') || nameLower.includes('baton') || nameLower.includes('telescopic')) {
      const baton = createTelescopicBatonGroup();
      modelGroup.add(baton.group);
      activeBatonAnim = baton.updateAnimation;
      setModelTypeLabel('3D TELESCOPIC BATON (EXTENDABLE)');
    } else if (nameLower.includes('tent') || nameLower.includes('camping')) {
      const tent = createCampingTentGroup();
      modelGroup.add(tent.group);
      activeTentAnim = tent.updateAnimation;
      setModelTypeLabel('3D AUTOMATIC DEPLOY TENT');
    } else {
      const holo = createHologramProductDisplay(primaryImg);
      modelGroup.add(holo.group);
      activeHologramAnim = holo.updateAnimation;
      setModelTypeLabel('3D HOLOGRAPHIC DISPLAY');
    }

    // Pointer Interaction
    let isMouseDown = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      setIsDragging(true);
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      modelGroup.rotation.y += dx * 0.01;
      modelGroup.rotation.x += dy * 0.01;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
      setIsDragging(false);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch Support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isMouseDown = true;
        setIsDragging(true);
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isMouseDown || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevX;
      const dy = e.touches[0].clientY - prevY;
      modelGroup.rotation.y += dx * 0.012;
      modelGroup.rotation.x += dy * 0.012;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      isMouseDown = false;
      setIsDragging(false);
    };

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Render loop
    let animId: number;
    const startTime = Date.now();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const elapsed = (Date.now() - startTime) * 0.001;

      if (!isMouseDown) {
        modelGroup.rotation.y += 0.004;
      }

      if (activeBatonAnim) activeBatonAnim(elapsed, isMouseDown || isDragging || explosionRef.current > 0.1);
      if (activeTentAnim) activeTentAnim(elapsed);
      if (activeHologramAnim) activeHologramAnim(elapsed);

      renderer.render(scene, camera);
    };
    renderLoop();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeTab, productName]);

  const displayImages = images.length > 0 ? images : [{ url: '' }];

  return (
    <div className="relative w-full h-[55vh] min-h-[380px] sm:h-[65vh] bg-[#121212] border-b border-[#2A2A2A] overflow-hidden flex flex-col justify-between">
      {/* Background Grid */}
      <div className="absolute inset-0 tactical-grid-bg opacity-30 pointer-events-none" />

      {/* View Switcher Header */}
      <div className="relative z-20 flex items-center justify-between p-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] p-1 clip-angled">
          <button
            onClick={() => setActiveTab('3D')}
            className={`px-3 py-1.5 font-mono text-xs font-black uppercase clip-angled-sm transition-all flex items-center gap-1.5 ${
              activeTab === '3D'
                ? 'bg-[#FF6600] text-black shadow-[0_0_10px_rgba(255,102,0,0.4)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Rotate3d className="w-4 h-4" />
            <span>3D MODEL VIEW</span>
          </button>
          <button
            onClick={() => setActiveTab('PHOTOS')}
            className={`px-3 py-1.5 font-mono text-xs font-black uppercase clip-angled-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'PHOTOS'
                ? 'bg-[#FF6600] text-black shadow-[0_0_10px_rgba(255,102,0,0.4)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>PHOTOS ({displayImages.length})</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-[10px] font-mono text-[#4A7C4A] border border-[#2F4F2F] px-2.5 py-1 bg-[#2F4F2F]/20 clip-angled-sm">
          {modelTypeLabel}
        </span>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center">
        {activeTab === '3D' ? (
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        ) : (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50 && currentImageIndex < displayImages.length - 1) {
                setCurrentImageIndex((prev) => prev + 1);
              } else if (info.offset.x > 50 && currentImageIndex > 0) {
                setCurrentImageIndex((prev) => prev - 1);
              }
            }}
            className="w-full h-full flex items-center justify-center p-6 select-none cursor-grab active:cursor-grabbing"
          >
            <motion.div
              key={currentImageIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full h-full max-h-[400px] flex items-center justify-center"
            >
              {displayImages[currentImageIndex]?.url ? (
                <CatalogImage
                  src={displayImages[currentImageIndex].url}
                  alt={productName}
                  className="object-contain max-h-full"
                  sizes="100vw"
                />
              ) : (
                <div className="text-neutral-500 font-mono text-xs">NO ASSET IMAGE AVAILABLE</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-20 p-4 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        {activeTab === '3D' ? (
          <div className="w-full sm:max-w-md bg-[#161616]/90 backdrop-blur-md border border-[#2A2A2A] p-2.5 clip-angled flex items-center gap-3">
            <Layers className="w-4 h-4 text-[#FF6600] shrink-0" />
            <span className="text-[10px] font-mono font-bold text-white uppercase whitespace-nowrap">
              3D ANIMATION DEPLOYMENT: {explodedStep}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={explodedStep}
              onChange={(e) => setExplodedStep(Number(e.target.value))}
              className="w-full accent-[#FF6600] cursor-pointer"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-12 h-12 bg-[#1A1A1A] border clip-angled-sm overflow-hidden transition-all shrink-0 ${
                  idx === currentImageIndex ? 'border-[#FF6600] scale-105' : 'border-[#2A2A2A] opacity-60'
                }`}
              >
                {img.url && <CatalogImage src={img.url} alt={`Thumb ${idx}`} sizes="48px" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
