import * as THREE from 'three';

export const DeviceType = {
    INCENSE_BURNER: 'incense_burner',
    BRONZE_JIN: 'bronze_jin',
    ARMILLARY_SPHERE: 'armillary_sphere',
    MODERN_GYRO: 'modern_gyro'
};

const DEFAULT_DEVICE_CONFIGS = {
    [DeviceType.INCENSE_BURNER]: {
        outerRing: { radius: 1.5, tube: 0.04, color: 0x22d3ee, emissive: 0x0891b2, wireOpacity: 0.7, solidOpacity: 0.5 },
        innerRing: { radius: 1.1, tube: 0.035, color: 0xa78bfa, emissive: 0x7c3aed, wireOpacity: 0.75, solidOpacity: 0.5 },
        body: { radius: 0.55, color: 0xd4a853, emissive: 0x92400e, opacity: 0.92 },
        shell: { color: 0xb8860b, emissive: 0x78350f, opacity: 0.35 },
        glow: { radius: 0.25, color: 0xff6600, opacity: 0.85, lightColor: 0xff5500, lightIntensity: 1.5 },
        decoration: { color: 0xf4d487, emissive: 0x92400e }
    },
    [DeviceType.BRONZE_JIN]: {
        outerRing: { radius: 1.6, tube: 0.05, color: 0x8b7355, emissive: 0x4a3c2a, wireOpacity: 0.75, solidOpacity: 0.55 },
        innerRing: { radius: 1.2, tube: 0.045, color: 0xa08060, emissive: 0x5a4a3a, wireOpacity: 0.8, solidOpacity: 0.6 },
        body: { radius: 0.6, color: 0xc49a6c, emissive: 0x6b4423, opacity: 0.95 },
        table: { length: 2.2, width: 1.4, height: 0.15, color: 0x8b6914, emissive: 0x4a3808, opacity: 0.9 },
        legs: { radius: 0.08, height: 0.5, color: 0x6b4423, emissive: 0x3a2410, opacity: 1.0 },
        pattern: { color: 0xd4a853, emissive: 0x92400e }
    },
    [DeviceType.ARMILLARY_SPHERE]: {
        outerRing: { radius: 1.7, tube: 0.035, color: 0xfbbf24, emissive: 0x92400e, wireOpacity: 0.7, solidOpacity: 0.45 },
        middleRing: { radius: 1.4, tube: 0.03, color: 0xf59e0b, emissive: 0x78350f, wireOpacity: 0.75, solidOpacity: 0.5 },
        innerRing: { radius: 1.1, tube: 0.025, color: 0xd97706, emissive: 0x451a03, wireOpacity: 0.8, solidOpacity: 0.55 },
        body: { radius: 0.45, color: 0x92400e, emissive: 0x451a03, opacity: 0.9 },
        axis: { radius: 0.03, height: 2.0, color: 0x78350f, emissive: 0x451a03, opacity: 1.0 },
        star: { color: 0xfef3c7, emissive: 0xfbbf24 }
    },
    [DeviceType.MODERN_GYRO]: {
        outerRing: { radius: 1.4, tube: 0.05, color: 0x60a5fa, emissive: 0x1d4ed8, wireOpacity: 0.6, solidOpacity: 0.4 },
        innerRing: { radius: 1.0, tube: 0.045, color: 0x34d399, emissive: 0x047857, wireOpacity: 0.65, solidOpacity: 0.45 },
        body: { radius: 0.5, color: 0xe5e7eb, emissive: 0x374151, opacity: 0.95 },
        rotor: { radius: 0.45, tube: 0.08, color: 0xf97316, emissive: 0xc2410c, opacity: 0.9 },
        motor: { radius: 0.18, height: 0.3, color: 0x6b7280, emissive: 0x1f2937, opacity: 1.0 },
        marks: { color: 0xfbbf24, emissive: 0x92400e }
    }
};

export class MultiDevice3D {
    constructor(canvasElement, deviceConfig = {}) {
        this.canvas = canvasElement;
        this.deviceType = deviceConfig.type || DeviceType.INCENSE_BURNER;
        this.overrides = deviceConfig.overrides || {};
        this.config = this._mergeConfig(this.deviceType, this.overrides);

        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.outerRing = null;
        this.middleRing = null;
        this.innerRing = null;
        this.body = null;
        this.rotorGroup = null;

        this.cameraAngleX = 0.7;
        this.cameraAngleY = 0.55;
        this.cameraDistance = 5.5;

        this.isDragging = false;
        this.prevMouseX = 0;
        this.prevMouseY = 0;

        this.init();
    }

    _mergeConfig(type, overrides) {
        const base = DEFAULT_DEVICE_CONFIGS[type] || DEFAULT_DEVICE_CONFIGS[DeviceType.INCENSE_BURNER];
        return this._deepMerge(base, overrides);
    }

    _deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source || {})) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    switchDevice(type, overrides = {}) {
        this.deviceType = type;
        this.overrides = overrides;
        this.config = this._mergeConfig(type, overrides);

        if (this.outerRing) this.scene.remove(this.outerRing);
        this.outerRing = null;
        this.middleRing = null;
        this.innerRing = null;
        this.body = null;
        this.rotorGroup = null;

        this._createDeviceModel();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050810);
        this.scene.fog = new THREE.Fog(0x050810, 8, 20);

        const container = this.canvas;
        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        this.camera.position.set(3.5, 2.5, 4);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.sortObjects = true;

        this._addLights();
        this._createGroundGrid();
        this._createDeviceModel();
        this._setupInteraction();

        window.addEventListener('resize', () => this._handleResize());

        this._animate();
    }

    _addLights() {
        const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffeedd, 0.9);
        keyLight.position.set(5, 8, 5);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xd4a853, 0.4);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        const rimLight = new THREE.PointLight(0xd4a853, 0.8, 10);
        rimLight.position.set(0, -3, 0);
        this.scene.add(rimLight);
    }

    _createGroundGrid() {
        const gridHelper = new THREE.GridHelper(10, 20, 0x1a2233, 0x121826);
        gridHelper.position.y = -2.5;
        this.scene.add(gridHelper);

        const groundGeometry = new THREE.CircleGeometry(5, 64);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0e17,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2.49;
        ground.renderOrder = 0;
        this.scene.add(ground);
    }

    _createRing(cfg, baseRenderOrder, rotationAxis = null) {
        const group = new THREE.Group();
        group.renderOrder = baseRenderOrder;

        const wireMat = new THREE.MeshBasicMaterial({
            color: cfg.color,
            wireframe: true,
            transparent: true,
            opacity: cfg.wireOpacity,
            depthWrite: false,
            depthTest: true
        });
        const wireMesh = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 80), wireMat);
        wireMesh.renderOrder = baseRenderOrder;
        if (rotationAxis) wireMesh.rotation[rotationAxis] = Math.PI / 2;
        group.add(wireMesh);

        const solidMat = new THREE.MeshPhongMaterial({
            color: cfg.color,
            emissive: cfg.emissive,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: cfg.solidOpacity,
            depthWrite: false,
            depthTest: true
        });
        const solidMesh = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius, cfg.tube * 0.4, 8, 80), solidMat);
        solidMesh.renderOrder = baseRenderOrder;
        if (rotationAxis) solidMesh.rotation[rotationAxis] = Math.PI / 2;
        group.add(solidMesh);

        return group;
    }

    _createDeviceModel() {
        switch (this.deviceType) {
            case DeviceType.INCENSE_BURNER:
                this._createIncenseBurner();
                break;
            case DeviceType.BRONZE_JIN:
                this._createBronzeJin();
                break;
            case DeviceType.ARMILLARY_SPHERE:
                this._createArmillarySphere();
                break;
            case DeviceType.MODERN_GYRO:
                this._createModernGyro();
                break;
            default:
                this._createIncenseBurner();
        }
    }

    _createIncenseBurner() {
        const cfg = this.config;

        const outerGroup = this._createRing(cfg.outerRing, 1, null);
        this.scene.add(outerGroup);
        this.outerRing = outerGroup;

        const innerGroup = this._createRing(cfg.innerRing, 2, 'x');
        outerGroup.add(innerGroup);
        this.innerRing = innerGroup;

        const bodyGroup = new THREE.Group();
        bodyGroup.renderOrder = 3;
        innerGroup.add(bodyGroup);
        this.body = bodyGroup;

        const bodyMat = new THREE.MeshPhongMaterial({
            color: cfg.body.color,
            emissive: cfg.body.emissive,
            emissiveIntensity: 0.2,
            shininess: 80,
            specular: 0xf4d487,
            transparent: true,
            opacity: cfg.body.opacity,
            depthWrite: true,
            depthTest: true
        });
        const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.body.radius, 48, 32), bodyMat);
        bodyMesh.renderOrder = 3;
        bodyGroup.add(bodyMesh);

        const shellMat = new THREE.MeshPhongMaterial({
            color: cfg.shell.color,
            emissive: cfg.shell.emissive,
            emissiveIntensity: 0.15,
            shininess: 100,
            transparent: true,
            opacity: cfg.shell.opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true
        });
        const shellGeo = new THREE.SphereGeometry(cfg.body.radius * 1.05, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.renderOrder = 4;
        bodyGroup.add(shell);

        const glowMat = new THREE.MeshBasicMaterial({
            color: cfg.glow.color,
            transparent: true,
            opacity: cfg.glow.opacity,
            depthWrite: false,
            depthTest: true
        });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(cfg.glow.radius, 24, 24), glowMat);
        glow.position.y = -0.1;
        glow.renderOrder = 5;
        bodyGroup.add(glow);

        const light = new THREE.PointLight(cfg.glow.lightColor, cfg.glow.lightIntensity, 4);
        light.position.y = -0.1;
        bodyGroup.add(light);

        this._addIncenseDecorations(bodyGroup);
    }

    _addIncenseDecorations(group) {
        const cfg = this.config.decoration;
        const patternMat = new THREE.MeshPhongMaterial({
            color: cfg.color,
            emissive: cfg.emissive,
            emissiveIntensity: 0.3,
            shininess: 120,
            depthWrite: true,
            depthTest: true
        });

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), patternMat);
            dot.renderOrder = 4;
            dot.position.set(Math.cos(angle) * 0.5, 0.2, Math.sin(angle) * 0.5);
            group.add(dot);
        }

        const vineMat = new THREE.MeshPhongMaterial({
            color: 0xd4a853,
            emissive: 0x78350f,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });
        const vineGeo = new THREE.TorusGeometry(0.5, 0.008, 8, 100);
        [-0.15, 0.15].forEach(y => {
            const vine = new THREE.Mesh(vineGeo, vineMat);
            vine.rotation.x = Math.PI / 2;
            vine.position.y = y;
            group.add(vine);
        });
    }

    _createBronzeJin() {
        const cfg = this.config;

        const outerGroup = this._createRing(cfg.outerRing, 1, null);
        this.scene.add(outerGroup);
        this.outerRing = outerGroup;

        const innerGroup = this._createRing(cfg.innerRing, 2, 'x');
        outerGroup.add(innerGroup);
        this.innerRing = innerGroup;

        const bodyGroup = new THREE.Group();
        bodyGroup.renderOrder = 3;
        innerGroup.add(bodyGroup);
        this.body = bodyGroup;

        const tableMat = new THREE.MeshPhongMaterial({
            color: cfg.table.color,
            emissive: cfg.table.emissive,
            emissiveIntensity: 0.2,
            shininess: 60,
            specular: 0xd4a853,
            transparent: true,
            opacity: cfg.table.opacity,
            depthWrite: true,
            depthTest: true
        });
        const tableGeo = new THREE.BoxGeometry(cfg.table.length, cfg.table.height, cfg.table.width);
        const tableMesh = new THREE.Mesh(tableGeo, tableMat);
        tableMesh.renderOrder = 3;
        bodyGroup.add(tableMesh);

        const bodyMat = new THREE.MeshPhongMaterial({
            color: cfg.body.color,
            emissive: cfg.body.emissive,
            emissiveIntensity: 0.25,
            shininess: 70,
            specular: 0xf4d487,
            transparent: true,
            opacity: cfg.body.opacity,
            depthWrite: true,
            depthTest: true
        });
        const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.body.radius, 48, 32), bodyMat);
        bodyMesh.position.y = cfg.table.height / 2 + cfg.body.radius * 0.8;
        bodyMesh.renderOrder = 4;
        bodyGroup.add(bodyMesh);

        const legMat = new THREE.MeshPhongMaterial({
            color: cfg.legs.color,
            emissive: cfg.legs.emissive,
            emissiveIntensity: 0.2,
            shininess: 50,
            transparent: cfg.legs.opacity < 1.0,
            opacity: cfg.legs.opacity,
            depthWrite: true,
            depthTest: true
        });
        const legGeo = new THREE.CylinderGeometry(cfg.legs.radius, cfg.legs.radius * 1.2, cfg.legs.height, 16);
        const halfL = cfg.table.length / 2 - cfg.legs.radius * 1.5;
        const halfW = cfg.table.width / 2 - cfg.legs.radius * 1.5;
        const legY = -(cfg.table.height / 2 + cfg.legs.height / 2);
        [[halfL, legY, halfW], [-halfL, legY, halfW], [halfL, legY, -halfW], [-halfL, legY, -halfW]].forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.renderOrder = 3;
            bodyGroup.add(leg);
        });

        this._addBronzePattern(bodyGroup);
    }

    _addBronzePattern(group) {
        const cfg = this.config.pattern;
        const patternMat = new THREE.MeshPhongMaterial({
            color: cfg.color,
            emissive: cfg.emissive,
            emissiveIntensity: 0.25,
            shininess: 80,
            depthWrite: true,
            depthTest: true
        });

        const tableCfg = this.config.table;
        const halfL = tableCfg.length / 2 - 0.08;
        const halfW = tableCfg.width / 2 - 0.08;
        const y = tableCfg.height / 2 + 0.005;

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = Math.min(halfL, halfW) * 0.6;
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), patternMat);
            dot.renderOrder = 4;
            dot.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
            group.add(dot);
        }

        const bandGeo = new THREE.BoxGeometry(tableCfg.length - 0.1, 0.015, 0.02);
        [-halfW * 0.6, halfW * 0.6].forEach(z => {
            const band = new THREE.Mesh(bandGeo, patternMat);
            band.renderOrder = 4;
            band.position.set(0, y, z);
            group.add(band);
        });
    }

    _createArmillarySphere() {
        const cfg = this.config;

        const outerGroup = this._createRing(cfg.outerRing, 1, null);
        this.scene.add(outerGroup);
        this.outerRing = outerGroup;

        const middleGroup = this._createRing(cfg.middleRing, 2, 'y');
        outerGroup.add(middleGroup);
        this.middleRing = middleGroup;

        const innerGroup = this._createRing(cfg.innerRing, 3, 'x');
        middleGroup.add(innerGroup);
        this.innerRing = innerGroup;

        const bodyGroup = new THREE.Group();
        bodyGroup.renderOrder = 4;
        innerGroup.add(bodyGroup);
        this.body = bodyGroup;

        const axisMat = new THREE.MeshPhongMaterial({
            color: cfg.axis.color,
            emissive: cfg.axis.emissive,
            emissiveIntensity: 0.3,
            shininess: 60,
            transparent: cfg.axis.opacity < 1.0,
            opacity: cfg.axis.opacity,
            depthWrite: true,
            depthTest: true
        });
        const axisGeo = new THREE.CylinderGeometry(cfg.axis.radius, cfg.axis.radius, cfg.axis.height, 16);
        const axis = new THREE.Mesh(axisGeo, axisMat);
        axis.renderOrder = 4;
        bodyGroup.add(axis);

        const bodyMat = new THREE.MeshPhongMaterial({
            color: cfg.body.color,
            emissive: cfg.body.emissive,
            emissiveIntensity: 0.3,
            shininess: 80,
            specular: 0xfbbf24,
            transparent: true,
            opacity: cfg.body.opacity,
            depthWrite: true,
            depthTest: true
        });
        const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.body.radius, 48, 32), bodyMat);
        bodyMesh.renderOrder = 5;
        bodyGroup.add(bodyMesh);

        this._addStars(outerGroup, middleGroup, innerGroup);
    }

    _addStars(outerGroup, middleGroup, innerGroup) {
        const cfg = this.config.star;
        const starMat = new THREE.MeshBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            depthTest: true
        });

        const starGeo = new THREE.SphereGeometry(0.02, 8, 8);
        const rings = [
            { group: outerGroup, radius: this.config.outerRing.radius * 0.95, count: 16, order: 1 },
            { group: middleGroup, radius: this.config.middleRing.radius * 0.95, count: 12, order: 2 },
            { group: innerGroup, radius: this.config.innerRing.radius * 0.95, count: 8, order: 3 }
        ];

        rings.forEach(r => {
            for (let i = 0; i < r.count; i++) {
                const angle = (i / r.count) * Math.PI * 2;
                const star = new THREE.Mesh(starGeo, starMat);
                star.renderOrder = r.order;
                star.position.set(Math.cos(angle) * r.radius, Math.sin(angle) * r.radius * 0.3, Math.sin(angle) * r.radius);
                r.group.add(star);
            }
        });
    }

    _createModernGyro() {
        const cfg = this.config;

        const outerGroup = this._createRing(cfg.outerRing, 1, null);
        this.scene.add(outerGroup);
        this.outerRing = outerGroup;

        const innerGroup = this._createRing(cfg.innerRing, 2, 'x');
        outerGroup.add(innerGroup);
        this.innerRing = innerGroup;

        const bodyGroup = new THREE.Group();
        bodyGroup.renderOrder = 3;
        innerGroup.add(bodyGroup);
        this.body = bodyGroup;

        const motorMat = new THREE.MeshPhongMaterial({
            color: cfg.motor.color,
            emissive: cfg.motor.emissive,
            emissiveIntensity: 0.2,
            shininess: 70,
            specular: 0x9ca3af,
            transparent: cfg.motor.opacity < 1.0,
            opacity: cfg.motor.opacity,
            depthWrite: true,
            depthTest: true
        });
        const motorGeo = new THREE.CylinderGeometry(cfg.motor.radius, cfg.motor.radius, cfg.motor.height, 24);
        const motor = new THREE.Mesh(motorGeo, motorMat);
        motor.renderOrder = 3;
        bodyGroup.add(motor);

        const rotorGroup = new THREE.Group();
        rotorGroup.renderOrder = 4;
        bodyGroup.add(rotorGroup);
        this.rotorGroup = rotorGroup;

        const rotorMat = new THREE.MeshPhongMaterial({
            color: cfg.rotor.color,
            emissive: cfg.rotor.emissive,
            emissiveIntensity: 0.4,
            shininess: 100,
            specular: 0xfbbf24,
            transparent: true,
            opacity: cfg.rotor.opacity,
            depthWrite: true,
            depthTest: true
        });
        const rotorGeo = new THREE.TorusGeometry(cfg.rotor.radius, cfg.rotor.tube, 16, 80);
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.rotation.x = Math.PI / 2;
        rotor.renderOrder = 4;
        rotorGroup.add(rotor);

        const bodyMat = new THREE.MeshPhongMaterial({
            color: cfg.body.color,
            emissive: cfg.body.emissive,
            emissiveIntensity: 0.15,
            shininess: 90,
            specular: 0xf3f4f6,
            transparent: true,
            opacity: cfg.body.opacity,
            depthWrite: true,
            depthTest: true
        });
        const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.body.radius * 0.5, 32, 24), bodyMat);
        bodyMesh.renderOrder = 5;
        rotorGroup.add(bodyMesh);

        this._addGyroMarks(rotorGroup);
    }

    _addGyroMarks(rotorGroup) {
        const cfg = this.config.marks;
        const markMat = new THREE.MeshPhongMaterial({
            color: cfg.color,
            emissive: cfg.emissive,
            emissiveIntensity: 0.5,
            shininess: 120,
            depthWrite: true,
            depthTest: true
        });

        const r = this.config.rotor.radius;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const markGeo = new THREE.BoxGeometry(0.04, 0.015, 0.12);
            const mark = new THREE.Mesh(markGeo, markMat);
            mark.renderOrder = 5;
            mark.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
            mark.rotation.y = -angle;
            rotorGroup.add(mark);
        }
    }

    updateFromState(frame) {
        if (!frame) return;

        const innerAngle = frame.inner_ring_angle != null ? frame.inner_ring_angle : 0;
        const outerAngle = frame.outer_ring_angle != null ? frame.outer_ring_angle : 0;
        const bodyTilt = frame.body_tilt != null ? frame.body_tilt : 0;
        const middleAngle = frame.middle_ring_angle != null ? frame.middle_ring_angle : 0;
        const rotorSpeed = frame.rotor_angle != null ? frame.rotor_angle : 0;

        this.updateGimbalAngles(innerAngle, outerAngle, bodyTilt, middleAngle, rotorSpeed);
    }

    updateGimbalAngles(innerAngle, outerAngle, bodyTilt, middleAngle = 0, rotorAngle = 0) {
        if (this.outerRing) {
            this.outerRing.rotation.z = THREE.MathUtils.degToRad(outerAngle);
        }
        if (this.middleRing) {
            this.middleRing.rotation.y = THREE.MathUtils.degToRad(middleAngle);
        }
        if (this.innerRing) {
            this.innerRing.rotation.x = THREE.MathUtils.degToRad(innerAngle);
        }
        if (this.body) {
            this.body.rotation.y = THREE.MathUtils.degToRad(bodyTilt * 0.5);
        }
        if (this.rotorGroup) {
            this.rotorGroup.rotation.y = THREE.MathUtils.degToRad(rotorAngle);
        }
    }

    _setupInteraction() {
        const container = this.canvas;

        container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.prevMouseX = e.clientX;
            this.prevMouseY = e.clientY;
        });

        container.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.prevMouseX;
            const dy = e.clientY - this.prevMouseY;
            this.cameraAngleX -= dx * 0.008;
            this.cameraAngleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.cameraAngleY - dy * 0.008));
            this.prevMouseX = e.clientX;
            this.prevMouseY = e.clientY;
        });

        container.addEventListener('mouseup', () => this.isDragging = false);
        container.addEventListener('mouseleave', () => this.isDragging = false);

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraDistance = Math.max(3, Math.min(12, this.cameraDistance + e.deltaY * 0.005));
        });
    }

    _updateCameraPosition() {
        this.camera.position.x = this.cameraDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        this.camera.position.y = this.cameraDistance * Math.sin(this.cameraAngleY);
        this.camera.position.z = this.cameraDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        this.camera.lookAt(0, 0, 0);
    }

    _handleResize() {
        const container = this.canvas;
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        this._updateCameraPosition();
        this.renderer.render(this.scene, this.camera);
    }
}
