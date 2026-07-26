'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Check, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface KineticSuccessModalProps {
  orderNumber: string;
  onClose: () => void;
}

export default function KineticSuccessModal({ orderNumber, onClose }: KineticSuccessModalProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // 3D Three.js Particle Explosion Canvas
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Particle geometry
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    const orangeColor = new THREE.Color(0xff6600);
    const greenColor = new THREE.Color(0x2f4f2f);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      const c = Math.random() > 0.5 ? orangeColor : greenColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      velocities.push({
        x: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 0.08,
        z: (Math.random() - 0.5) * 0.08,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3] += velocities[i].x;
        posArr[i * 3 + 1] += velocities[i].y;
        posArr[i * 3 + 2] += velocities[i].z;
      }
      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-2xl flex items-center justify-center p-4">
      {/* Three.js Particle Canvas Background */}
      <div ref={mountRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Holographic 3D Success Card */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative z-10 max-w-sm w-full bg-[#121212] border border-[#FF6600]/60 p-6 clip-angled shadow-[0_0_50px_rgba(255,102,0,0.5)] text-center space-y-5"
      >
        {/* Holographic Hologram Icon Pop */}
        <div className="relative w-20 h-20 mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="w-full h-full bg-gradient-to-tr from-[#2F4F2F] to-[#FF6600] rounded-full p-0.5 flex items-center justify-center shadow-[0_0_30px_#FF6600]"
          >
            <div className="w-full h-full bg-[#0A0A0A] rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-[#FF6600] stroke-[3]" />
            </div>
          </motion.div>
        </div>

        {/* Text Details */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#4A7C4A] uppercase tracking-widest bg-[#2F4F2F]/20 border border-[#2F4F2F] px-3 py-1 clip-angled-sm">
            <ShieldCheck className="w-4 h-4 text-[#FF6600]" />
            <span>MISSION DISPATCH CONFIRMED</span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight pt-2">
            ORDER {orderNumber}
          </h2>
          <p className="text-xs text-neutral-300 font-mono leading-relaxed">
            Your deployment package has been processed for Cash on Delivery dispatch across Pakistan.
          </p>
        </div>

        {/* Action Button */}
        <Link
          href="/"
          onClick={onClose}
          className="block w-full bg-[#FF6600] text-black hover:bg-[#E05800] py-3 px-4 font-mono text-xs font-black uppercase clip-angled shadow-[0_0_15px_rgba(255,102,0,0.4)] transition-all"
        >
          RETURN TO HUB HEADQUARTERS
        </Link>
      </motion.div>
    </div>
  );
}
