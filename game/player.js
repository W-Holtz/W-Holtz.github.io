import * as THREE from 'three';
import Entity from './entity.js';
import SkidParticles from './skidParticles.js';
import PlayerController from './playerController.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

let r;
const deltaT = 1/60;

const DIRECTIONS = {
    forward: new THREE.Vector3(0,0,-1),
    up: new THREE.Vector3(0,1,0),
    down: new THREE.Vector3(0,-1,0),
    sideways: new THREE.Vector3(1,0,0),
}

const CAMERA_DISTANCE = 3.4;
const FIXED_VERTICAL_CAMERA_OFFSET = 1.4;
const MAX_CHANGE_IN_FOV = 10;
const FOV_EFFECT_MAGNITUDE = .6;
const DEMO_CAR_MODEL_PATH = './assets/outback.glb';
const CAR_MASS = 1200; // kg
const MIN_RPM = 1000;
const SHIFT_RPM = 6200;
const REDLINE_ALLOWANCE = 700;
const RPM_RANGE = SHIFT_RPM - MIN_RPM;
const TRANSMISSION_EFFICIENCY = 0.7;
const DRAG_COEFFICIENT = 1;
const ENGINE_BRAKING_TORQUE = -10;
const MAX_STATIC_FRICTION_COEF = 1;
const WHEEL_RADIUS = 0.3;
const BRAKE_TORQUE = CAR_MASS * 9.81 * WHEEL_RADIUS * MAX_STATIC_FRICTION_COEF * 3 / 16;
const REV_LERP_CONSTANT = 0.04;
const UNREV_LERP_CONSTANT = -0.02;
export const CAMERA_MODE = {
    THIRD_PERSON: 'Third Person',
    ORBIT_CAR: 'Orbit Car',
    ORBIT_ORIGIN: 'Orbit Origin',
}

const DEFAULT_WHEEL_TUNING_PARAMS = {
    suspensionRestLength: .3,
    wheelRadius: WHEEL_RADIUS,
    wheelWidth: 0.2,
    springConstant: 60000,
    dampingConstant: 2500,
    momentOfInteria: 3,
    pacejkaValues: { // using the "dry tarmac" numbers from => https://www.edy.es/dev/docs/pacejka-94-parameters-explained-a-comprehensive-guide/
        slippingAtLong: 0.5,
        dynamicFrictionCoef: .7,
        staticFrictionCoef: MAX_STATIC_FRICTION_COEF,
        staticToDynamicTransitionLengthLat: 0.4,
        staticToDynamicTransitionLengthLong: 3,
        corneringStiffness: (0.15 * 180 / Math.PI), // 16% of Fn per degree (but converted to radians)
        slippingAtLat: MAX_STATIC_FRICTION_COEF / (0.15 * 180 / Math.PI),
    }
};


class Player extends Entity {
    
    constructor(scene, camera, RAPIER, world, debugSettings, callback, gearChangeCallback, maxGearChangeCallback) {
        super()
        this.scene = scene;
        this.camera = camera;
        this.cameraFOV = camera.fov;
        this.debugSettings = debugSettings;
        this.world = world;
        this.controller = new PlayerController(this);
        r = RAPIER;
        
        this.forward = DIRECTIONS.forward.clone();
        this.up = DIRECTIONS.up.clone();
        this.sideways = DIRECTIONS.sideways.clone();
        this.translation = new THREE.Vector3();
        this.rotation = new THREE.Quaternion();
        this.width = 1.9;
        this.height = 1.7 / 2;
        this.depth = 4.9;
        this.wheelBaseLength = 2.68;
        this.wheelHeightInset = 0.22;

        // Camera
        this.cameraDistance = CAMERA_DISTANCE;
        this.cameraVerticalOffset = FIXED_VERTICAL_CAMERA_OFFSET;
        this.maxChangeInFOV = MAX_CHANGE_IN_FOV;
        this.fovEffectMagnitude = FOV_EFFECT_MAGNITUDE;
        this.direction = new THREE.Vector3();
        
        // Overlay
        this.rpmNeedle = document.getElementById('rpmNeedle');
        this.kmhNeedle = document.getElementById('kmhNeedle');
        this.gearChangeCallback = gearChangeCallback;
        this.maxGearChangeCallback = maxGearChangeCallback;

        // Engine simulation
        this.transmissionEfficiency = TRANSMISSION_EFFICIENCY;
        this.engineBrakingTorque = ENGINE_BRAKING_TORQUE;
        this.engineToWheelLerp = 0.08;
        this.differentialRatio = 4.11;
        this.gearbox = new Map (
            [
                [-1, -3.49],
                [0, 0],
                [1, 3.46],
                [2, 1.95],
                [3, 1.37],
                [4, 1.03],
                [5, 0.83]
            ]
        );
        this.maxGear = 5;

        // Drag Simulation
        this.dragCoefficient = DRAG_COEFFICIENT;
        
        // Dynamic Stuff
        this.setDefaultValues();

        // Load Model
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            DEMO_CAR_MODEL_PATH,
            (glb) => {
                this.glbLoadCallback(glb);
                callback();
            },
            null,
            (err) => {
                console.log('Error:', err);
            },
        );

        
    }

    addCarSettingsToGUI(gui) {

        const cameraFolder = gui.folders[0];
        cameraFolder.add(this, 'cameraDistance', 0, 10).name('Distance');
        cameraFolder.add(this, 'cameraVerticalOffset', 0, 10).name('Vertical Offset');
        cameraFolder.add(this, 'fovEffectMagnitude', 0, 3).name('FOV Effect Strength');

        const carFolder = gui.addFolder( 'Car' ).close();

        carFolder.add(this, 'transmissionEfficiency').name('Transmission Efficiency');
        carFolder.add(this, 'dragCoefficient').name('Drag Coefficient');
        carFolder.add(this, 'engineBrakingTorque').name('Engine Braking Torque');

        const wheelFolder = gui.addFolder( 'Wheel' ).close();

        wheelFolder.add(DEFAULT_WHEEL_TUNING_PARAMS, 'wheelRadius', 0.01, 2).name('Wheel Radius').onChange((value) => {
            this.deleteTires();
            this.innitTires();
        });
        wheelFolder.add(DEFAULT_WHEEL_TUNING_PARAMS, 'wheelWidth', 0.01, 2).name('Wheel Width (Visual)').onChange((value) => {
            this.deleteTires();
            this.innitTires();
        });
        wheelFolder.add(DEFAULT_WHEEL_TUNING_PARAMS.pacejkaValues, 'dynamicFrictionCoef', 0, 2).name('Dynamic Friction').onChange((value) => {
            this.deleteTires();
            this.innitTires();
        });
        wheelFolder.add(DEFAULT_WHEEL_TUNING_PARAMS.pacejkaValues, 'staticFrictionCoef', 0, 2).name('Static Friction').onChange((value) => {
            this.deleteTires();
            this.innitTires();
        });

        const suspensionFolder = gui.addFolder( 'Suspension' ).close();

        suspensionFolder.add(DEFAULT_WHEEL_TUNING_PARAMS, 'suspensionRestLength', 0.01, 10).name('Suspension Length').onChange((value) => {
            this.deleteTires();
            this.innitTires();
        });
        suspensionFolder.add(DEFAULT_WHEEL_TUNING_PARAMS, 'springConstant',30000,150000).step(1000).name('Spring Constant').onChange((value) => {
            this.deleteTires();
            this.innitTires();
        });
        suspensionFolder.add(DEFAULT_WHEEL_TUNING_PARAMS, 'dampingConstant',1000,10000).step(250).name('Damping Constant').onChange((value) => {
            this.deleteTires();
            this.innitTires();
        });
        
        this.controller.addControllerSettingsToGUI(gui);
    }

    respawn() {
        this.setDefaultValues();
        this.rigidBody.setTranslation(new THREE.Vector3(0,1,0), true);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(DIRECTIONS.up.clone(), 0);
        this.rigidBody.setRotation(quaternion);
        this.rigidBody.setLinvel(new THREE.Vector3(), true);
        this.rigidBody.setAngvel(new THREE.Vector3(), true);
        this.rigidBody.resetForces(true);
        this.rigidBody.resetTorques(true);

        for (let i = 0; i < this.tires.length; i++) {
            this.tires[i].setDefaultValues();
        }

        this.setGear(0);
    }

    glbLoadCallback(glb) {
        const mesh = glb.scene.children[0];
        
        
        // Rotate and scale down the mesh
        mesh.rotateY(Math.PI);
        mesh.position.y += this.height/2
        mesh.position.z += 0.05
        mesh.scale.set(1.05, 1.05, 1);
        mesh.updateMatrix();
        mesh.geometry.applyMatrix4(mesh.matrix);
        mesh.rotation.set(0, 0, 0);
        mesh.position.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        mesh.updateMatrix();
        
        // Add to scene
        this.mesh = mesh;
        this.scene.add(mesh);
        this.mesh.position.set(0, this.height / 2, 0);
        
        // Initialize everything else
        this.innitPhysics();
        this.synchRenderToWorld();
        this.innitTires();
    }

    setDefaultValues() {
        // Engine simulation
        this.rpm = 0;
        this.wheelAngularVelocity = 0;
        this.gear = 0;
        this.gearRatio = 0;
        this.engineTorque = 0;
        
        // Drag simulation
        this.speed = new THREE.Vector3();
        this.drag = new THREE.Vector3();

        // Brake simulation
        this.brakeTorque = 0;

        // Drift city
        this.speedOnXZPlane = new THREE.Vector3();
        this.sidewaysMultiplier = 1;
        this.previousSpeed = this.speedOnXZPlane.clone();

    }

    innitPhysics() {
        let clDesc = r.ColliderDesc.cuboid(this.width/2, (this.height/2) - 0.2, this.depth/2)
        let rigidBodyDesc = r.RigidBodyDesc.dynamic()
            .setAdditionalMass(CAR_MASS)
            .setCcdEnabled(true); // improves (reduces) clipping

        this.rigidBody = this.world.createRigidBody(rigidBodyDesc);
        this.collider = this.world.createCollider(clDesc, this.rigidBody);

        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(DIRECTIONS.up.clone(), 0);
        this.rigidBody.setRotation(quaternion);
    }

    innitTires() {
        this.tires = [
            new Wheel(this, new THREE.Vector3(-this.width / 2, (-this.height / 2) + this.wheelHeightInset,  - this.wheelBaseLength / 2)), // Front left
            new Wheel(this, new THREE.Vector3(this.width / 2, (-this.height / 2) + this.wheelHeightInset, - this.wheelBaseLength / 2)),  // Front right
            new Wheel(this, new THREE.Vector3(this.width / 2, (-this.height / 2) + this.wheelHeightInset, this.wheelBaseLength / 2)),   // Back right
            new Wheel(this, new THREE.Vector3(-this.width / 2, (-this.height / 2) + this.wheelHeightInset, this.wheelBaseLength / 2)),  // Back left
        ];
        this.frontAxle = [this.tires[0], this.tires[1]];
        this.rearAxle = [this.tires[2], this.tires[3]];

        this.tires[0].i = 0;
        this.tires[1].i = 1;
        this.tires[2].i = 2;
        this.tires[3].i = 3;
    }
    
    deleteTires() {
        for (let i = 0; i < this.tires.length; i++) {
            this.tires[i].mesh.geometry.dispose();
            this.tires[i].mesh.material.dispose();
            this.mesh.remove(this.tires[i].mesh);
        }

        this.frontAxle = []
        this.rearAxle = []
        this.tires = []
    }

    handleInputs(inputArr) {
        this.controller.handleInputs(inputArr);
    }

    updatePhysics() {
        this.rigidBody.resetForces(true);
        this.rigidBody.resetTorques(true);

        this.translation = this.rigidBody.translation();
        this.rotation = this.rigidBody.rotation();
        this.forward.copy(DIRECTIONS.forward);
        this.up.copy(DIRECTIONS.up);
        this.sideways.copy(DIRECTIONS.sideways);
        this.forward.applyQuaternion(this.rotation);
        this.up.applyQuaternion(this.rotation);
        this.sideways.applyQuaternion(this.rotation);

        this.speed.copy(this.rigidBody.linvel());
        this.speedOnXZPlane.copy(this.speed);
        this.speedOnXZPlane.projectOnPlane(this.up);
    
        const normalizedSpeedOnXZPlane = this.speedOnXZPlane.clone().normalize()
        this.driftControlMultiplier = Math.abs(normalizedSpeedOnXZPlane.dot(this.sideways));

        this.updateEngine();
        this.distributeForcesToWheels();
        this.applyTireForces();
        this.applyDragForce();
        this.synchRenderToWorld();
    }

    updateEngine() {
        if (this.gear === 0 && this.controller.isHandbraking) {
            this.revEngine();
        } else {
            this.updateRPM();
        }
    }

    applyTireForces() {
        for (let i = 0; i < this.tires.length; i++) {
                this.tires[i].updatePhysics();
                this.tires[i].synchRenderToWorld();
                this.rigidBody.addForceAtPoint(this.tires[i].getforceOnCarWS(), this.tires[i].contactPoint, true);
        }
    }

    applyDragForce() { // TODO : the forces here should push down on the front of the car as well
        this.drag.copy(this.speed);
        this.drag.multiplyScalar(this.dragCoefficient * this.drag.length());
        this.rigidBody.addForce(this.drag.negate());
    }
    
    revEngine() {
        const normalizedRPM = 1 - (SHIFT_RPM - this.rpm) / RPM_RANGE
        let lerpValue;

        if (this.controller.throttle === 0) {
            lerpValue = normalizedRPM + (normalizedRPM * UNREV_LERP_CONSTANT);
        } else {
            lerpValue = REV_LERP_CONSTANT - (normalizedRPM * REV_LERP_CONSTANT) + normalizedRPM;
        }
          
        this.rpm = THREE.MathUtils.lerp( MIN_RPM, SHIFT_RPM, lerpValue)
    }

    updateRPM() {
        this.getDriveWheelAngularVelocity();
        this.throttleChoke = 1;
        this.rpm = THREE.MathUtils.lerp(
            this.rpm,
            this.driveWheelAngularVelocity * this.gearRatio * this.differentialRatio * 30 / Math.PI,
            this.engineToWheelLerp
        );
    
        if (this.rpm < MIN_RPM) {
            if (this.gear < 2) {
                this.rpm = MIN_RPM;
            } else {
                this.setGear(this.gear - 1);
                this.rpm = this.driveWheelAngularVelocity * this.gearRatio * this.differentialRatio * 30 / Math.PI;
            }

        } else if (this.rpm > SHIFT_RPM) {
            if (this.gear === 0 || this.gear === -1) {
                this.rpm = SHIFT_RPM;
            } else if (this.gear >= this.maxGear) {
                if (SHIFT_RPM - this.rpm < REDLINE_ALLOWANCE) {
                    this.throttleChoke = (SHIFT_RPM - this.rpm + REDLINE_ALLOWANCE) / REDLINE_ALLOWANCE;
                }
            } else if (this.gearbox.has(this.gear + 1)) {
                this.setGear(this.gear + 1);
                this.rpm = this.driveWheelAngularVelocity * this.gearRatio * this.differentialRatio * 30 / Math.PI;
            }
        } else if (this.gear > this.maxGear) {
            this.throttleChoke = Math.max((500 - this.rpm) / REDLINE_ALLOWANCE, -0.7);
            if (this.driveWheelAngularVelocity * this.gearbox.get(this.gear - 1) * this.differentialRatio * 30 / Math.PI < SHIFT_RPM + REDLINE_ALLOWANCE) {
                this.setGear(this.gear - 1);
                this.rpm = this.driveWheelAngularVelocity * this.gearRatio * this.differentialRatio * 30 / Math.PI;
            }
        }
    }

    setGear(gear) {
        this.gear = gear
        this.gearRatio = this.gearbox.get(this.gear);
        if (this.controller.isHandbraking && gear === 0) {
            this.gearChangeCallback("P");
        } else {
            this.gearChangeCallback(gear);
        }
    }

    adjustMaxGear(change) {
        this.maxGear += change;
        if (this.maxGear < 1) {
            this.maxGear = 1;
        } else if (!this.gearbox.has(this.maxGear)) {
            this.maxGear = Math.max(...this.gearbox.keys())
        }
        this.maxGearChangeCallback(this.maxGear)
    }
    
    getDriveWheelAngularVelocity() {
        let avgAngVel = 0;
        let count = 0;
        for (let i = 0; i < this.tires.length; i++) {
            if (!this.tires[i].lockWheel) {
                count += 1;
                avgAngVel += this.tires[i].angularVelocity;
            };
        }

        this.driveWheelAngularVelocity = avgAngVel / count;
    }

    getMaxTorqueFromRPM() {
        const variable = 0.7 * this.rpm - 2940;
        return (-variable * variable / 41142) + 250;
    }

    updateEngineTorque () {
        if (this.controller.throttle !== 0) {
            this.engineTorque = this.getMaxTorqueFromRPM() * this.controller.throttle * this.throttleChoke;
        } else if (Math.abs(this.driveWheelAngularVelocity) > 0) {
            this.engineTorque = this.engineBrakingTorque * Math.sign(this.driveWheelAngularVelocity) * Math.min(Math.abs(this.driveWheelAngularVelocity),1);
            if (this.throttleChoke < 0) {
                this.engineTorque *= -this.throttleChoke * 100
            }
        }
    }
    
    distributeForcesToWheels() {
        let brakeTorque = 0;
        let torqueFromEngine = 0;
        
        if (this.controller.isHandbraking) {
            if (this.gear !== 0 && Math.abs(this.speed.dot(this.forward)) < 0.5) {
                this.setGear(0);
                this.controller.onPark();
            }
        }

        if (this.controller.isBraking()) {
            brakeTorque = BRAKE_TORQUE

            if (this.gear !== 0 && Math.abs(this.speed.dot(this.forward)) < 0.5) {
                this.setGear(0);
                this.controller.onBrakeStop();
            }
        } else {
            this.updateEngineTorque();
            torqueFromEngine = this.engineTorque * this.gearRatio * this.differentialRatio * this.transmissionEfficiency / this.tires.length;
        }
        for (let i = 0; i < this.tires.length; i++) {
            if (!this.tires[i].lockWheel) {
                this.tires[i].brakeTorque = brakeTorque;
                this.tires[i].torqueFromEngine = torqueFromEngine;
            }
        }
    }

    updateCameraPosition() {
        // Setup
        let directionUsage;
        this.direction.addVectors(this.speedOnXZPlane,this.forward).normalize().negate();
        directionUsage = Math.min(this.speedOnXZPlane.length() / 4, 1)
        const cameraPos = new THREE.Vector3(0, 0, 1);
        const verticalOffsetPos = new THREE.Vector3(0, this.cameraVerticalOffset, 0);
        
        // FOV effect
        const acceleration = this.speedOnXZPlane.length() - this.previousSpeed.length();
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.cameraFOV + THREE.MathUtils.clamp(acceleration * 200 * this.fovEffectMagnitude, 0, this.maxChangeInFOV * this.fovEffectMagnitude), 0.25);
        this.camera.updateProjectionMatrix();

        // Directional offset
        cameraPos.multiplyScalar(this.cameraDistance * (1 - directionUsage));
        cameraPos.applyMatrix4(this.mesh.matrix);
        cameraPos.addScaledVector(this.direction, this.cameraDistance * directionUsage);
        cameraPos.addScaledVector(this.direction, Math.min(this.speedOnXZPlane.length() / 20, .7));

        // Add vertical offset
        verticalOffsetPos.applyQuaternion(this.rotation);
        cameraPos.add(verticalOffsetPos);

        // Make the updates
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(this.mesh.position);
        this.previousSpeed.copy(this.speedOnXZPlane);
    }

    updateSteering(steeringValue) {       
        const radius = this.wheelBaseLength / Math.tan(steeringValue);
        const wOver2 = this.width / 2;
        const rightTireAngle = Math.atan(this.wheelBaseLength / (radius + wOver2)); 
        const leftTireAngle = Math.atan(this.wheelBaseLength / (radius - wOver2));
        
        this.frontAxle[0].applySteeringAngleTransform(leftTireAngle);
        this.frontAxle[1].applySteeringAngleTransform(rightTireAngle);
    }

    updateHandbrake(doHandbrake) {
        for (let i = 0; i < this.rearAxle.length; i++) {
            this.rearAxle[i].updateHandbrake(doHandbrake);
        }
    }

    synchRenderToWorld() {
        this.mesh.position.copy(this.translation);
        this.mesh.quaternion.copy(this.rotation);

        this.updateOverlay();

        if (this.debugSettings.cameraMode === CAMERA_MODE.THIRD_PERSON) {
            this.updateCameraPosition();
        }
    }

    updateOverlay() {
        const kmh = this.speedOnXZPlane.length() * 3.6
        const rpmAngle = Math.min((this.rpm * 0.04) - 90, 191);
        const kmhAngle = Math.min((kmh * 1.5) - 90, 194);

        this.rpmNeedle.style.transform = `rotate(${rpmAngle + 39}deg)`;
        this.kmhNeedle.style.transform = `rotate(${kmhAngle + 36}deg)`;
    }
}

class Wheel {

    constructor(car, wheelAnchorCarSpace, wheelTuningParams = DEFAULT_WHEEL_TUNING_PARAMS) {
        this.car = car;
        
        // wheel tuning variables
        this.suspensionRestLength = wheelTuningParams['suspensionRestLength'];
        this.radius = wheelTuningParams['wheelRadius'];
        this.width = wheelTuningParams['wheelWidth'];
        this.springConstant = wheelTuningParams['springConstant'];
        this.dampingConstant = wheelTuningParams['dampingConstant'];
        this.momentOfInteria = wheelTuningParams['momentOfInteria'];
        this.pacejkaValues = wheelTuningParams['pacejkaValues'];

        // Car space positioning
        this.anchorCS = wheelAnchorCarSpace;           // Static
        this.downCS = DIRECTIONS.down.clone();       // Static
        this.forwardCS = DIRECTIONS.forward.clone();      // Dynamic (steering influenced)
        this.sidewaysCS = DIRECTIONS.sideways.clone();  
        this.suspensionLength = this.suspensionRestLength;   // Dynamic (physics influenced)
        this.positionCS = this.anchorCS.clone()        // Dynamic (compound of the above)
            .addScaledVector(this.downCS, this.suspensionLength);

        // World space positioning
        this.carTranslation;
        this.carRotation;
        this.anchorWS = new THREE.Vector3();
        this.downWS = this.downCS.clone();
        this.forwardWS = this.forwardCS.clone();
        this.sidewaysWS = this.sidewaysCS.clone();

        // Raycasting information
        this.rayLength = this.suspensionRestLength + this.radius;
        this.isInContact = false;
        this.contactNormal = new THREE.Vector3();
        this.contactPoint = new THREE.Vector3();
        this.groundObj;
        this.contactDistance;
        this.chasisVelocityAtContact = new THREE.Vector3();

        // Steering information
        this.steeringAngle = 0;
        this.steerQuarternion = new THREE.Quaternion();
        this.spinQuarternion = new THREE.Quaternion();

        // Suspension simulation
        this.suspensionForce;
        this.sideForce;
        this.forwardForce;
        // Tire simulation
        this.torqueFromEngine = 0;
        this.brakeTorque = 0;
        this.angularVelocity = 0;
        this.angularVelocitySign = 0;
        this.lockWheel = false;

        this.slipAngle = 0;
        this.slipRatio = 0;
        this.lateralFrictionCoef = 0;
        this.longitudinalFrictionCoef = 0;
        // General simulation
        this.forceOnCarWS = new THREE.Vector3();

        this.updateWorldSpaceVals();
        this.updateRayCast();
        this.innitMesh()
    }

    setDefaultValues() {
        this.updateWorldSpaceVals();
        this.updateRayCast();
    }

    innitMesh() {
        let wheelGeo = new THREE.CylinderGeometry(this.radius, this.radius, this.width, 6);
        let wheelMat = new THREE.MeshStandardMaterial({color: 0x222222, metalness: 0});
        this.mesh = new THREE.Mesh(wheelGeo, wheelMat);
        this.car.mesh.add(this.mesh);
        
        this.mesh.rotateZ(-Math.PI/2);

        this.mesh.updateMatrix();
        this.mesh.geometry.applyMatrix4( this.mesh.matrix );
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.updateMatrix();
        
        // Skid effects
        this.particles = new SkidParticles(this.car.scene, this.camera);
    }

    updateHandbrake(doHandbrake) {
        this.lockWheel = doHandbrake;
        if (doHandbrake) {
            this.angularVelocity = 0;
            this.engineTorque = 0;
            this.brakeTorque = 0;
        }
    }

    updatePhysics() {
        this.updateWorldSpaceVals();
        this.updateRayCast();
        this.updateSuspension();
        this.updateTraction();
    }

    synchRenderToWorld() { 
        if (this.isInContact && this.chasisVelocityAtContact.length() > 1) {  
            if (Math.abs(this.slipAngle) > this.pacejkaValues.slippingAtLat) {
                this.particles.addParticles(this.downCS.clone().negate(), this.contactPoint, 1);
            }
            if (Math.abs(this.slipRatio) > this.pacejkaValues.slippingAtLong) {

                this.particles.addParticles(this.downCS.clone().negate(), this.contactPoint, 1);
            }
        }

        //this.particles.addParticles(this.downCS.clone().negate(), new THREE.Vector3(), 1);

        this.particles.step(deltaT)
        // Standard transforms
        const deltaSpin = new THREE.Quaternion();
        deltaSpin.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -this.angularVelocity * deltaT);
        this.spinQuarternion.multiply(deltaSpin);

        this.mesh.quaternion.multiplyQuaternions(this.steerQuarternion, this.spinQuarternion);
        this.mesh.position.copy(this.positionCS);
    }

    updateWorldSpaceVals() {
        this.anchorWS.copy(this.anchorCS);
        this.anchorWS.applyQuaternion(this.car.rotation)
        this.anchorWS.add(this.car.translation);

        this.downWS.copy(this.downCS); // I couldn't find a better way to rotate this without creating a clone
        this.downWS.applyQuaternion(this.car.rotation);
        this.forwardWS.copy(this.forwardCS);
        this.forwardWS.applyQuaternion(this.car.rotation);
        this.sidewaysWS.copy(this.sidewaysCS);
        this.sidewaysWS.applyQuaternion(this.car.rotation);
    }

    updateRayCast() {
        let ray = new r.Ray(this.anchorWS, this.downWS.clone().normalize());
        let hit = this.car.world.castRayAndGetNormal(ray, this.rayLength, true, undefined, undefined, this.car.collider);

        // Early returns for when something goes wrong or the wheel is not in contact
        if (hit) {
            if (hit.collider === this.car.collider) {
                console.log("ERROR: Wheel collided with its own car.")
                this.isInContact = false;
                return;
            };
        } else {
            this.isInContact = false;
            return;
        }

        // Save ray cast info
        this.isInContact = true;
        this.groundObj = hit.collider;
        this.contactPoint.copy(ray.pointAt(hit.timeOfImpact));
        this.contactNormal.copy(hit.normal);
        this.contactDistance = hit.timeOfImpact;
        this.chasisVelocityAtContact.copy(this.car.rigidBody.velocityAtPoint(this.contactPoint));
    }

    updateSuspension() {
        // 1.) Are we in contact with the ground
        if (!this.isInContact) {
            this.suspensionLength = this.suspensionRestLength;
            this.suspensionForce = 0;
            this.positionCS = this.anchorCS.clone()
                .addScaledVector(this.downCS, this.suspensionLength);
            return;
        }

        // 2.) Calculate the damping and spring forces
        this.suspensionLength = this.contactDistance - this.radius;

        // Fd = velocity in the direction of wheel down * damping constant
        this.dampingForce = -this.downWS.dot(this.chasisVelocityAtContact) * this.dampingConstant;

        // Fs = compression * spring constant * the negative alignment (dot) of the contact normal and direction of wheel down
        const springForce = this.downWS.dot(
                this.contactNormal
            ) * (this.suspensionRestLength - this.suspensionLength)
              * this.springConstant;

        // 3.) Combine forces
        this.suspensionForce = springForce + this.dampingForce;


        // 4.) Use the position of the wheel in car space
        this.positionCS = this.anchorCS.clone()
                .addScaledVector(this.downCS, this.suspensionLength);

    }

    updateTraction() {
        this.longitudinalFrictionForce = 0;
        this.lateralFrictionForce = 0;
        let wheelForceFromTorque = 0;
        
        if (!this.isInContact) {
            if (!this.lockWheel) {
                let torqueOnWheel;
                // Case 1: We are pressing the throttle
                if (this.car.controller.throttle > 0) {
                    torqueOnWheel = this.torqueFromEngine;
                    this.angularVelocity += deltaT * torqueOnWheel / this.momentOfInteria;
                // Case 2: We are braking
                } else if (this.car.controller.isBraking()) {
                    this.angularVelocity = 0;
                }
            }
            return;
        }

        // Update traction forces
        const contactVelocity = this.angularVelocity * this.radius;
        const forwardVelocity = this.chasisVelocityAtContact ? this.forwardWS.dot(this.chasisVelocityAtContact) : 0;
        const sidewaysVelocity = this.chasisVelocityAtContact ? this.sidewaysWS.dot(this.chasisVelocityAtContact) : 0;
    
        // Get the slip ratio
        if ( 
            // 1.) Handle cases where we know the grip should be full (and angular velocity should match rolling velocity)
            //     Case 1: wheel is rolling freely
            ((this.car.controller.throttle === 0 || this.engineTorque === 0) && this.brakeTorque === 0 && !this.lockWheel) ||
            //     Case 2: braking is applied, but the wheel is rolling faster than the ground
            (this.brakeTorque > 0 && contactVelocity > forwardVelocity) || 
            //     Case 3: throttle is applied, but the wheel is rolling more slowly than the ground
            (this.car.controller.throttle > 0 && Math.abs(contactVelocity) <  Math.abs(forwardVelocity))
        ) {
            this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, forwardVelocity / this.radius, 0.1);
            this.slipRatio = 0;
        } else { 
            // 2.) Standard case. Wheel might have lost some traction and angular velocity might not match rolling velocity
            const denom = Math.max(Math.abs(forwardVelocity), 0.1); // divide by zero prevention
            const diffContactRolling = contactVelocity - forwardVelocity;
            if (Math.abs(diffContactRolling) < 0.01) {
                this.slipRatio = 0;
            } else {
                this.slipRatio = diffContactRolling / denom;
            }
        }

        // Get the slip angle
        this.slipAngle = Math.atan2(sidewaysVelocity, forwardVelocity);

        // Get the isolated longitudinal force
        this.longitudinalFrictionCoef = this.getLongitudinalFrictionCoef(Math.abs(this.slipRatio));
        if (this.lockWheel) {
            // Case 1: If the wheel is locked (handbrake is applied), the force equals the maximum possible force (damped when velocity is 0)
            this.longitudinalFrictionForce = this.suspensionForce * this.longitudinalFrictionCoef * Math.sign(forwardVelocity) * Math.min(Math.abs(forwardVelocity), 1);
        } else if (this.car.controller.isBraking()) {
            // Case 2: If we are braking, the force is the lesser of the break torque applied or max friction force
            wheelForceFromTorque = this.brakeTorque / this.radius;
            this.longitudinalFrictionForce = Math.sign(-forwardVelocity) * Math.min(wheelForceFromTorque, -this.suspensionForce * this.longitudinalFrictionCoef); 
        } else {
            // Case 3: If we are throttling (or engine braking), the force is the lesser of the engine torque applied or max friction force
            wheelForceFromTorque = Math.abs(this.torqueFromEngine / this.radius);
            this.longitudinalFrictionForce = Math.sign(this.torqueFromEngine) * Math.min(wheelForceFromTorque, -this.suspensionForce * this.longitudinalFrictionCoef);
        }

        // Get the isolated lateral force
        this.lateralFrictionCoef = this.getLateralFrictionCoef(Math.abs(this.slipAngle));
        this.lateralFrictionForce = this.lateralFrictionCoef * -this.suspensionForce * Math.sign(this.slipAngle) * Math.min(Math.abs(sidewaysVelocity), 1);
        if (this.lockWheel) { 
            this.lateralFrictionForce *= 0.2 + this.car.driftControlMultiplier;
            this.longitudinalFrictionForce *= 0.7
        };
        
        // Friction circle
        if (Math.sqrt((this.lateralFrictionForce * this.lateralFrictionForce) + (this.longitudinalFrictionForce * this.longitudinalFrictionForce)) > -this.suspensionForce * (this.lateralFrictionCoef + this.longitudinalFrictionCoef) / 2) {
            const normalizedVector = new THREE.Vector2(this.lateralFrictionForce, this.longitudinalFrictionForce).normalize();
            this.lateralFrictionForce = normalizedVector.x * - this.suspensionForce;
            this.longitudinalFrictionForce = normalizedVector.y * - this.suspensionForce;
        }

        if (!this.lockWheel) {
            this.longitudinalFrictionForce *= this.car.driftControlMultiplier * 2.5 + 1;
        }

        // Update wheel forces (those not applied to chasis)
        if (!this.lockWheel) {
            let torqueOnWheel;

            // Case 1: Wheel torques do not exceed friction forces
            if (Math.abs(wheelForceFromTorque) < Math.abs(this.longitudinalFrictionForce)) {
                this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, forwardVelocity / this.radius, 0.1);
            }
            // Case 2: We are pressing the throttle, and torque force exceeds friction force (by a lot)
            if (this.car.controller.throttle > 0 && !this.car.controller.isBraking()) {
                torqueOnWheel = this.torqueFromEngine - (this.longitudinalFrictionForce * this.radius);
                this.angularVelocity += deltaT * torqueOnWheel / this.momentOfInteria;

            // Case 3: We are braking, and torque force exceeds friction force
            } else if (this.car.controller.isBraking() && (wheelForceFromTorque > this.longitudinalFrictionForce)) {
                if (this.angularVelocity === 0) { return };
                
                this.angularVelocitySign = Math.sign(this.angularVelocity);
                torqueOnWheel = this.brakeTorque - (this.longitudinalFrictionForce * this.radius);

                this.angularVelocity -= deltaT * torqueOnWheel * this.angularVelocitySign / this.momentOfInteria;
                if (this.angularVelocitySign !== Math.sign(this.angularVelocity)) {
                    this.angularVelocity = 0;
                    this.angularVelocitySign = 0;
                }
            }   
        }
    }

    getLongitudinalFrictionCoef(slipRatio) {
        if (slipRatio < this.pacejkaValues.slippingAtLong) {
            return this.pacejkaValues.staticFrictionCoef;
        } else if (slipRatio < this.pacejkaValues.staticToDynamicTransitionLengthLong + this.pacejkaValues.slippingAtLong) {
            return THREE.MathUtils.lerp(
                this.pacejkaValues.staticFrictionCoef, 
                this.pacejkaValues.dynamicFrictionCoef, 
                (slipRatio - this.pacejkaValues.slippingAtLong) / this.pacejkaValues.staticToDynamicTransitionLengthLong
            );
        } else {
            return this.pacejkaValues.dynamicFrictionCoef;
        }
    }

    getLateralFrictionCoef(slipAngle) {
        if (slipAngle < this.pacejkaValues.slippingAtLat) {
            return slipAngle * this.pacejkaValues.corneringStiffness;
        } else if (slipAngle < this.pacejkaValues.staticToDynamicTransitionLengthLat + this.pacejkaValues.slippingAtLat) { 
            return THREE.MathUtils.lerp(
                this.pacejkaValues.staticFrictionCoef, 
                this.pacejkaValues.dynamicFrictionCoef, 
                (slipAngle - this.pacejkaValues.slippingAtLat) / this.pacejkaValues.staticToDynamicTransitionLengthLat
            );
        } else {
            return this.pacejkaValues.dynamicFrictionCoef;
        }
    }

    applySteeringAngleTransform(steerAngle) {
        this.steerQuarternion.setFromAxisAngle(this.downCS, steerAngle);
        this.sidewaysCS.set(1, 0, 0).applyQuaternion(this.steerQuarternion);
        this.forwardCS.set(0, 0, -1).applyQuaternion(this.steerQuarternion); 
    }

    getforceOnCarWS() {
        this.forceOnCarWS.set(0, 0, 0);
        const contactNormalSideways = new THREE.Vector3().crossVectors(this.contactNormal, this.forwardWS).normalize();
        const contactNormalForward = new THREE.Vector3().crossVectors(contactNormalSideways, this.contactNormal).normalize();

        this.forceOnCarWS.addScaledVector(this.contactNormal, -this.suspensionForce);
        this.forceOnCarWS.addScaledVector(contactNormalSideways, this.lateralFrictionForce);
        this.forceOnCarWS.addScaledVector(contactNormalForward, this.longitudinalFrictionForce);

        return this.forceOnCarWS;
    }
}

export default Player;