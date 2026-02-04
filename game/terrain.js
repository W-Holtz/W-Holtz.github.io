import * as THREE from '../node_modules/three';
import Entity from './entity.js';
import * as NOISE from 'noisejs';
import {GLTFLoader} from '../node_modules/three/addons/loaders/GLTFLoader.js';
let r;

const HEIGHT_MAP_PATH = './assets/heightMap.png';
const NORMAL_MAP_PATH = './assets/normalMap.png';
const TERRAIN_TEXTURE_PATH = './assets/road.png';
const DEMO_ROAD_MODEL_PATH = './assets/demoRoad.glb'
const DEMO_TERRAIN_MODEL_PATH = './assets/demoTerrain.glb';

const OVERALL_SCALE = 1000; // Set at 1000, we are roughly properly scaling up the model of breckenridge so that 1m = 1m
const DISPLACEMENT_SCALE = .2 * OVERALL_SCALE;
const TERRAIN_WIDTH = 1 * OVERALL_SCALE;
const TERRAIN_DEPTH = 4 * OVERALL_SCALE;
const SUBDIVS_BY_WIDTH = 100;
const SUBDIVS_BY_DEPTH = 100;
const VERTS_BY_WIDTH = SUBDIVS_BY_WIDTH + 1;
const VERTS_BY_DEPTH = SUBDIVS_BY_DEPTH + 1;

class Terrain extends Entity {
    
    constructor(scene, RAPIER, world, callback) {
        super()
        r = RAPIER;
        this.world = world;
        this.scene = scene;
        this.noise = new NOISE.Noise();

        //this.generateMesh();
        this.glbPath = DEMO_ROAD_MODEL_PATH;
        this.loadMesh(callback);
        //this.scene.add(this.mesh);

    }

    loadMesh(callback) {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            this.glbPath,
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

    glbLoadCallback(glb) {
        if (this.glbPath === DEMO_TERRAIN_MODEL_PATH) {
            this.loadDemoTerrain(glb);
        } else if (this.glbPath === DEMO_ROAD_MODEL_PATH) {
            this.loadDemoRoad(glb);
        }
    }

    loadDemoTerrain (glb) {
        const position = new THREE.Vector3(396, -88, -130);
        const glbRoot = glb.scene.children[0];
                  
        // Add to scene
        this.roadMesh = glbRoot.children[2];
        this.shoulderMesh = glbRoot.children[1];
        this.terrainMesh = glbRoot.children[0];
        this.meshes = [this.roadMesh, this.shoulderMesh, this.terrainMesh];

        while (glbRoot.children.length !== 0) {
            glbRoot.children[0].geometry.applyMatrix4(glbRoot.matrix);
            glbRoot.children[0].position.copy(position);
            glbRoot.children[0].geometry.computeVertexNormals();
            glbRoot.children[0].material.flatShading = true;
            glbRoot.children[0].material.needsUpdate = true;
            this.scene.add(glbRoot.children[0]);
        }
        
        // Initialize everything else
        this.innitMeshPhysics();
    }

    loadDemoRoad (glb) {
        const position = new THREE.Vector3(-8, -3, 0);
        const glbRoot = glb.scene;

        // Add to scene
        this.roadMesh = glbRoot.children[0];
        this.meshes = [this.roadMesh];

        glbRoot.children[0].geometry.applyMatrix4(glbRoot.children[0].matrix);
        glbRoot.children[0].position.copy(position);
        glbRoot.children[0].geometry.computeVertexNormals();
        glbRoot.children[0].material.flatShading = true;
        glbRoot.children[0].material.needsUpdate = true;
        glbRoot.children[0].material.map.anisotrophy = 16;
        glbRoot.children[0].material.map.minFilter = THREE.NearestFilter;
        glbRoot.children[0].material.map.needsUpdate = true;
        this.scene.add(glbRoot.children[0]);
        
        // Initialize everything else
        this.innitMeshPhysics();
    }

    innitMeshPhysics() {
        this.colliders = new Array(this.meshes.length);
        for (let i = 0; i < this.meshes.length; i++) {
            const vertices = new Float32Array(this.meshes[i].geometry.attributes.position.array);
            const indices = new Uint32Array((this.meshes[i].geometry.index).array);
            
            const clDesc = new r.ColliderDesc(new r.TriMesh(vertices, indices))
                .setTranslation(this.meshes[i].position.x,this.meshes[i].position.y, this.meshes[i].position.z);
            const rigidBody = this.world.createRigidBody(r.RigidBodyDesc.fixed());
            this.colliders[i] = this.world.createCollider(clDesc, this.rigidBody);
        }
    }

    generateMesh() {
        const terrainMat = new THREE.MeshStandardMaterial({
            wireframe: false,
            color: 0xFFFaaF,
            side: THREE.FrontSide,
        });
        
        const terrainGeo = new THREE.PlaneGeometry(
            TERRAIN_WIDTH, 
            TERRAIN_DEPTH, 
            SUBDIVS_BY_WIDTH, 
            SUBDIVS_BY_DEPTH
        );
        
        this.mesh = new THREE.Mesh(terrainGeo, terrainMat);
        const columnMajorHeightArr = this.applyHeightMap();

        this.mesh.rotateX(-Math.PI / 2);
        this.mesh.geometry.computeVertexNormals();

        this.innitHeightMapPhysics(columnMajorHeightArr);
    }

    innitHeightMapPhysics(columnMajorHeightArr) {
        let groundBodyDesc = r.RigidBodyDesc.fixed();
        let groundBody = this.world.createRigidBody(groundBodyDesc);
        let groundCollider = r.ColliderDesc.heightfield(
            SUBDIVS_BY_WIDTH, 
            SUBDIVS_BY_DEPTH, 
            new Float32Array(columnMajorHeightArr), 
            new THREE.Vector3(TERRAIN_WIDTH,1,TERRAIN_DEPTH)
            )
            .setTranslation(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
        this.collider = this.world.createCollider(groundCollider, groundBody);
    }

    applyHeightMap() {
        // RAPIER assumes the flat height array will be column-major
        const columnMajorHeightArr = new Float32Array((VERTS_BY_WIDTH) * (VERTS_BY_DEPTH)).fill(0);
        let height = 0;

        for (let vertIdx = 0, heightIdx = 0; vertIdx < this.mesh.geometry.attributes.position.array.length; vertIdx += 3, heightIdx += VERTS_BY_WIDTH) {
            if (heightIdx >= columnMajorHeightArr.length) {
                heightIdx = 1 + (heightIdx % VERTS_BY_WIDTH);
            }

            // Get Value
            height = this.getVertexHeight(
                this.mesh.geometry.attributes.position.array[vertIdx], 
                this.mesh.geometry.attributes.position.array[vertIdx + 1]
            );

            // Set Value
            this.mesh.geometry.attributes.position.array[vertIdx + 2] = height;
            columnMajorHeightArr[heightIdx] = height;
        }

        return columnMajorHeightArr;
    }


    getVertexHeight(x, z) {
        return 0;//DISPLACEMENT_SCALE * this.noise.perlin2(x/TERRAIN_WIDTH, z/TERRAIN_DEPTH);
    }

    updatePhysics() {
        return;
    }

}

export default Terrain;