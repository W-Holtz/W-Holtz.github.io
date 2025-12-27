// There's probably a better way of handling the implementation of these functions
// but since js is so loosely typed, I don't want to waste time on handling it.
const MOVEMENT_FUNC = 'updateMovement';
const INPUT_FUNC = 'handleInputs';
const WEATHER_FUNC = 'updateWeather';
const PHYSICS_FUNC = 'updatePhysics';

class EntityManager {
    
    constructor(world) {
        this.entities = [];
        this.pendingEntities = [];

        // systems
        this.inputEntities = [];
        this.movementEntities = [];
        this.phsyicsEntities = [];
        this.systemMap = {
            [INPUT_FUNC]: this.inputEntities,
            [MOVEMENT_FUNC]: this.movementEntities,
            [PHYSICS_FUNC]: this.phsyicsEntities,
        }

        this.world = world;
    }

    addEntity(entity) {
        this.pendingEntities.push(entity);
    }

    handleInputs(inputArr) {
        for (let i = 0; i < this.inputEntities.length; i++) {
            this.inputEntities[i].handleInputs(inputArr);
        }
    }
    
    updateMovement() {
        for (let i = 0; i < this.movementEntities.length; i++) {
            this.movementEntities[i].updateMovement();
        }
    }

    updatePhysics() {
        this.world.step()
        for (let i = 0; i < this.phsyicsEntities.length; i++) {
            this.phsyicsEntities[i].updatePhysics();
        }
    }

    updateEntities() {
        this.updateRemoval();
        this.addPending();
    }

    updateRemoval() {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.active) {
                continue;
            }
            this.entities.splice(i, 1);

            // remove from all systems
            for (const functionKey in this.systemMap) {
                if (typeof entity[functionKey] === 'function') {
                    this.systemMap[functionKey].splice(this.systemMap[functionKey].indexOf(entity), 1);
                }
            }
        }
    }

    addPending() {
        for (const entity of this.pendingEntities) {
            this.entities.push(entity);
            
            // add to systems
            for (const functionKey in this.systemMap) {
                if (typeof entity[functionKey] === 'function') {
                    this.systemMap[functionKey].push(entity);
                }
            }
        }

        this.pendingEntities.length = 0;
    }

}

export default EntityManager;