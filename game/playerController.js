import * as THREE from '../node_modules/three';

const THROTTLE_INCREASE_RATE = 0.3;
const THROTTLE_RELEASE_RATE = 0.3;
const STEERING_RATE = 0.022;

const LOW_SPEED_MAX_STEER = 0.7;
const HIGH_SPEED_MAX_STEER = 0.2;

class PlayerController {
    
    constructor(car) {
        this.car = car;
        this.throttleIncreaseRate = THROTTLE_INCREASE_RATE;
        this.throttleReleaseRate = THROTTLE_RELEASE_RATE;
        this.steeringRate = STEERING_RATE;

        this.setDefaults();
    }

    setDefaults() {
        // Outputs
        this.throttle = 0;
        this.brake = 0;
        this.steering = 0;
        this.isHandbraking = false;
        
        // State tracking
        this.isUpPressed = false;
        this.isDownPressed = false;
        this.brakeKey = undefined;
        this.throttleGoal = 0;
        this.steeringGoal = 0;
    }

    addControllerSettingsToGUI(gui) {
        const controllerFolder = gui.addFolder( 'Controller' );

        controllerFolder.add(this, 'throttleIncreaseRate',0,1).name('Throttle Increase Rate');
        controllerFolder.add(this, 'throttleReleaseRate',0,1).name('Throttle Release Rate');
        controllerFolder.add(this, 'steeringRate',0,1).name('Steering Rate');

        controllerFolder.close()
    }

    updateValues() {
        this.updateThrottle();
        this.updateSteering();
    }

    updateThrottle() {
        if (this.throttle !== this.throttleGoal) {
            if (this.throttleGoal === 1) {
                this.throttle += (this.throttleGoal - this.throttle) * this.throttleIncreaseRate;
                if (this.throttleGoal - this.throttle < 0.1) { this.throttle = this.throttleGoal };
            } else {
                this.throttle += (this.throttleGoal - this.throttle) * this.throttleReleaseRate;
                if (this.throttle < 0.1) { this.throttle = this.throttleGoal };
            }
        }
    }

    updateSteering() {
        if (this.steering !== this.steeringGoal) {
            if (this.steeringGoal === 0) { // This is so players don't get unexpected steering when they aren't pressing a button
                if (this.steeringGoal < this.steering) {
                    this.steering -= this.steeringRate + 0.1;
                    if (this.steeringGoal > this.steering) { this.steering = this.steeringGoal };
                } else if (this.steeringGoal > this.steering){
                    this.steering += this.steeringRate + 0.1;
                    if (this.steeringGoal < this.steering) { this.steering = this.steeringGoal };
                }
            }

            if (this.steeringGoal < this.steering) {
                this.steering -= this.steeringRate;
                if (this.steeringGoal > this.steering) { this.steering = this.steeringGoal };
            } else if (this.steeringGoal > this.steering){
                this.steering += this.steeringRate;
                if (this.steeringGoal < this.steering) { this.steering = this.steeringGoal };
            }
        }
        this.car.updateSteering(this.steering * THREE.MathUtils.lerp(LOW_SPEED_MAX_STEER, HIGH_SPEED_MAX_STEER, THREE.MathUtils.clamp(this.car.speed.length() / 30, 0, 1)));
    }

    updateBrake(doBrake, brakeKey) {
        if (doBrake && this.brakeKey === undefined) {
            this.brakeKey = brakeKey;
        } else if (!doBrake && this.brakeKey === brakeKey) {
            this.brakeKey = undefined;
        }
    }

    updateHandbrake(doHandbrake) { 
        this.isHandbraking = doHandbrake;
        this.car.updateHandbrake(doHandbrake);
        if (this.car.speedOnXZPlane.length() < 0.1) {
            this.car.setGear(0);
        }
    }
    
    isBraking() {
        return this.brakeKey !== undefined;
    }

    handleInputs(inputArr) {
        for (let i = 0; i < inputArr.length; i++) {
            switch (inputArr[i]) {
                case 'ShiftLeft': // shift
                    this.pressLeftShift();
                    break;
                case 'ShiftRight': // shift
                    this.pressRightShift();
                    break;
                case 'Space': // space
                    this.pressSpace();
                    break;
                case 'ArrowLeft': // left 
                    this.pressArrowLeft();
                    break;
                case 'ArrowUp': // up
                    this.pressArrowUp();
                    break;
                case 'ArrowRight': // right
                    this.pressArrowRight();
                    break;
                case 'ArrowDown': // down
                    this.pressArrowDown();
                    break;
                case '-ShiftLeft': // shift
                    this.releaseLeftShift();
                    break;
                case '-ShiftRight': // shift
                    this.releaseRightShift();
                    break;
                case '-Space': // space
                    this.releaseSpace();
                    break;
                case '-ArrowLeft': // left
                    this.releaseArrowLeft();
                    break;
                case '-ArrowUp': // up
                    this.releaseArrowUp();
                    break;
                case '-ArrowRight': // right
                    this.releaseArrowRight();
                    break;
                case '-ArrowDown': // down
                    this.releaseArrowDown();
                    break; 
                case 'KeyR':
                    this.pressRKey();
                    break;
                case '-KeyR':
                    break;
            }
        }
        this.updateValues();
    }

    pressArrowUp() {
        this.isUpPressed = true;

        if (this.car.gear < 0) {
            this.updateBrake(true, "up");
        } else if (this.car.gear === 0) {
            if (this.isHandbraking) {
                this.throttleGoal = 1;
            } else {
                this.car.setGear(1);
                this.throttleGoal = 1;
            }
        } else {
            this.throttleGoal = 1;
        }
    }

    pressArrowDown() {
        this.isDownPressed = true;

        if (this.car.gear > 0) {
                this.updateBrake(true, "down");
            } else if (this.car.gear === 0) {
                if (this.isHandbraking) {
                    this.throttleGoal = 1;
                } else {
                    this.car.setGear(-1);
                    this.throttleGoal = 1;
                }
            } else {
                this.throttleGoal = 1;
        }
    }

    releaseArrowUp() {
        this.isUpPressed = false;

        if (this.car.gear < 0) {
            this.updateBrake(false, "up");
        } else if (this.car.gear === 0 && this.brakeKey === "up") {
            this.updateBrake(false, "up"); 
            if (this.isDownPressed) {
                this.car.setGear(-1);
            }
        } else if (this.isHandbraking && Math.abs(this.car.speed.dot(this.car.forward)) < 0.5) {
            this.car.setGear(0);
            this.throttleGoal = 0;
        } else {
            this.throttleGoal = 0;
        }
    }

    releaseArrowDown() {
        this.isDownPressed = false;

        if (this.car.gear > 0) {
            this.updateBrake(false, "down");
        } else if (this.car.gear === 0 && this.brakeKey === "down") {
            this.updateBrake(false, "down"); 
            if (this.isUpPressed) {
                this.car.setGear(1);
            }
        } else if (this.isHandbraking && Math.abs(this.car.speed.dot(this.car.forward)) < 0.5) {
            this.car.setGear(0);
            this.throttleGoal = 0;
        } else {
            this.throttleGoal = 0;
        }
    }

    releaseArrowLeft() {
        this.steeringGoal += 1;
    }

    releaseArrowRight() {
        this.steeringGoal += -1;
    }
    
    pressArrowLeft() {
        this.steeringGoal += -1;
    }

    pressArrowRight() {
        this.steeringGoal += 1;
    }

    pressSpace() {
        this.updateHandbrake(true);
    }

    releaseSpace() {
        if (this.car.gear === 0) {
                if (this.brakeKey === "down") {
                    this.car.setGear(1);
                } else if (this.brakeKey === "up") {
                    this.car.setGear(-1);
                } else if (this.isUpPressed) {
                    this.car.setGear(1);
                } else if (this.isDownPressed) {
                    this.car.setGear(-1)
                }
        }
        this.updateHandbrake(false);
    }

    onBrakeStop() {
        if (this.throttleGoal !== 0) {
            return;
        } else if (this.isDownPressed) {
            this.car.setGear(-1);
            this.throttleGoal = 1;
            this.updateBrake(false, "down")
        } else if (this.isUpPressed) {
            this.car.setGear(1);
            this.throttleGoal = 1;
            this.updateBrake(false, "up")
        }

    }
     
    onPark() {
        this.throttleGoal = 0;
    }

    pressLeftShift() {
        this.car.adjustMaxGear(-1);
    }

    pressRightShift() {
        this.car.adjustMaxGear(1);
    }

    releaseLeftShift() {
        //this.car.adjustMaxGear(1);
    }

    releaseRightShift() {
        //this.car.adjustMaxGear(-1);
    }

    pressRKey() {
        this.setDefaults();
        this.car.respawn();
    }
}

export default PlayerController;
