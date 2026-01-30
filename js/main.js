/**
 * Living Skill Tree - Main Application
 * Integrates Three.js scene, skill tree, effects, and UI
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SkillTree } from './tree.js';
import { skillManager } from './skills.js';
import { EffectsManager } from './effects.js';
import { uiManager } from './ui.js';

class SkillTreeApp {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.hoveredNode = null;

        this.init();
    }

    init() {
        this.setupScene();
        this.setupLighting();
        this.setupControls();
        this.setupTree();
        this.setupEffects();
        this.setupEventListeners();
        this.setupUICallbacks();

        // Start animation loop
        this.animate();

        // Play intro animation
        this.playIntroAnimation();
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();

        // Create gradient background with fog
        this.scene.background = new THREE.Color(0x0a0a1a);
        this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.08);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(4, 3, 5);
        this.camera.lookAt(0, 1.5, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.container.appendChild(this.renderer.domElement);

        // Add starfield background
        this.createStarfield();

        // Add atmospheric glow
        this.createAtmosphericGlow();
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 500;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 30 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 0.1,
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    createAtmosphericGlow() {
        // Ground glow
        const groundGlowGeom = new THREE.CircleGeometry(4, 32);
        const groundGlowMat = new THREE.MeshBasicMaterial({
            color: 0x4ade80,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });

        const groundGlow = new THREE.Mesh(groundGlowGeom, groundGlowMat);
        groundGlow.rotation.x = -Math.PI / 2;
        groundGlow.position.y = 0.01;
        this.scene.add(groundGlow);
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);

        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
        sunLight.position.set(5, 10, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 30;
        sunLight.shadow.camera.left = -10;
        sunLight.shadow.camera.right = 10;
        sunLight.shadow.camera.top = 10;
        sunLight.shadow.camera.bottom = -10;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);

        // Fill light from below (ground bounce)
        const fillLight = new THREE.DirectionalLight(0x4ade80, 0.3);
        fillLight.position.set(0, -2, 0);
        this.scene.add(fillLight);

        // Rim light for drama
        const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.4);
        rimLight.position.set(-5, 3, -5);
        this.scene.add(rimLight);

        // Point light at tree top for glow
        this.treeGlow = new THREE.PointLight(0x4ade80, 0.5, 5);
        this.treeGlow.position.set(0, 3, 0);
        this.scene.add(this.treeGlow);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 15;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.3;
        this.controls.minPolarAngle = 0.2;
        this.controls.target.set(0, 1.5, 0);
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.3;
    }

    setupTree() {
        this.skillTree = new SkillTree(this.scene);
        this.skillTree.init(skillManager.getAllSkills());

        // Update tree growth based on overall progress
        const overallProgress = skillManager.getOverallProgress();
        this.skillTree.updateGrowth(overallProgress);
    }

    setupEffects() {
        this.effects = new EffectsManager(this.scene);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onResize());

        // Mouse move for hover effects
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Click for selection
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

        // Stop auto-rotate when interacting
        this.renderer.domElement.addEventListener('pointerdown', () => {
            this.controls.autoRotate = false;
        });

        // Resume auto-rotate after idle
        let idleTimeout;
        this.renderer.domElement.addEventListener('pointerup', () => {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(() => {
                this.controls.autoRotate = true;
            }, 5000);
        });
    }

    setupUICallbacks() {
        uiManager.setCallbacks({
            onPractice: (skillId, amount) => {
                const result = skillManager.addProgress(skillId, amount);
                if (result) {
                    const node = this.skillTree.skillNodes.get(skillId);
                    if (node) {
                        this.effects.createGrowthBurst(node.position.clone(), 0x4ade80);
                    }
                    this.skillTree.updateSkillNode(skillId, result);
                    this.skillTree.updateGrowth(skillManager.getOverallProgress());
                    uiManager.refreshCurrentSkill();
                    uiManager.showNotification(`${result.name} grew! +${amount * 100}%`, 'success');
                }
            },
            onChallenge: (skillId, amount) => {
                const result = skillManager.addProgress(skillId, amount);
                if (result) {
                    const node = this.skillTree.skillNodes.get(skillId);
                    if (node) {
                        this.effects.createMasteryAura(node.position.clone());
                        this.effects.createGrowthBurst(node.position.clone(), 0xfbbf24);
                    }
                    this.skillTree.updateSkillNode(skillId, result);
                    this.skillTree.updateGrowth(skillManager.getOverallProgress());
                    uiManager.refreshCurrentSkill();
                    uiManager.showNotification(`Challenge complete! ${result.name} +${amount * 100}%`, 'success');
                }
            },
            onGrowAll: () => {
                const growthResults = skillManager.growAll(0.1);
                growthResults.forEach(result => {
                    const node = this.skillTree.skillNodes.get(result.skillId);
                    if (node) {
                        this.effects.createGrowthBurst(node.position.clone());
                    }
                    this.skillTree.updateSkillNode(result.skillId, result.skill);
                });
                this.skillTree.updateGrowth(skillManager.getOverallProgress());
                uiManager.refreshCurrentSkill();
                uiManager.showNotification('All skills grew! 🌱', 'success');
            },
            onDecay: () => {
                const decayResults = skillManager.applyDecay(0.15);
                if (decayResults.length > 0) {
                    this.effects.createFallingLeaves(new THREE.Vector3(0, 0, 0), 25);
                    this.skillTree.applyDecayVisual();
                    decayResults.forEach(result => {
                        this.skillTree.updateSkillNode(result.skillId, result.skill);
                    });
                    this.skillTree.updateGrowth(skillManager.getOverallProgress());
                    uiManager.refreshCurrentSkill();
                    uiManager.showNotification('Skills decayed from inactivity 🍂', 'decay');
                } else {
                    uiManager.showNotification('All skills are well maintained!', 'success');
                }
            },
            onReset: () => {
                skillManager.reset();
                this.scene.remove(this.skillTree.treeGroup);
                this.skillTree = new SkillTree(this.scene);
                this.skillTree.init(skillManager.getAllSkills());
                this.skillTree.updateGrowth(skillManager.getOverallProgress());
                uiManager.refreshCurrentSkill();
                uiManager.closePanel();
                uiManager.showNotification('Tree reset to initial state', 'success');
            }
        });

        // Subscribe to skill changes
        skillManager.subscribe((eventType, data) => {
            uiManager.updateHeaderStats();
        });
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast to skill nodes
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.skillTree.getSkillNodes());

        if (intersects.length > 0) {
            const node = intersects[0].object;

            if (this.hoveredNode !== node) {
                // Reset previous hover
                if (this.hoveredNode) {
                    this.hoveredNode.material.emissiveIntensity = 0.2;
                }

                // Apply new hover
                this.hoveredNode = node;
                node.material.emissiveIntensity = 0.5;

                // Show tooltip
                const skill = node.userData.skill;
                if (skill) {
                    uiManager.showTooltip(
                        `${skill.icon} ${skill.name} - ${Math.round(skill.progress * 100)}%`,
                        event.clientX,
                        event.clientY
                    );
                }
            }

            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            if (this.hoveredNode) {
                this.hoveredNode.material.emissiveIntensity = 0.2;
                this.hoveredNode = null;
            }
            uiManager.hideTooltip();
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    onClick(event) {
        // Only handle clicks on canvas, not UI
        if (event.target !== this.renderer.domElement) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.skillTree.getSkillNodes());

        if (intersects.length > 0) {
            const node = intersects[0].object;
            const skillId = node.userData.skillId;

            if (skillId) {
                skillManager.selectSkill(skillId);
                uiManager.showSkillPanel(skillId);

                // Camera focus animation
                this.focusOnNode(node);
            }
        }
    }

    focusOnNode(node) {
        const targetPosition = node.position.clone();

        // Animate camera target
        const startTarget = this.controls.target.clone();
        const duration = 1000;
        const startTime = Date.now();

        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.controls.target.lerpVectors(startTarget, targetPosition, eased);

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };

        animateCamera();
    }

    playIntroAnimation() {
        // Start camera far and zoom in
        this.camera.position.set(12, 8, 12);

        const targetPosition = new THREE.Vector3(4, 3, 5);
        const duration = 3000;
        const startTime = Date.now();
        const startPosition = this.camera.position.clone();

        const animateIntro = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.camera.position.lerpVectors(startPosition, targetPosition, eased);

            if (progress < 1) {
                requestAnimationFrame(animateIntro);
            }
        };

        animateIntro();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // Update controls
        this.controls.update();

        // Animate tree (realistic gentle sway)
        this.skillTree.animate(deltaTime, time);

        // Update effects
        this.effects.update(deltaTime, time);

        // Slowly rotate stars
        if (this.stars) {
            this.stars.rotation.y += deltaTime * 0.01;
        }

        // Pulse tree glow
        if (this.treeGlow) {
            this.treeGlow.intensity = 0.4 + Math.sin(time * 2) * 0.1;
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SkillTreeApp();
});
