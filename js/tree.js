/**
 * Procedural Tree Generator
 * Creates an organic 3D tree that grows based on skill progress
 */

import * as THREE from 'three';

// Tree configuration
const CONFIG = {
    trunkBaseRadius: 0.15,
    trunkTopRadius: 0.08,
    trunkHeight: 2.5,
    branchLevels: 4,
    branchesPerLevel: [3, 5, 7, 9],
    branchAngleSpread: Math.PI / 3,
    branchLengthFactor: 0.6,
    leafSize: 0.15,
    leafDensity: 8,
    colors: {
        trunk: 0x4a3728,
        trunkDark: 0x2d1f17,
        leaf: 0x4ade80,
        leafDark: 0x22c55e,
        leafMastery: 0xfbbf24,
        glow: 0x4ade80
    }
};

export class SkillTree {
    constructor(scene) {
        this.scene = scene;
        this.treeGroup = new THREE.Group();
        this.branches = [];
        this.leaves = [];
        this.skillNodes = new Map();
        this.targetGrowth = 0.5;
        this.currentGrowth = 0;
        this.glowMeshes = [];

        this.scene.add(this.treeGroup);
    }

    // Initialize tree structure
    init(skills) {
        this.createTrunk();
        this.createBranches();
        this.createLeaves();
        this.createSkillNodes(skills);
        this.createGround();

        // Start at initial growth
        this.updateGrowth(0.3);
    }

    // Create the main trunk
    createTrunk() {
        const trunkGeometry = new THREE.CylinderGeometry(
            CONFIG.trunkTopRadius,
            CONFIG.trunkBaseRadius,
            CONFIG.trunkHeight,
            12,
            8,
            false
        );

        // Add some organic variation to vertices
        const positions = trunkGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            const noise = Math.sin(y * 5) * 0.02 + Math.random() * 0.01;
            positions.setX(i, positions.getX(i) + noise);
            positions.setZ(i, positions.getZ(i) + noise);
        }
        trunkGeometry.computeVertexNormals();

        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.trunk,
            roughness: 0.9,
            metalness: 0.1,
        });

        this.trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        this.trunk.position.y = CONFIG.trunkHeight / 2;
        this.trunk.castShadow = true;
        this.trunk.receiveShadow = true;
        this.treeGroup.add(this.trunk);

        // Add bark texture using lines
        this.addBarkDetails();
    }

    // Add bark texture details
    addBarkDetails() {
        const barkGroup = new THREE.Group();
        const barkMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.colors.trunkDark,
            transparent: true,
            opacity: 0.3
        });

        for (let i = 0; i < 12; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(
                    Math.cos(i * 0.5) * CONFIG.trunkBaseRadius * 1.01,
                    0,
                    Math.sin(i * 0.5) * CONFIG.trunkBaseRadius * 1.01
                ),
                new THREE.Vector3(
                    Math.cos(i * 0.5 + 0.1) * (CONFIG.trunkBaseRadius + CONFIG.trunkTopRadius) / 2 * 1.01,
                    CONFIG.trunkHeight * 0.5,
                    Math.sin(i * 0.5 + 0.1) * (CONFIG.trunkBaseRadius + CONFIG.trunkTopRadius) / 2 * 1.01
                ),
                new THREE.Vector3(
                    Math.cos(i * 0.5 + 0.15) * CONFIG.trunkTopRadius * 1.01,
                    CONFIG.trunkHeight,
                    Math.sin(i * 0.5 + 0.15) * CONFIG.trunkTopRadius * 1.01
                )
            ]);

            const geometry = new THREE.BufferGeometry().setFromPoints(
                curve.getPoints(10)
            );
            const line = new THREE.Line(geometry, barkMaterial);
            barkGroup.add(line);
        }

        this.treeGroup.add(barkGroup);
    }

    // Create branch system
    createBranches() {
        const branchMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.trunk,
            roughness: 0.85,
            metalness: 0.1
        });

        // Generate branches at different heights
        const branchStartHeight = CONFIG.trunkHeight * 0.35;
        const branchEndHeight = CONFIG.trunkHeight * 0.95;

        let branchIndex = 0;
        for (let level = 0; level < CONFIG.branchLevels; level++) {
            const levelHeight = branchStartHeight +
                (branchEndHeight - branchStartHeight) * (level / (CONFIG.branchLevels - 1));

            const branchCount = CONFIG.branchesPerLevel[level];
            const levelRadius = CONFIG.trunkTopRadius +
                (CONFIG.trunkBaseRadius - CONFIG.trunkTopRadius) *
                (1 - levelHeight / CONFIG.trunkHeight);

            for (let b = 0; b < branchCount; b++) {
                const angle = (b / branchCount) * Math.PI * 2 + (level * 0.3);
                const branch = this.createBranch(
                    levelHeight,
                    angle,
                    levelRadius,
                    level,
                    branchMaterial
                );

                branch.userData = {
                    level,
                    index: branchIndex++,
                    baseAngle: angle,
                    baseHeight: levelHeight
                };

                this.branches.push(branch);
                this.treeGroup.add(branch);
            }
        }
    }

    // Create a single branch
    createBranch(height, angle, trunkRadius, level, material) {
        const branchGroup = new THREE.Group();

        // Branch length decreases for higher levels
        const length = (0.8 - level * 0.12) * (0.8 + Math.random() * 0.4);
        const thickness = 0.03 - level * 0.005;

        // Main branch
        const branchGeom = new THREE.CylinderGeometry(
            thickness * 0.5,
            thickness,
            length,
            6
        );

        const branch = new THREE.Mesh(branchGeom, material);
        branch.position.y = length / 2;
        branch.castShadow = true;
        branchGroup.add(branch);

        // Position and rotate the group
        branchGroup.position.set(
            Math.cos(angle) * trunkRadius,
            height,
            Math.sin(angle) * trunkRadius
        );

        // Angle outward and slightly up
        const outwardAngle = Math.PI / 4 + (level * 0.1);
        branchGroup.rotation.z = -outwardAngle * Math.cos(angle);
        branchGroup.rotation.x = outwardAngle * Math.sin(angle);
        branchGroup.rotation.y = angle;

        // Store original scale for growth animation
        branchGroup.userData.originalScale = branchGroup.scale.clone();
        branchGroup.userData.length = length;
        branchGroup.userData.endPosition = new THREE.Vector3(0, length, 0)
            .applyQuaternion(branchGroup.quaternion)
            .add(branchGroup.position);

        return branchGroup;
    }

    // Create leaves
    createLeaves() {
        const leafGeometry = new THREE.SphereGeometry(CONFIG.leafSize, 8, 6);
        leafGeometry.scale(1, 0.6, 1);

        const leafMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.leaf,
            roughness: 0.6,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });

        this.leafMaterial = leafMaterial;

        // Create leaf clusters at branch ends
        this.branches.forEach((branch, branchIdx) => {
            const endPos = branch.userData.endPosition;
            const level = branch.userData.level;

            // More leaves on outer branches
            const leafCount = CONFIG.leafDensity - level;

            for (let i = 0; i < leafCount; i++) {
                const leaf = new THREE.Mesh(leafGeometry, leafMaterial.clone());

                // Cluster around branch end
                const spread = 0.25 + level * 0.05;
                leaf.position.set(
                    endPos.x + (Math.random() - 0.5) * spread,
                    endPos.y + (Math.random() - 0.5) * spread * 0.5 + 0.1,
                    endPos.z + (Math.random() - 0.5) * spread
                );

                leaf.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );

                leaf.scale.setScalar(0.6 + Math.random() * 0.4);
                leaf.castShadow = true;

                leaf.userData = {
                    branchIndex: branchIdx,
                    originalY: leaf.position.y,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.5
                };

                this.leaves.push(leaf);
                this.treeGroup.add(leaf);
            }
        });

        // Create a foliage crown
        this.createFoliageCrown();
    }

    // Create the main foliage crown at the top
    createFoliageCrown() {
        const crownGeometry = new THREE.IcosahedronGeometry(0.6, 2);
        const crownMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.leaf,
            roughness: 0.7,
            metalness: 0.05,
            transparent: true,
            opacity: 0.85
        });

        // Create multiple overlapping spheres for volume
        for (let i = 0; i < 5; i++) {
            const crown = new THREE.Mesh(crownGeometry, crownMaterial.clone());
            crown.position.set(
                (Math.random() - 0.5) * 0.4,
                CONFIG.trunkHeight + 0.2 + Math.random() * 0.3,
                (Math.random() - 0.5) * 0.4
            );
            crown.scale.setScalar(0.5 + Math.random() * 0.5);
            crown.castShadow = true;

            crown.userData.isCrown = true;
            crown.userData.originalY = crown.position.y;
            crown.userData.phase = Math.random() * Math.PI * 2;

            this.leaves.push(crown);
            this.treeGroup.add(crown);
        }
    }

    // Create skill node spheres
    createSkillNodes(skills) {
        const nodeGeometry = new THREE.SphereGeometry(0.12, 16, 16);

        skills.forEach(skill => {
            const stage = this.getStageFromProgress(skill.progress);

            const nodeMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(stage.color),
                roughness: 0.3,
                metalness: 0.5,
                emissive: new THREE.Color(stage.color),
                emissiveIntensity: 0.2
            });

            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);

            // Position based on skill position data
            const pos = skill.position;
            const height = pos.height * CONFIG.trunkHeight;
            node.position.set(
                Math.cos(pos.angle) * pos.radius,
                height,
                Math.sin(pos.angle) * pos.radius
            );

            // Scale based on importance
            const scale = 0.8 + skill.progress * 0.4;
            node.scale.setScalar(scale);

            node.userData = {
                skillId: skill.id,
                skill: skill,
                isSkillNode: true,
                baseScale: scale,
                pulsePhase: Math.random() * Math.PI * 2
            };

            node.castShadow = true;

            // Add glow effect for higher progress
            if (skill.progress > 0.5) {
                this.addNodeGlow(node, stage.color);
            }

            this.skillNodes.set(skill.id, node);
            this.treeGroup.add(node);
        });
    }

    // Add glow effect to a node
    addNodeGlow(node, color) {
        const glowGeometry = new THREE.SphereGeometry(0.18, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.userData.isGlow = true;
        node.add(glow);
        this.glowMeshes.push(glow);
    }

    // Create ground
    createGround() {
        const groundGeometry = new THREE.CircleGeometry(3, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.9,
            metalness: 0.1
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.treeGroup.add(ground);

        // Add subtle grass texture using small cones
        for (let i = 0; i < 80; i++) {
            const grassGeom = new THREE.ConeGeometry(0.02, 0.08, 4);
            const grassMat = new THREE.MeshStandardMaterial({
                color: 0x4ade80,
                roughness: 0.8
            });
            const grass = new THREE.Mesh(grassGeom, grassMat);

            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 2.5;
            grass.position.set(
                Math.cos(angle) * radius,
                0.04,
                Math.sin(angle) * radius
            );
            grass.rotation.x = (Math.random() - 0.5) * 0.3;
            grass.rotation.z = (Math.random() - 0.5) * 0.3;

            this.treeGroup.add(grass);
        }
    }

    // Get growth stage from progress
    getStageFromProgress(progress) {
        const percent = progress * 100;
        const stages = [
            { name: 'Seed', min: 0, max: 10, color: '#6b7280' },
            { name: 'Sprout', min: 10, max: 30, color: '#84cc16' },
            { name: 'Sapling', min: 30, max: 60, color: '#22c55e' },
            { name: 'Mature', min: 60, max: 90, color: '#16a34a' },
            { name: 'Mastery', min: 90, max: 100, color: '#fbbf24' }
        ];

        return stages.find(s => percent >= s.min && percent < s.max) || stages[4];
    }

    // Update overall growth (0-1)
    updateGrowth(progress) {
        this.targetGrowth = Math.max(0.1, progress);
    }

    // Update skill node appearance
    updateSkillNode(skillId, skill) {
        const node = this.skillNodes.get(skillId);
        if (!node) return;

        const stage = this.getStageFromProgress(skill.progress);

        // Update color
        node.material.color.set(stage.color);
        node.material.emissive.set(stage.color);
        node.material.emissiveIntensity = 0.2 + skill.progress * 0.3;

        // Update scale
        const scale = 0.8 + skill.progress * 0.4;
        node.userData.baseScale = scale;

        // Add/update glow for mastery
        if (skill.progress >= 0.9) {
            node.material.emissiveIntensity = 0.5;
            if (!node.children.some(c => c.userData.isGlow)) {
                this.addNodeGlow(node, stage.color);
            }
        }

        node.userData.skill = skill;
    }

    // Apply decay visual effects
    applyDecayVisual() {
        // Leaves turn brown and droop
        this.leaves.forEach(leaf => {
            if (!leaf.userData.isCrown) {
                leaf.material.color.lerp(new THREE.Color(0x8b7355), 0.3);
            }
        });

        // Reduce tree size slightly
        this.targetGrowth = Math.max(0.2, this.targetGrowth - 0.1);
    }

    // Animate the tree with realistic wind effects
    animate(deltaTime, time) {
        // Smooth growth interpolation
        this.currentGrowth += (this.targetGrowth - this.currentGrowth) * deltaTime * 2;

        // Scale tree based on growth
        const growthScale = 0.3 + this.currentGrowth * 0.7;
        this.treeGroup.scale.setScalar(growthScale);

        // Wind parameters - creates natural, varying wind
        const windStrength = 0.015;
        const windFrequency = 0.8;
        const gustStrength = Math.sin(time * 0.3) * 0.5 + 0.5; // Varying gusts

        // Primary wind direction changes slowly
        const windAngle = time * 0.1;
        const windX = Math.cos(windAngle) * windStrength * (1 + gustStrength);
        const windZ = Math.sin(windAngle) * windStrength * (1 + gustStrength);

        // Subtle trunk sway
        if (this.trunk) {
            const trunkSway = Math.sin(time * windFrequency) * 0.02 * gustStrength;
            this.trunk.rotation.x = trunkSway * windZ * 2;
            this.trunk.rotation.z = trunkSway * windX * 2;
        }

        // Animate branches with realistic sway
        this.branches.forEach((branch, idx) => {
            const level = branch.userData.level || 0;
            const baseAngle = branch.userData.baseAngle || 0;

            // Higher branches sway more
            const swayMultiplier = 1 + level * 0.5;
            const phaseOffset = idx * 0.7; // Each branch has different timing

            // Complex wind motion combining multiple frequencies
            const sway1 = Math.sin(time * windFrequency + phaseOffset) * windStrength * swayMultiplier;
            const sway2 = Math.sin(time * windFrequency * 1.7 + phaseOffset * 0.5) * windStrength * 0.4 * swayMultiplier;
            const sway3 = Math.sin(time * windFrequency * 0.3 + phaseOffset * 0.3) * windStrength * 0.2 * gustStrength;

            const totalSway = (sway1 + sway2 + sway3) * gustStrength;

            // Apply sway based on wind direction
            branch.rotation.x += (totalSway * Math.sin(windAngle) - branch.rotation.x * 0.1) * deltaTime * 5;
            branch.rotation.z += (totalSway * Math.cos(windAngle) - branch.rotation.z * 0.1) * deltaTime * 5;
        });

        // Animate leaves with natural, independent motion
        this.leaves.forEach((leaf, idx) => {
            const phase = leaf.userData.phase || idx * 0.5;
            const speed = leaf.userData.speed || 1;
            const originalY = leaf.userData.originalY;
            const isCrown = leaf.userData.isCrown;

            // Vertical bobbing
            const bobAmount = isCrown ? 0.03 : 0.02;
            leaf.position.y = originalY + Math.sin(time * speed + phase) * bobAmount * gustStrength;

            // Horizontal sway influenced by wind
            const leafSway = Math.sin(time * speed * 1.2 + phase) * 0.03 * gustStrength;
            leaf.position.x += (leafSway * windX - leaf.position.x * 0.01) * deltaTime;
            leaf.position.z += (leafSway * windZ - leaf.position.z * 0.01) * deltaTime;

            // Rotation flutter (like leaves catching wind)
            leaf.rotation.x += Math.sin(time * speed * 2 + phase) * 0.02 * gustStrength;
            leaf.rotation.y += Math.sin(time * speed * 1.5 + phase * 0.5) * 0.03 * gustStrength;
            leaf.rotation.z = Math.sin(time * speed * 0.8 + phase) * 0.15 * gustStrength;
        });

        // Animate skill nodes with gentle pulsing
        this.skillNodes.forEach(node => {
            const phase = node.userData.pulsePhase;
            const baseScale = node.userData.baseScale;

            // Subtle breathing pulse
            const pulse = 1 + Math.sin(time * 1.5 + phase) * 0.03;
            node.scale.setScalar(baseScale * pulse);

            // Very subtle position drift
            const drift = Math.sin(time * 0.5 + phase) * 0.005;
            node.position.y += drift * deltaTime;
        });

        // Animate glow meshes with pulsing opacity
        this.glowMeshes.forEach((glow, idx) => {
            glow.material.opacity = 0.15 + Math.sin(time * 2 + idx) * 0.1;
            glow.scale.setScalar(1 + Math.sin(time * 3 + idx * 0.5) * 0.1);
        });
    }

    // Get skill node at screen position (for raycasting)
    getSkillNodes() {
        return Array.from(this.skillNodes.values());
    }

    // Dispose resources
    dispose() {
        this.treeGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        this.scene.remove(this.treeGroup);
    }
}

export default SkillTree;
