import * as THREE from 'https://esm.sh/three@0.169.0';
import Entity from './entity.js';

const HEIGHT_MAP_PATH = './assets/heightMap.png';
const NORMAL_MAP_PATH = './assets/normalMap.png';
const TERRAIN_TEXTURE_PATH = './assets/road.png';
const DEMO_TERRAIN_MODEL_PATH = './assets/demoTerrain.gltf';

const OVERALL_SCALE = 1000; // Set at 1000, we are roughly properly scaling up the model of breckenridge so that 1m = 1m
const DISPLACEMENT_SCALE = 6 * OVERALL_SCALE;
const TERRAIN_WIDTH = 61 * OVERALL_SCALE;
const TERRAIN_HEIGHT = 49 * OVERALL_SCALE;
const DIVISIONS_BY_WIDTH = 183;
const DIVISIONS_BY_HEIGHT = 147;

class Terrain extends Entity {
    
    constructor(scene, RAPIER, world, textureLoader) {
        super()
        this.world = world;
        this.RAPIER = RAPIER;

        this.innitPhysics(this.generateMesh(textureLoader))
        this.scene = scene;
        this.scene.add(this.mesh);

        //RAPIER.addHeightfield( mesh : Mesh, width : number, depth : number, heights : Float32Array, scale : Object ) : RigidBody
    }

    generateMesh(textureLoader) {
        const heightMap = textureLoader.load(HEIGHT_MAP_PATH);
        const normalMap = textureLoader.load(NORMAL_MAP_PATH);
        const texture = textureLoader.load(TERRAIN_TEXTURE_PATH);
        const terrainMat = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: normalMap,
            displacementMap: heightMap,
            displacementScale: DISPLACEMENT_SCALE
        })
        const terrainGeo = new THREE.PlaneGeometry(TERRAIN_WIDTH,TERRAIN_HEIGHT,DIVISIONS_BY_WIDTH,DIVISIONS_BY_HEIGHT)
        this.mesh = new THREE.Mesh(terrainGeo, terrainMat);

        this.mesh.rotateX(-Math.PI / 2);
        //this.mesh.scale.set(OVERALL_SCALE, OVERALL_SCALE, OVERALL_SCALE);
        this.mesh.position.y = -780;
        this.mesh.position.z = -23000;
        this.mesh.position.x = -21500;

        return heightMap;
    }

    innitPhysics(heightMap) {
        const shape = this.RAPIER.ColliderDesc.heightfield(
            TERRAIN_WIDTH, 
            TERRAIN_HEIGHT, 
            [[0.0,0.0],[2.2,0.1]], 
            DISPLACEMENT_SCALE
        );

		const bodyDesc = this.RAPIER.RigidBodyDesc.fixed();
		bodyDesc.setTranslation(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
		bodyDesc.setRotation(this.mesh.quaternion);

		const body = this.world.createRigidBody(bodyDesc);
		this.world.createCollider(shape, body);

		return body;
    }

}

export default Terrain;