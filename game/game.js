import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as RAPIER from '@dimforge/rapier3d';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import {vertexShaderText} from './shaders/vertex.js';
import {fragmentShaderText} from './shaders/fragment.js';
import EntityManager from './entityManager.js';
import Player from './player.js';
import {CAMERA_MODE} from './player.js';
import Terrain from './terrain.js';
import PerformanceLog from './performanceLog.js';
import HUD from './hud.js';


const CANVAS_BUFFER_HEIGHT = 125;
const BACKGROUND_COLOR = 0xcccccc;
const FOV = 90;
const Z_NEAR = 0.1;
const Z_FAR = 30000;


class GameDemo {

    // Canvas Properties
    canvas;
    windowAspectRatio;
    canvasMouseX;
    canvasMouseY;
    // THREE.js Properties
    scene;
    camera;
    program;
    // HUD
    hudCanvas;
    hudCtx;
    // Game Logic Properties
    prevTimestamp;
    inputManager;
    entityManager;
    debug;
    cameraSettings;
    pause;

    
    constructor() {
        this.debugSettings = {
            showColliders: false,
            cameraMode: CAMERA_MODE.THIRD_PERSON,
        }

        this.settings = {
            resolution: CANVAS_BUFFER_HEIGHT
        }
        
        this.canvasSetup();
        this.gameSetup();
        this.createDebugPanel();
    }

    createDebugPanel () {
        const gui = new GUI( { width: 310 , title: "Settings"} );

        const folder1 = gui.addFolder( 'Camera' ).close();

        folder1.add(this.debugSettings, 'showColliders').name('Show Colliders (Performance Intensive)').onChange((enabled) => {
            this.rapierDebug.enabled = enabled;
            this.rapierDebug.update();
            this.performanceMonitor.setVisible(enabled);
        });

        folder1.add(this.debugSettings, 'cameraMode', CAMERA_MODE).name('Camera Mode').onChange((mode) => {
            this.debugSettings.cameraMode = mode;
            if (mode = CAMERA_MODE.ORBIT_ORIGIN) {
                this.controls.target.set(0, 0.5, 0);
            }
        });

        folder1.add(this.settings, 'resolution', 1, 1000).step(25).name('Resolution').onChange((resolution) => {
            this.settings.resolution = resolution;
            this.resize();
        });

        this.player.addCarSettingsToGUI(gui);
        gui.close();
    }

    run() {
        this.prevTimestamp = null;
        this.gameLoop();
    }

    canvasSetup() {
        // Canvas and render program setup
        this.windowAspectRatio = 1;
        this.canvas = document.getElementById('game-surface');
        this.rendererSetup();
        this.hud = new HUD(this.renderer);

        // Resize Event Listeners
        this.resize();
        window.addEventListener("resize", () => {this.resize();});
        window.addEventListener("orientationchange", () => {this.resize();});
    }

    rendererSetup() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(FOV, this.windowAspectRatio, Z_NEAR, Z_FAR);
        this.scene.add(this.camera);
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            canvas: this.canvas,
        });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(BACKGROUND_COLOR, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    
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

        this.renderer.setSize(this.settings.resolution * this.windowAspectRatio, this.settings.resolution);
        this.canvas.style.height = '101dvh';
        this.canvas.style.width = '100%';

        this.hud.resize(this.windowAspectRatio);
    }

    async gameSetup() {
        // System Managers
        this.world = new RAPIER.World({x: 0, y: -9.81, z: 0});
        this.entityManager = new EntityManager(this.world);
        this.inputManager = new InputManager();

        // IO
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();
            
        // Performance
        this.performanceMonitor = new PerformanceLog();
        this.performanceMonitor.setVisible(false);
        // Debugging
        this.rapierDebug = new RapierDebugRenderer(this.scene, this.world);
        // Camera Controls Options
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);  
        this.camera.position.set(.3, 100, .3);  
        this.controls.target.set(0, 0.5, 0);
        // Pause
        this.pause = true;
        this.pauseMenu = new PauseMenu(this.pause, (isPause) => {this.onPause(isPause)});
        this.entityManager.addEntity(this.pauseMenu);

        // Player
        this.player = new Player(
            this.scene, 
            this.camera, 
            RAPIER, 
            this.world, 
            this.debugSettings, 
            () => {this.entityManager.addEntity(this.player)},
            (gear) => {this.hud.updateGear(gear)},
            (maxGear) => {this.hud.updateMaxGear(maxGear)}
        );

        // Terrain
        this.terrain = new Terrain(this.scene, RAPIER, this.world, () => {this.entityManager.addEntity(this.terrain)});

        // Light and Fog
        const light = new THREE.AmbientLight( 0x404040, 10 ); // soft white light
        this.scene.add( light );

        const sunlight = new THREE.DirectionalLight(0xffffff);
        sunlight.position.set(0, 10, 2);
        this.scene.add(sunlight);
         
        const color = BACKGROUND_COLOR;
        const density = 0.008;
        this.scene.fog = new THREE.FogExp2(color, density);
        
        this.entityManager.updateEntities();
        this.run()
        return;
    }

    loadAndAddModel(modelPath) {
        this.gltfLoader.load(modelPath, (gltf) => {
            gltf.scene.position.y = -100;
            this.scene.add(gltf.scene);
        });
    }

    onPause(isPaused) {
        this.pause = isPaused;
    }

    gameLoop() {
        requestAnimationFrame((timestamp) => {
            if (this.prevTimestamp === null) {
              this.prevTimestamp = timestamp * 0.001;
            }

            this.gameLoop();

            if (this.debugSettings.cameraMode !== CAMERA_MODE.THIRD_PERSON) {
                if (this.debugSettings.cameraMode === CAMERA_MODE.ORBIT_CAR && this.player.mesh !== undefined) {
                    this.controls.target.set(
                        this.player.mesh.position.x,
                        this.player.mesh.position.y,
                        this.player.mesh.position.z
                    );
                    this.controls.update();
                }
                this.controls.update();
            }

            if (this.pause) {
                this.handlePauseInputs();
            } else {
                this.handleInputs();
                this.updateGameState();
            }

            if (this.debugSettings.showColliders) {
                this.performanceMonitor.update();
                this.rapierDebug.update();
            }

            this.render();

            // Save the time we last rendered
            this.prevTimestamp = timestamp * 0.001;
        });
    }

    handleInputs() {
        this.entityManager.handleInputs(this.inputManager.getPendingInputs());
        this.inputManager.flushInputs();
    }

    handlePauseInputs() {
        this.entityManager.handlePauseInputs(this.inputManager.getPendingInputs());
        this.inputManager.flushInputs();  
    }

    updateGameState() {
        this.entityManager.updateEntities(); // Addition and removal of entities
        this.entityManager.updatePhysics(); // used to update the location of each entity based on the physical sim
    }

    render() {
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.hud.render();
    }
}

class InputManager {
    
    constructor() {
        this.pendingInputs = [];
        this.keyDownEventFunction = (e) => this.onKeyDown(e);
        this.keyUpEventFunction = (e) => this.onKeyUp(e);
        this.addEventListeners();
    }

    addEventListeners() {
        document.addEventListener('keydown', this.keyDownEventFunction, false);
        document.addEventListener('keyup', this.keyUpEventFunction, false);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.keyDownEventFunction);
        document.removeEventListener('keyup', this.keyUpEventFunction);
    }

    onKeyDown(event) {
        if (event.repeat) {
            return; // Ignore auto-repeat events
        }
        this.pendingInputs.push(event.code);
    }

    onKeyUp(event) {
        this.pendingInputs.push('-' + event.code);
    }

    flushInputs() {
        this.pendingInputs.length = 0;
    }

    getPendingInputs() {
        return this.pendingInputs;
    }

}

class PauseMenu {

    constructor(isPaused, onPause) {
        this.isPaused = isPaused;
        this.pauseMenu = document.getElementById('controls');
        this.onPause = onPause;
        this.active = true;
    }

    handleInputs(inputArr) {
        this.handlePauseInputs(inputArr);
    }

    handlePauseInputs(inputArr) {
        if (inputArr.includes("-Enter")) {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.pauseMenu.classList.remove('hidden');
            } else {
                this.pauseMenu.classList.add('hidden');
            }
            this.onPause(this.isPaused);
            return;
        }
    }
}

class RapierDebugRenderer {

  constructor(scene, world) {
    this.world = world
    this.mesh = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true }))
    this.mesh.frustumCulled = false
    scene.add(this.mesh)
    
    this.enabled = true
  }

  update() {
    if (this.enabled) {
      const { vertices, colors } = this.world.debugRender()

      this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      this.mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
      this.mesh.visible = true
    } else {
      this.mesh.visible = false
    }
  }
}

const game = new GameDemo()
