class Entity {
    constructor() {
        this.active = true;
    }

    delete() {
        this.active = false;
    }
}

export default Entity;