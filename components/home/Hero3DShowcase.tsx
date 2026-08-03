'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Rotate3d, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductDto } from '@/lib/catalog-types';
import {
  createTelescopicBatonGroup,
  createCampingTentGroup,
  createHologramProductDisplay,
} from '@/lib/three-tactical-models';

interface Hero3DShowcaseProps {
  featuredProducts: ProductDto[];
}

// Fallback demo items if products list is empty
const FALLBACK_ITEMS: ProductDto[] = [
  {
    id: 'demo-1',
    name: 'Automatic Telescopic Selfdefence Stick',
    slug: 'automatic-telescopic-selfdefence-stick',
    description: 'High-strength steel automatic spring telescopic self-defense baton with haptic rubber grip.',
    shortDescription: 'High-strength steel automatic spring telescopic self-defense baton with haptic rubber grip.',
    price: 2500,
    compareAtPrice: 5000,
    vendor: 'Tacticalhub',
    categoryName: 'KNIVES & TASERS',
    images: [{ url: 'https://tacticalhub.com.pk/cdn/shop/files/1_7162411a-422c-4acf-aec0-342732a1b5e3.webp?v=1780473836&width=360' }],
    variants: [{ inventoryId: 'inv-1', sku: 'STICK-01', name: 'Standard', price: 2500, compareAtPrice: 5000, stock: 10 }],
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    stock: 10,
    status: 'PUBLISHED',
  },
  {
    id: 'demo-2',
    name: 'Imported Automatic Camping Tent For 2-4 Persons',
    slug: 'imported-automatic-camping-tent-for-3-5-persons',
    description: 'Double-layer waterproof automatic instant opening family outdoor tent.',
    shortDescription: 'Double-layer waterproof automatic instant opening family outdoor tent.',
    price: 11999,
    compareAtPrice: 24999,
    vendor: 'Tacticalhub',
    categoryName: 'CAMPING TENTS',
    images: [{ url: 'https://tacticalhub.com.pk/cdn/shop/files/Untitled_design_3.jpg?v=1780491594&width=360' }],
    variants: [{ inventoryId: 'inv-2', sku: 'TENT-01', name: 'Standard', price: 11999, compareAtPrice: 24999, stock: 5 }],
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    stock: 5,
    status: 'PUBLISHED',
  },
];

export default function Hero3DShowcase({ featuredProducts }: Hero3DShowcaseProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [modelTypeLabel, setModelTypeLabel] = useState('3D TELESCOPIC BATON');

  const rotationRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDraggingRef = useRef(false);
  const previousPointerRef = useRef({ x: 0, y: 0 });
  const currentItemRef = useRef<ProductDto | null>(null);

  const items = featuredProducts.length > 0 ? featuredProducts : FALLBACK_ITEMS;

  const currentItem = items[activeIndex % items.length];

  // Ref synchronization effect to avoid render-time ref assignment
  useEffect(() => {
    currentItemRef.current = currentItem;
  }, [currentItem]);

  // Keep a ref of isInteracting to avoid re-triggering main Three.js useEffect
  const isInteractingRef = useRef(isInteracting);
  useEffect(() => {
    isInteractingRef.current = isInteracting;
  }, [isInteracting]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 4.8);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const spotOrange = new THREE.SpotLight(0xff6600, 5);
    spotOrange.position.set(4, 5, 4);
    spotOrange.angle = Math.PI / 4;
    scene.add(spotOrange);

    const spotGreen = new THREE.SpotLight(0x2f4f2f, 4);
    spotGreen.position.set(-4, -2, -2);
    spotGreen.angle = Math.PI / 4;
    scene.add(spotGreen);

    // 5. Reactive Tactical Perspective Grid
    const gridHelper = new THREE.GridHelper(24, 48, 0xff6600, 0x2a2a2a);
    gridHelper.position.y = -1.25;
    scene.add(gridHelper);

    // Ambient Floating Particle System
    const pCount = 100;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) {
      pPos[i] = (Math.random() - 0.5) * 10;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xff6600, size: 0.03, transparent: true, opacity: 0.6 });
    const pPoints = new THREE.Points(pGeo, pMat);
    scene.add(pPoints);

    // Active Model Container Group
    const modelContainer = new THREE.Group();
    scene.add(modelContainer);

    let activeBatonAnim: ((time: number, isExtending: boolean) => void) | null = null;
    let activeTentAnim: ((time: number) => void) | null = null;
    let activeHologramAnim: ((time: number) => void) | null = null;

    // Helper to rebuild 3D Mesh based on active product item
    const rebuildActiveModel = (item: ProductDto) => {
      // Clear existing meshes
      while (modelContainer.children.length > 0) {
        modelContainer.remove(modelContainer.children[0]);
      }
      activeBatonAnim = null;
      activeTentAnim = null;
      activeHologramAnim = null;

      const nameLower = (item.name || '').toLowerCase();
      const catLower = (item.categoryName || '').toLowerCase();
      const imageUrl = item.images && item.images[0]?.url ? item.images[0].url : '';

      if (nameLower.includes('stick') || nameLower.includes('baton') || nameLower.includes('telescopic')) {
        const baton = createTelescopicBatonGroup();
        modelContainer.add(baton.group);
        activeBatonAnim = baton.updateAnimation;
        setModelTypeLabel('3D TELESCOPIC BATON (EXTENDABLE)');
      } else if (nameLower.includes('tent') || catLower.includes('tent')) {
        const tent = createCampingTentGroup();
        modelContainer.add(tent.group);
        activeTentAnim = tent.updateAnimation;
        setModelTypeLabel('3D AUTOMATIC DEPLOY TENT');
      } else {
        const holo = createHologramProductDisplay(imageUrl);
        modelContainer.add(holo.group);
        activeHologramAnim = holo.updateAnimation;
        setModelTypeLabel('3D HOLOGRAPHIC TACTICAL DISPLAY');
      }
    };

    // Initial build
    const initialItem = currentItemRef.current || FALLBACK_ITEMS[0];
    rebuildActiveModel(initialItem);

    // Pointer Drag Handlers
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      setIsInteracting(true);
      previousPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousPointerRef.current.x;
      const deltaY = e.clientY - previousPointerRef.current.y;

      rotationRef.current.targetY += deltaX * 0.008;
      rotationRef.current.targetX += deltaY * 0.008;

      previousPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setTimeout(() => setIsInteracting(false), 600);
    };

    const handleScrollSpin = () => {
      rotationRef.current.targetY += 0.025;
    };

    window.addEventListener('scroll', handleScrollSpin, { passive: true });
    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Smooth Animation Render Loop
    let animFrameId: number;
    const startTime = Date.now();
    let currentId = initialItem.id;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = (Date.now() - startTime) * 0.001;

      // Check if product changed
      if (currentItemRef.current && currentItemRef.current.id !== currentId) {
        currentId = currentItemRef.current.id;
        rebuildActiveModel(currentItemRef.current);
      }

      // Linear interpolation (lerp) for ultra-smooth rotation
      rotationRef.current.x += (rotationRef.current.targetX - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (rotationRef.current.targetY - rotationRef.current.y) * 0.08;

      if (!isDraggingRef.current) {
        rotationRef.current.targetY += 0.004;
      }

      modelContainer.rotation.y = rotationRef.current.y;
      modelContainer.rotation.x = rotationRef.current.x;
      modelContainer.position.y = Math.sin(elapsed * 1.8) * 0.06;

      // Run sub-assembly animations
      if (activeBatonAnim) activeBatonAnim(elapsed, isDraggingRef.current || isInteractingRef.current);
      if (activeTentAnim) activeTentAnim(elapsed);
      if (activeHologramAnim) activeHologramAnim(elapsed);

      // Rotate particle background
      pPoints.rotation.y = elapsed * 0.05;

      renderer.render(scene, camera);
    };
    animate();

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
      window.removeEventListener('scroll', handleScrollSpin);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="relative w-full h-[500px] sm:h-[580px] bg-[#142230] border border-[#33506B] clip-angled-lg overflow-hidden group shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      {/* Three.js Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Glassmorphic Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#142230] via-transparent to-[#142230]/60 pointer-events-none z-10" />

      {/* Top 3D Model Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#1F3346]/90 backdrop-blur-md border border-[#FFFFFF]/40 px-3 py-1.5 clip-angled-sm shadow-lg">
        <Rotate3d className={`w-4 h-4 text-[#FFFFFF] ${isInteracting ? 'animate-spin' : ''}`} />
        <span className="text-[9px] font-mono font-black text-white uppercase tracking-widest">
          {modelTypeLabel}
        </span>
      </div>

      {/* Left/Right Carousel Controls */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 z-20 flex justify-between pointer-events-none">
        <button
          onClick={handlePrev}
          className="p-2.5 bg-[#1F3346]/80 backdrop-blur-md border border-[#33506B] hover:border-[#FFFFFF] text-white clip-angled pointer-events-auto transition-all"
          aria-label="Previous item"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          className="p-2.5 bg-[#1F3346]/80 backdrop-blur-md border border-[#33506B] hover:border-[#FFFFFF] text-white clip-angled pointer-events-auto transition-all"
          aria-label="Next item"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content Details Overlay */}
      <div className="relative z-20 h-full flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 border border-[#4A7C4A] bg-[#2F4F2F]/30 py-1.5 px-3.5 text-[#9BCB77] text-xs font-mono font-black uppercase tracking-widest clip-angled-sm w-fit pointer-events-auto">
          <ShieldCheck className="w-4 h-4 text-[#FFFFFF]" />
          <span>TACTICAL HUB // REAL 3D MODEL</span>
        </div>

        {/* Bottom Product Info */}
        <div className="space-y-4 max-w-xl pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              <span className="text-xs font-mono font-bold text-[#FFFFFF] tracking-widest uppercase block">
                {currentItem.categoryName}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight leading-none">
                {currentItem.name}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium line-clamp-2 leading-relaxed">
                {currentItem.shortDescription || 'Professional grade equipment sourced for extreme outdoor durability.'}
              </p>
              <div className="text-2xl font-mono font-black text-white pt-1">
                Rs. {Number(currentItem.price).toLocaleString()}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/products?slug=${encodeURIComponent(currentItem.slug || 'automatic-telescopic-selfdefence-stick')}`}
              className="bg-[#FFFFFF] text-black hover:bg-[#F4F1E8] text-xs font-mono font-black uppercase py-3.5 px-8 transition-all clip-angled flex items-center gap-2 tactile-depress shadow-[0_0_20px_rgba(255,102,0,0.5)]"
            >
              <span>INSPECT GEAR</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Pagination Pips */}
            <div className="flex items-center gap-1.5 ml-auto">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 transition-all clip-angled-sm ${
                    idx === activeIndex ? 'w-8 bg-[#FFFFFF]' : 'w-2 bg-[#33506B] hover:bg-neutral-500'
                  }`}
                  aria-label={`Go to item ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
