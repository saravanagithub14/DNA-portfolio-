import './style.css';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. SETUP & UTILS
// ==========================================
const canvas = document.querySelector('#webgl-canvas');
const cursor = document.querySelector('#custom-cursor');

// Custom Cursor Logic
document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
const interactiveElements = document.querySelectorAll('a, button, input, .panel, canvas');
interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// Lenis Smooth Scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ==========================================
// 2. THREE.JS SCENE SETUP
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#030308', 0.015); // blue-violet volumetric fog feel

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
camera.position.y = -5;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#030308');

// Post-Processing (Bloom for emissive elements)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.8;
bloomPass.strength = 0.6;
bloomPass.radius = 0.4;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// ==========================================
// 3. DNA HELIX GENERATION
// ==========================================
const numBasePairs = 100;
const helixRadius = 3;
const helixHeight = 60;
const turns = 4;

const colors = {
  strandA: new THREE.Color('#00FFB2'),
  strandB: new THREE.Color('#9B7FFF'),
  about: new THREE.Color('#FFFFFF'),
  skills: new THREE.Color('#00FFB2'),
  projects: new THREE.Color('#9B7FFF'),
  experience: new THREE.Color('#FFB000'), // amber
  contact: new THREE.Color('#FF7F50') // coral
};

const curveA = [];
const curveB = [];

for (let i = 0; i <= numBasePairs; i++) {
  const t = i / numBasePairs;
  const angle = t * Math.PI * 2 * turns;
  const y = (t - 0.5) * helixHeight;
  
  curveA.push(new THREE.Vector3(Math.cos(angle) * helixRadius, y, Math.sin(angle) * helixRadius));
  curveB.push(new THREE.Vector3(Math.cos(angle + Math.PI) * helixRadius, y, Math.sin(angle + Math.PI) * helixRadius));
}

const tubeGeometryA = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curveA), 200, 0.15, 8, false);
const tubeGeometryB = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curveB), 200, 0.15, 8, false);

const strandMaterialA = new THREE.MeshStandardMaterial({ 
  color: colors.strandA, 
  emissive: colors.strandA, 
  emissiveIntensity: 0.8,
  roughness: 0.2,
  metalness: 0.8
});
const strandMaterialB = new THREE.MeshStandardMaterial({ 
  color: colors.strandB, 
  emissive: colors.strandB, 
  emissiveIntensity: 0.8,
  roughness: 0.2,
  metalness: 0.8
});

const strandA = new THREE.Mesh(tubeGeometryA, strandMaterialA);
const strandB = new THREE.Mesh(tubeGeometryB, strandMaterialB);
scene.add(strandA);
scene.add(strandB);

// Base Pairs using InstancedMesh
const cylinderGeo = new THREE.CylinderGeometry(0.05, 0.05, helixRadius * 2, 8);
cylinderGeo.rotateZ(Math.PI / 2);
const cylinderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 });
const rungs = new THREE.InstancedMesh(cylinderGeo, cylinderMat, numBasePairs);

const sphereGeo = new THREE.SphereGeometry(0.3, 16, 16);
const nodeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });
const nodesA = new THREE.InstancedMesh(sphereGeo, nodeMat, numBasePairs);
const nodesB = new THREE.InstancedMesh(sphereGeo, nodeMat, numBasePairs);

const dummy = new THREE.Object3D();
const colorDummy = new THREE.Color();

// Color coding mapping based on sections
function getRungColor(index, total) {
  const p = index / total;
  if (p < 0.2) return colors.about;
  if (p < 0.4) return colors.skills;
  if (p < 0.6) return colors.projects;
  if (p < 0.8) return colors.experience;
  return colors.contact;
}

for (let i = 0; i < numBasePairs; i++) {
  const t = i / numBasePairs;
  const angle = t * Math.PI * 2 * turns;
  const y = (t - 0.5) * helixHeight;
  
  const posA = new THREE.Vector3(Math.cos(angle) * helixRadius, y, Math.sin(angle) * helixRadius);
  const posB = new THREE.Vector3(Math.cos(angle + Math.PI) * helixRadius, y, Math.sin(angle + Math.PI) * helixRadius);
  
  // Rungs
  const mid = new THREE.Vector3().lerpVectors(posA, posB, 0.5);
  dummy.position.copy(mid);
  dummy.lookAt(posA);
  dummy.updateMatrix();
  rungs.setMatrixAt(i, dummy.matrix);
  rungs.setColorAt(i, getRungColor(i, numBasePairs));

  // Nodes A
  dummy.position.copy(posA);
  dummy.updateMatrix();
  nodesA.setMatrixAt(i, dummy.matrix);
  nodesA.setColorAt(i, getRungColor(i, numBasePairs));

  // Nodes B
  dummy.position.copy(posB);
  dummy.updateMatrix();
  nodesB.setMatrixAt(i, dummy.matrix);
  nodesB.setColorAt(i, getRungColor(i, numBasePairs));
}

scene.add(rungs);
scene.add(nodesA);
scene.add(nodesB);

// Ambient Light
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Particles
const particleCount = 1000;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
for(let i=0; i<particleCount*3; i++) {
  particlePos[i] = (Math.random() - 0.5) * 50;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ==========================================
// 4. ANIMATION & SCROLL
// ==========================================

const dnaGroup = new THREE.Group();
dnaGroup.add(strandA);
dnaGroup.add(strandB);
dnaGroup.add(rungs);
dnaGroup.add(nodesA);
dnaGroup.add(nodesB);
scene.add(dnaGroup);

// Move camera along helix based on scroll
ScrollTrigger.create({
  trigger: "#scroll-container",
  start: "top top",
  end: "bottom bottom",
  onUpdate: (self) => {
    // Progress goes from 0 to 1
    const p = self.progress;
    // Move camera Y
    const targetY = - (helixHeight/2) + p * helixHeight;
    gsap.to(camera.position, {
      y: targetY,
      duration: 0.5,
      ease: "power2.out"
    });
    
    // Rotate helix slightly as we scroll
    gsap.to(dnaGroup.rotation, {
      y: p * Math.PI * 4,
      duration: 0.5,
      ease: "power2.out"
    });
  }
});

// Fade in section text
document.querySelectorAll('.section-content').forEach(sec => {
  ScrollTrigger.create({
    trigger: sec.parentElement,
    start: "top center",
    end: "bottom center",
    onEnter: () => gsap.to(sec, { opacity: 1, y: 0, duration: 1 }),
    onLeave: () => gsap.to(sec, { opacity: 0, y: -20, duration: 1 }),
    onEnterBack: () => gsap.to(sec, { opacity: 1, y: 0, duration: 1 }),
    onLeaveBack: () => gsap.to(sec, { opacity: 0, y: 20, duration: 1 }),
  });
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  // Idle rotation
  dnaGroup.rotation.y += 0.002;
  
  // Particles drift
  particles.rotation.y = time * 0.02;
  particles.rotation.x = time * 0.01;

  // Render
  composer.render();
}

animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 5. CHAT ASSISTANT
// ==========================================
document.body.insertAdjacentHTML('beforeend', `
  <div id="chat-assistant">
    <div class="chat-log" id="chat-log">
      <div class="chat-msg bot">Hi! I'm your AI guide. Ask me to "go to projects" or "show skills".</div>
    </div>
    <input type="text" id="chat-input" placeholder="Type a command... (Press Enter)" />
  </div>
`);

const chatInput = document.getElementById('chat-input');
const chatLog = document.getElementById('chat-log');

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    const val = chatInput.value.trim().toLowerCase();
    
    // Add user message
    chatLog.innerHTML += `<div class="chat-msg user">${val}</div>`;
    
    // Simple command parsing
    let response = "I'm not sure how to do that.";
    let targetSection = null;
    
    if (val.includes('project')) {
      response = "Navigating to Projects...";
      targetSection = '#projects';
    } else if (val.includes('skill')) {
      response = "Navigating to Skills...";
      targetSection = '#skills';
    } else if (val.includes('experience') || val.includes('work')) {
      response = "Navigating to Experience...";
      targetSection = '#experience';
    } else if (val.includes('contact')) {
      response = "Navigating to Contact...";
      targetSection = '#contact';
    } else if (val.includes('about')) {
      response = "Navigating to About...";
      targetSection = '#about';
    }

    // Bot response
    setTimeout(() => {
      chatLog.innerHTML += `<div class="chat-msg bot">${response}</div>`;
      chatLog.scrollTop = chatLog.scrollHeight;
      
      if (targetSection) {
        lenis.scrollTo(targetSection, { duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      }
    }, 500);

    chatInput.value = '';
    chatLog.scrollTop = chatLog.scrollHeight;
  }
});

// Hover Nodes logic via Raycaster (simplified)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
