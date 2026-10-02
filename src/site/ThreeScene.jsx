import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import moonUrl from '../images/moon.jpg';

export default function ThreeScene({ concept, section, progress = 0 }) {
  const host = useRef(null);
  const controller = useRef(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const element = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    const group = new THREE.Group();
    scene.add(group);
    const resources = [];
    const addMesh = (geometry, material) => {
      resources.push(geometry, material);
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      return mesh;
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 700px)');
    let disposed = false;
    let frame = 0;
    let visible = false;
    let targetX = 0.15;
    let targetY = -0.25;
    let lastSection = 'home';
    let accentMaterial;
    const slabs = [];
    let targetProgress = 0;
    let currentProgress = 0;
    const draw = () => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const still = reduced.matches || mobile.matches;
      group.rotation.x = still ? 0.15 : THREE.MathUtils.lerp(group.rotation.x, targetX, 0.12);
      group.rotation.y = still ? -0.25 : THREE.MathUtils.lerp(group.rotation.y, targetY, 0.12);
      if (concept === 'layers') {
        currentProgress = still ? 1 : THREE.MathUtils.lerp(currentProgress, targetProgress, 0.14);
        slabs.forEach((slab, index) => {
          const expansion = THREE.MathUtils.smoothstep(currentProgress, index * 0.2, Math.min(1, index * 0.2 + 0.6));
          slab.position.y = (1 - index) * (0.25 + expansion * 0.9);
          slab.position.x = (index - 1) * expansion * 0.25;
          slab.position.z = expansion * (index === 1 ? 0.4 : 0);
        });
      }
      renderer.render(scene, camera);
      if (!still && (Math.abs(group.rotation.x - targetX) > 0.001 || Math.abs(group.rotation.y - targetY) > 0.001 || Math.abs(currentProgress - targetProgress) > 0.001)) invalidate();
    };
    function invalidate() {
      if (!disposed && visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    }
    scene.add(new THREE.AmbientLight(0xc4d5e4, 0.65));
    const light = new THREE.DirectionalLight(0xffffff, 1.4);
    light.position.set(3, 4, 5);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0x8bbed5, 0.8);
    rim.position.set(-4, 1, -1);
    scene.add(rim);

    if (concept === 'a') {
      const material = new THREE.MeshStandardMaterial({ color: 0xc4d1db, roughness: 0.95 });
      addMesh(new THREE.SphereGeometry(1.55, 32, 24), material);
      const texture = new THREE.TextureLoader().load(moonUrl, () => { if (!disposed) invalidate(); }, undefined, () => invalidate());
      texture.encoding = THREE.sRGBEncoding;
      material.map = texture;
      resources.push(texture);
      const ring = addMesh(new THREE.TorusGeometry(2.1, 0.009, 6, 80), new THREE.MeshBasicMaterial({ color: 0xb8c9db, transparent: true, opacity: 0.4 }));
      ring.rotation.x = 1.1;
      ring.rotation.z = 0.25;
    } else if (concept === 'b' || concept === 'layers') {
      for (let i = 0; i < 3; i++) {
        const material = new THREE.MeshStandardMaterial({ color: i === 1 ? 0x567068 : 0xa5b6af, metalness: 0.25, roughness: 0.5 });
        const slab = addMesh(new THREE.BoxGeometry(2.55, 0.18, 1.85), material);
        slab.position.y = (i - 1) * 0.8;
        slabs.push(slab);
        slab.rotation.y = -0.35;
        const edgeGeometry = new THREE.EdgesGeometry(slab.geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xd5e9df, transparent: true, opacity: 0.65 });
        slab.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
        resources.push(edgeGeometry, edgeMaterial);
      }
      group.rotation.z = -0.14;
      targetX = 0.38;
    } else {
      accentMaterial = new THREE.MeshBasicMaterial({ color: 0x8ba8b9, wireframe: true, transparent: true, opacity: 0.32 });
      addMesh(new THREE.IcosahedronGeometry(1.9, 2), accentMaterial);
      addMesh(new THREE.IcosahedronGeometry(1.2, 0), new THREE.MeshStandardMaterial({ color: 0x75978d, metalness: 0.3, roughness: 0.6 }));
      group.position.x = mobile.matches ? 0 : 1.45;
    }

    const setSection = value => {
      lastSection = value;
      if (concept !== 'c') return;
      const index = ['home', 'about', 'work', 'experience', 'capabilities', 'contact'].indexOf(value);
      targetY = -0.25 + Math.max(index, 0) * 0.13;
      targetX = 0.15 + Math.max(index, 0) * 0.025;
      accentMaterial.color.set(value === 'work' || value === 'contact' ? 0xa8c9b4 : 0x8ba8b9);
      invalidate();
    };
    controller.current = { setSection, setProgress(value) { targetProgress = value; invalidate(); } };
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1));
      camera.aspect = Math.max(width, 1) / Math.max(height, 1);
      camera.updateProjectionMatrix();
      if (concept === 'c') group.position.x = mobile.matches ? 0 : 1.45;
      invalidate();
    };
    const pointer = event => {
      if (reduced.matches || mobile.matches || concept === 'layers') return;
      const bounds = element.getBoundingClientRect();
      targetX = 0.15 + (event.clientY - bounds.top - bounds.height / 2) / bounds.height * 0.12;
      targetY = -0.25 + (event.clientX - bounds.left - bounds.width / 2) / bounds.width * 0.18;
      invalidate();
    };
    const leave = () => { targetX = concept === 'b' || concept === 'layers' ? 0.38 : 0.15; targetY = -0.25; setSection(lastSection); invalidate(); };
    const contextLost = event => { event.preventDefault(); setUnavailable(true); cancelAnimationFrame(frame); frame = 0; };
    const contextRestored = () => { setUnavailable(false); invalidate(); };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) invalidate();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    visibilityObserver.observe(element);
    const pointerTarget = concept === 'c' ? window : element;
    pointerTarget.addEventListener('pointermove', pointer, { passive: true });
    pointerTarget.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', invalidate);
    reduced.addEventListener('change', invalidate);
    mobile.addEventListener('change', resize);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
    resize();
    return () => {
      disposed = true;
      controller.current = null;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      pointerTarget.removeEventListener('pointermove', pointer);
      pointerTarget.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', invalidate);
      reduced.removeEventListener('change', invalidate);
      mobile.removeEventListener('change', resize);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      resources.forEach(resource => resource.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [concept]);

  useEffect(() => { controller.current?.setSection(section); }, [section]);
  useEffect(() => { controller.current?.setProgress(progress); }, [progress]);

  return <div ref={host} className={`three-scene ${concept === 'c' ? 'immersive-scene' : ''} ${unavailable ? 'scene-unavailable' : ''}`} aria-hidden="true">
    <div className="static-orbit"><span /><span /><span /></div>
  </div>;
}
