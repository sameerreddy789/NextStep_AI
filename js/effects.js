/**
 * Visual Effects System
 * Particles, glows, and ambient effects for the skill tree
 */

import * as THREE from 'three';

export class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.activeEffects = [];

        this.initAmbientParticles();
    }

    // Create floating ambient particles (pollen/dust)
    initAmbientParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 8;
            positions[i3 + 1] = Math.random() * 5;
            positions[i3 + 2] = (Math.random() - 0.5) * 8;

            // Soft golden/green colors
            const isGolden = Math.random() > 0.7;
            if (isGolden) {
                colors[i3] = 1;
                colors[i3 + 1] = 0.85;
                colors[i3 + 2] = 0.4;
            } else {
                colors[i3] = 0.4;
                colors[i3 + 1] = 0.9;
                colors[i3 + 2] = 0.5;
            }

            sizes[i] = 0.02 + Math.random() * 0.03;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.ambientParticles = new THREE.Points(geometry, material);
        this.ambientParticleData = [];

        for (let i = 0; i < particleCount; i++) {
            this.ambientParticleData.push({
                baseY: positions[i * 3 + 1],
                phase: Math.random() * Math.PI * 2,
                speed: 0.2 + Math.random() * 0.3,
                driftX: (Math.random() - 0.5) * 0.5,
                driftZ: (Math.random() - 0.5) * 0.5
            });
        }

        this.scene.add(this.ambientParticles);
    }

    // Create growth burst effect when skill progresses
    createGrowthBurst(position, color = 0x4ade80) {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;

            // Random burst directions
            velocities.push({
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 2 + 0.5,
                z: (Math.random() - 0.5) * 2
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.08,
            color: color,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.activeEffects.push({
            type: 'burst',
            mesh: particles,
            velocities,
            life: 1,
            maxLife: 1
        });
    }

    // Create falling leaves effect for decay
    createFallingLeaves(treePosition, count = 20) {
        const leafGeometry = new THREE.PlaneGeometry(0.1, 0.08);
        const leafMaterial = new THREE.MeshBasicMaterial({
            color: 0xc9a227,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < count; i++) {
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial.clone());

            leaf.position.set(
                treePosition.x + (Math.random() - 0.5) * 2,
                treePosition.y + 2 + Math.random() * 1.5,
                treePosition.z + (Math.random() - 0.5) * 2
            );

            this.scene.add(leaf);

            this.activeEffects.push({
                type: 'fallingLeaf',
                mesh: leaf,
                velocity: {
                    x: (Math.random() - 0.5) * 0.5,
                    y: -0.5 - Math.random() * 0.5,
                    z: (Math.random() - 0.5) * 0.5
                },
                rotationSpeed: {
                    x: Math.random() * 2,
                    y: Math.random() * 2,
                    z: Math.random() * 2
                },
                life: 3,
                maxLife: 3
            });
        }
    }

    // Create mastery glow ring effect
    createMasteryAura(position) {
        const ringGeometry = new THREE.RingGeometry(0.2, 0.25, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2;

        this.scene.add(ring);

        this.activeEffects.push({
            type: 'masteryRing',
            mesh: ring,
            life: 2,
            maxLife: 2,
            startScale: 0.5,
            endScale: 2
        });
    }

    // Create sparkle trail for active learning
    createSparkleTrail(startPos, endPos, color = 0x4ade80) {
        const curve = new THREE.QuadraticBezierCurve3(
            startPos,
            new THREE.Vector3(
                (startPos.x + endPos.x) / 2,
                Math.max(startPos.y, endPos.y) + 1,
                (startPos.z + endPos.z) / 2
            ),
            endPos
        );

        const points = curve.getPoints(20);

        points.forEach((point, i) => {
            setTimeout(() => {
                this.createGrowthBurst(point, color);
            }, i * 50);
        });
    }

    // Update all active effects
    update(deltaTime, time) {
        // Update ambient particles floating
        if (this.ambientParticles) {
            const positions = this.ambientParticles.geometry.attributes.position.array;

            for (let i = 0; i < this.ambientParticleData.length; i++) {
                const data = this.ambientParticleData[i];
                const i3 = i * 3;

                // Gentle floating motion
                positions[i3 + 1] = data.baseY + Math.sin(time * data.speed + data.phase) * 0.3;
                positions[i3] += data.driftX * deltaTime * 0.1;
                positions[i3 + 2] += data.driftZ * deltaTime * 0.1;

                // Wrap around
                if (positions[i3] > 4) positions[i3] = -4;
                if (positions[i3] < -4) positions[i3] = 4;
                if (positions[i3 + 2] > 4) positions[i3 + 2] = -4;
                if (positions[i3 + 2] < -4) positions[i3 + 2] = 4;
            }

            this.ambientParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Update active effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.life -= deltaTime;

            const lifeRatio = effect.life / effect.maxLife;

            if (effect.type === 'burst') {
                const positions = effect.mesh.geometry.attributes.position.array;

                for (let j = 0; j < effect.velocities.length; j++) {
                    const j3 = j * 3;
                    positions[j3] += effect.velocities[j].x * deltaTime;
                    positions[j3 + 1] += effect.velocities[j].y * deltaTime;
                    positions[j3 + 2] += effect.velocities[j].z * deltaTime;

                    // Gravity
                    effect.velocities[j].y -= deltaTime * 2;
                }

                effect.mesh.geometry.attributes.position.needsUpdate = true;
                effect.mesh.material.opacity = lifeRatio;
            }

            if (effect.type === 'fallingLeaf') {
                effect.mesh.position.x += effect.velocity.x * deltaTime;
                effect.mesh.position.y += effect.velocity.y * deltaTime;
                effect.mesh.position.z += effect.velocity.z * deltaTime;

                effect.mesh.rotation.x += effect.rotationSpeed.x * deltaTime;
                effect.mesh.rotation.y += effect.rotationSpeed.y * deltaTime;

                // Sway motion
                effect.velocity.x = Math.sin(time * 2) * 0.3;

                effect.mesh.material.opacity = lifeRatio;
            }

            if (effect.type === 'masteryRing') {
                const scale = effect.startScale + (effect.endScale - effect.startScale) * (1 - lifeRatio);
                effect.mesh.scale.setScalar(scale);
                effect.mesh.material.opacity = lifeRatio * 0.8;
            }

            // Remove expired effects
            if (effect.life <= 0) {
                this.scene.remove(effect.mesh);
                if (effect.mesh.geometry) effect.mesh.geometry.dispose();
                if (effect.mesh.material) effect.mesh.material.dispose();
                this.activeEffects.splice(i, 1);
            }
        }
    }

    // Dispose all effects
    dispose() {
        if (this.ambientParticles) {
            this.scene.remove(this.ambientParticles);
            this.ambientParticles.geometry.dispose();
            this.ambientParticles.material.dispose();
        }

        this.activeEffects.forEach(effect => {
            this.scene.remove(effect.mesh);
            if (effect.mesh.geometry) effect.mesh.geometry.dispose();
            if (effect.mesh.material) effect.mesh.material.dispose();
        });

        this.activeEffects = [];
    }
}

export default EffectsManager;
