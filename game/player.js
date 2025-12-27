import * as THREE from 'https://esm.sh/three@0.169.0';
import Entity from './entity.js';

const CAMERA_DISTANCE = -10; // Negative so the camera will be behind the car
const FIXED_VERTICAL_CAMERA_OFFSET = 4;
const TURN_SPEED = 0.1;
const MAX_SPEED = 10;
const ACCELERATION = 0.02;

class Player extends Entity {
    
    constructor(scene,camera) {
        super()
        this.scene = scene;
        this.camera = camera;

        let playerGeo = new THREE.BoxGeometry(1.9, 1.7, 4.9); // Used subaru outback dimensions as a reference
        let playerMat = new THREE.MeshStandardMaterial({ color: 0x45653E, metalness: 0});
        this.mesh = new THREE.Mesh(playerGeo, playerMat);
        this.mesh.position.y = .85

        this.direction = new THREE.Vector3(0,0,-1);
        this.goalSpeed = 0;
        this.speed = 0;
        this.turn = 0;

        this.scene.add(this.mesh);
    }

    innitPhysics(world) {
        
    }

    handleInputs(inputArr) {
        for (let i = 0; i < inputArr.length; i++) {
            switch (inputArr[i]) {
                case 16: // shift
                    this.pressShift();
                    break;
                case 32: // space
                    this.pressSpace();
                    break;
                case 37: // left 
                    this.pressArrowLeft();
                    break;
                case 38: // up
                    this.pressArrowUp();
                    break;
                case 39: // right
                    this.pressArrowRight();
                    break;
                case 40: // down
                    this.pressArrowDown();
                    break;

                case -16: // shift
                    this.releaseShift();
                    break;
                case -32: // space
                    this.releaseSpace();
                    break;
                case -37: // left
                    this.releaseArrowLeft();
                    break;
                case -38: // up
                    this.releaseArrowUp();
                    break;
                case -39: // right
                    this.releaseArrowRight();
                    break;
                case -40: // down
                    this.releaseArrowDown();
                    break;
              }
        }
    }

    updateMovement() {
        // ACCELERATE
        this.speed = THREE.MathUtils.lerp(this.speed, this.goalSpeed, ACCELERATION)
        //console.log(this.goalSpeed)

        // TURN
        this.mesh.rotation.y += this.turn;
        const a = new THREE.Euler( 0, this.turn, 0, 'XYZ' );
        this.direction.applyEuler(a)
        
        // MOVE FORWARD
        this.mesh.position.addScaledVector(this.direction,this.speed);

        // SET CAMERA
        const cameraPos = new THREE.Vector3();
        cameraPos.addScaledVector(this.direction,CAMERA_DISTANCE)
        cameraPos.y = FIXED_VERTICAL_CAMERA_OFFSET;
        cameraPos.add(this.mesh.position);
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(this.mesh.position);
    }

    pressArrowUp() {
        this.goalSpeed += MAX_SPEED;
    }

    pressArrowDown() {
        this.goalSpeed -= MAX_SPEED;
    }

    pressArrowLeft() {
        this.turn += TURN_SPEED;
    }

    pressArrowRight() {
        this.turn -= TURN_SPEED;
    }

    releaseArrowUp() {
        this.goalSpeed -= MAX_SPEED;
    }

    releaseArrowDown() {
        this.goalSpeed += MAX_SPEED;
    }

    releaseArrowLeft() {
        this.turn -= TURN_SPEED;
    }

    releaseArrowRight() {
        this.turn += TURN_SPEED;
    }
    
    pressSpace() {
        this.direction.y += 1;
    }

    releaseSpace() {
        this.direction.y -= 1;
    }

    pressShift() {
        this.direction.y -= 1;
    }

    releaseShift() {
        this.direction.y += 1;
    }

}

export default Player;