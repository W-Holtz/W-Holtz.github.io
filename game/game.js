import * as THREE from 'https://esm.sh/three@0.169.0';
import { GLTFLoader } from 'https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

import {vertexShaderText} from './shaders/vertex.js';
import {fragmentShaderText} from './shaders/fragment.js';
import EntityManager from './entityManager.js';
import Player from './player.js';
import Terrain from './terrain.js';
import PerformanceLog from './performanceLog.js';

const CANVAS_BUFFER_HEIGHT = 200;
const BACKGROUND_COLOR = 0xdddddd;
const FOV = 75;
const Z_NEAR = 0.1;
const Z_FAR = 30000;

class GameDemo {

    // Canvas Properties
    canvas;
    windowAspectRatio
    canvasMouseX;
    canvasMouseY;
    // THREE.js Properties
    scene;
    camera;
    program;
    // Game Logic Properties
    prevTimestamp;
    inputManager;
    entityManager;

    
    constructor() {
        RAPIER.init().then(() => {
            this.canvasSetup();
            this.gameSetup();
            this.run();
        });
    }

    //DONE
    run() {
        this.prevTimestamp = null;
        this.gameLoop();
    }

    //DONE
    canvasSetup() {
        // Canvas and render program setup
        this.canvas = document.getElementById('game-surface');
        this.rendererSetup();

        // Resize Event Listeners
        this.resize();
        window.addEventListener("resize", () => {this.resize();});
        window.addEventListener("orientationchange", () => {this.resize();});
    }

    //DONE
    rendererSetup() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(FOV, this.windowAspectRatio, Z_NEAR, Z_FAR);
        this.scene.add(this.camera);
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            canvas: this.canvas,
        });
        this.renderer.setClearColor(BACKGROUND_COLOR, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    
    //DONE
    resize() {
       /*              --- RESIZING ---
        *   There are two "sizes" we need to worry about:
        *   1.) The size of the canvas (scaling)
        *   2.) The resolution/aspect ratio of the canvas
        *
        *   The "style" (i.e canvas.style) of of the canvas element is actually the css and html rendering 
        *   tool used by the frontend to size the canvas element on the website. In other words, when we set 
        *   canvas.style, we are telling the browser how much space the canvas element should take up on the 
        *   page.
        * 
        *   The canvas.width and canvas.height are special attributes of canvas element to deterine the size
        *   of the canvas's draw buffer (the canvas's... canvas?). A similar idea would be the resolution of
        *   an image. These properties determine the number of pixels the canvas will store and they are set
        *   using the three.js API "setSize"
        */
        this.windowAspectRatio = (window.innerWidth)/window.innerHeight;
        this.camera.aspect = this.windowAspectRatio;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(CANVAS_BUFFER_HEIGHT*this.windowAspectRatio, CANVAS_BUFFER_HEIGHT);
        this.canvas.style.height = '101dvh';
        this.canvas.style.width = '100%';
    }

    gameSetup() {
        // System Managers
        this.world = new RAPIER.World({y: -9.81});
        this.entityManager = new EntityManager(this.world);
        this.inputManager = new InputManager();

        // IO
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();

        // Performance
        this.entityManager.addEntity(new PerformanceLog());

        // Player
        this.player = new Player(this.scene, this.camera);
        this.entityManager.addEntity(this.player);

        // Terrain
        this.terrain = new Terrain(this.scene, RAPIER, this.world, this.textureLoader);
        this.entityManager.addEntity(this.terrain);

        // Light
        const sunlight = new THREE.DirectionalLight(0xffffff);
        sunlight.position.set(0, 10, 10);
        this.scene.add(sunlight);
        
        return;
    }

    loadAndAddModel(modelPath) {
        this.gltfLoader.load(modelPath, (gltf) => {
            gltf.scene.position.y = -100;
            this.scene.add(gltf.scene);
        });
    }

    gameLoop() {
        requestAnimationFrame((timestamp) => {
            if (this.prevTimestamp === null) {
              this.prevTimestamp = timestamp * 0.001;
            }
            // TODO: Add frame synchronization (resources below)
            // * https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/
            // * https://www.youtube.com/watch?v=NIpDIYgo_BU
            this.gameLoop();

            // For more on game loop structure: https://gameprogrammingpatterns.com/game-loop.html
            this.handleInputs();
            this.updateGameState();
            this.render();

            // Save the time we last rendered
            this.prevTimestamp = timestamp * 0.001;
        });
    }

    handleInputs() {
        this.entityManager.handleInputs(this.inputManager.getPendingInputs());
        this.inputManager.flushInputs();
    }

    updateGameState() {
        this.entityManager.updateEntities(); // Addition and removal of entities
        this.entityManager.updatePhysics(); // used to update the location of each entity based on the physical sim
        this.entityManager.updateMovement(); // TBD on this one
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

class InputManager {
    
    constructor() {
        this.pendingInputs = [];
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    }

    onKeyDown(event) {
        if (event.repeat) {
            return; // Ignore auto-repeat events
        }
        this.pendingInputs.push(event.keyCode);
    }

    onKeyUp(event) {
        this.pendingInputs.push(event.keyCode * -1);
    }

    flushInputs() {
        this.pendingInputs.length = 0;
    }

    getPendingInputs() {
        //if (this.pendingInputs.length>0){
        //console.log(this.pendingInputs)}
        return this.pendingInputs;
    }

}

const game = new GameDemo()
