import * as THREE from 'three';

/**
 * Creates an interactive 3D Telescopic Self-Defense Stick / Baton.
 * Features 3 telescopic segments that smoothly extend and retract.
 */
export function createTelescopicBatonGroup(): {
  group: THREE.Group;
  updateAnimation: (time: number, isExtending: boolean) => void;
} {
  const group = new THREE.Group();

  // Material Palette
  const gripMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.3,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.95,
    roughness: 0.1,
  });

  const orangeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0.8,
    roughness: 0.2,
  });

  // 1. Base Handle (Segment 1)
  const handleGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.9, 32);
  const handleMesh = new THREE.Mesh(handleGeo, gripMaterial);
  handleMesh.position.y = -0.45;
  group.add(handleMesh);

  // Tactical Rubber Grip Knurling Rings
  for (let i = -0.7; i <= -0.1; i += 0.12) {
    const ringGeo = new THREE.TorusGeometry(0.135, 0.015, 12, 32);
    const ringMesh = new THREE.Mesh(ringGeo, orangeMaterial);
    ringMesh.position.y = i;
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);
  }

  // 2. Middle Shaft (Segment 2)
  const midGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.85, 32);
  const midMesh = new THREE.Mesh(midGeo, chromeMaterial);
  midMesh.position.y = 0.1;
  group.add(midMesh);

  // 3. Top Extension Shaft & Tip (Segment 3)
  const topGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.8, 32);
  const topMesh = new THREE.Mesh(topGeo, chromeMaterial);
  topMesh.position.y = 0.65;
  group.add(topMesh);

  // Steel Tip Cap
  const tipGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const tipMesh = new THREE.Mesh(tipGeo, orangeMaterial);
  tipMesh.position.y = 1.05;
  group.add(tipMesh);

  // Spark Particles around Strike Tip
  const sparkCount = 30;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount * 3; i++) {
    sparkPos[i] = (Math.random() - 0.5) * 0.3;
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xff6600,
    size: 0.04,
    transparent: true,
    opacity: 0.8,
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  sparkPoints.position.y = 1.05;
  group.add(sparkPoints);

  // Extension Animation Update Function
  let currentExt = 0;
  const updateAnimation = (time: number, isExtending: boolean) => {
    const targetExt = isExtending ? 1 : 0.4 + Math.sin(time * 2) * 0.15;
    currentExt += (targetExt - currentExt) * 0.08;

    midMesh.position.y = -0.1 + currentExt * 0.45;
    topMesh.position.y = midMesh.position.y + 0.35 + currentExt * 0.45;
    tipMesh.position.y = topMesh.position.y + 0.4;
    sparkPoints.position.y = tipMesh.position.y;

    sparkPoints.rotation.y = time * 3;
  };

  return { group, updateAnimation };
}

/**
 * Creates an interactive 3D Automatic Camping Tent.
 * Features 4 arched frame poles, dome cover, and entrance awning.
 */
export function createCampingTentGroup(): {
  group: THREE.Group;
  updateAnimation: (time: number) => void;
} {
  const group = new THREE.Group();

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x2f4f2f,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    roughness: 0.4,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Dome Tent Main Shell
  const tentGeo = new THREE.ConeGeometry(1.4, 1.1, 4);
  const tentMesh = new THREE.Mesh(tentGeo, fabricMat);
  tentMesh.rotation.y = Math.PI / 4;
  group.add(tentMesh);

  // Roof Cap Accent
  const capGeo = new THREE.ConeGeometry(0.6, 0.4, 4);
  const capMesh = new THREE.Mesh(capGeo, accentMat);
  capMesh.position.y = 0.45;
  capMesh.rotation.y = Math.PI / 4;
  group.add(capMesh);

  // 4 Arched Exoskeleton Frame Poles
  for (let i = 0; i < 4; i++) {
    const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.2, 16);
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.rotation.z = Math.PI / 5;
    poleMesh.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
    group.add(poleMesh);
  }

  // Entrance Door Flap
  const doorGeo = new THREE.PlaneGeometry(0.7, 0.8);
  const doorMesh = new THREE.Mesh(doorGeo, accentMat);
  doorMesh.position.set(0, -0.1, 0.85);
  doorMesh.rotation.x = -0.2;
  group.add(doorMesh);

  const updateAnimation = (time: number) => {
    // Subtle breathing pulse simulating wind/deployment stability
    const scaleY = 1 + Math.sin(time * 1.5) * 0.02;
    tentMesh.scale.set(1, scaleY, 1);
  };

  return { group, updateAnimation };
}

/**
 * Creates an interactive 3D Holographic Display Pod projecting the real Product Image.
 */
export function createHologramProductDisplay(imageUrl: string): {
  group: THREE.Group;
  updateAnimation: (time: number) => void;
} {
  const group = new THREE.Group();

  // Create Product Image Decal Canvas
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(imageUrl || 'https://tacticalhub.com.pk/cdn/shop/files/1_7162411a-422c-4acf-aec0-342732a1b5e3.webp?v=1780473836&width=360');

  // Product Image Plane
  const planeGeo = new THREE.PlaneGeometry(1.6, 1.6);
  const planeMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const planeMesh = new THREE.Mesh(planeGeo, planeMat);
  group.add(planeMesh);

  // Glowing Outer Hologram Border Frame
  const frameGeo = new THREE.RingGeometry(1.1, 1.15, 32);
  const frameMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    side: THREE.DoubleSide,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  group.add(frameMesh);

  // Laser Scan Beam Line
  const scanGeo = new THREE.PlaneGeometry(1.8, 0.03);
  const scanMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    side: THREE.DoubleSide,
  });
  const scanMesh = new THREE.Mesh(scanGeo, scanMat);
  group.add(scanMesh);

  const updateAnimation = (time: number) => {
    // Laser scanline sweeping up and down
    scanMesh.position.y = Math.sin(time * 3) * 0.85;
    frameMesh.rotation.z = time * 0.8;
  };

  return { group, updateAnimation };
}
