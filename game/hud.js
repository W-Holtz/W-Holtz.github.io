import * as THREE from '../node_modules/three';
import {vertexShaderText} from './shaders/hudVertex.js';
import {fragmentShaderText} from './shaders/hudFragment.js';
 
const HUD_HEIGHT = 0.3;
const HUD_WIDTH = 1;

const GAUGE_PATHS = {
    RPM: './assets/rpmGauge.png',
    SPEED: './assets/mphGauge.png',
};
const GAUGE_SIDE = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
};
const NEEDLE_PATH = './assets/gaugeNeedle.png';

const GEAR_INDICATOR_PATH =  './assets/gearIndicator.png';
const GEAR_INDICATOR_INDEX = {
    BORDER: 0,
    "-1": 1,
    P: 2,
    0: 3,
    D: 4,
    1: 5,
    2: 6,
    3: 7,
    4: 8,
    5: 9,
    Max: 10,
};

const GEAR_INDICATOR_WIDTH = 27;
const GEAR_INDICATOR_HEIGHT = 22;

class HUD {

    constructor(renderer) {
        this.renderer = renderer;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            -0.5,
            0.5,
            0.5, 
            -0.5,
            0,
            1
        );

        this.height = HUD_HEIGHT;
        this.width = HUD_WIDTH;

        const loader = new THREE.TextureLoader();
        this.loadIndicator(loader);
        this.loadRpmDial(loader);
        this.loadSpeedDial(loader);
    }

    loadIndicator(loader) {
        this.indicatorSkins = [
            GEAR_INDICATOR_INDEX.P,
            GEAR_INDICATOR_INDEX[0],
            GEAR_INDICATOR_INDEX['-1'],
            GEAR_INDICATOR_INDEX[1],
            GEAR_INDICATOR_INDEX[2],
            GEAR_INDICATOR_INDEX[3],
            GEAR_INDICATOR_INDEX[4],
            GEAR_INDICATOR_INDEX[5],
        ];
        this.maxGearIndicatorSkinIndex = this.indicatorSkins.length - 1;


        loader.load(
            './assets/gearIndicator.png',
            (texture) => {
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.needsUpdate = true;
                this.indicatorAtlasMap = texture;
                this.addGearIndicator();
            },
            null,
            (err) => {
                console.log('Error:', err);
            }
        );
    }

    loadSpeedDial(loader) {
        loader.load(
            './assets/mphGauge.png',
            (texture) => {
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.needsUpdate = true;
                this.mphGaugeMap = texture;
                this.addDial(GAUGE_PATHS.SPEED, GAUGE_SIDE.LEFT);
            },
            null,
            (err) => {
                console.log('Error:', err);
            }
        );
    }

    loadRpmDial(loader) {
        loader.load(
            './assets/rpmGauge.png',
            (texture) => {
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.needsUpdate = true;
                this.rpmGaugeMap = texture;
                this.addDial(GAUGE_PATHS.RPM, GAUGE_SIDE.RIGHT);
            },
            null,
            (err) => {
                console.log('Error:', err);
            }
        );
    }

    addDial(dialPath, dialSide) {

    }

    addGearIndicator () { // TODO : Kill the magic numbers
        const material = new THREE.ShaderMaterial( {
            vertexShader: vertexShaderText,
            fragmentShader: fragmentShaderText,
            uniforms: {
                textureAtlas: {value: this.indicatorAtlasMap},
                heightStep: {value: 1 / Object.keys(GEAR_INDICATOR_INDEX).length},
                widthStep: {value: 0.5},
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        } );
        
        const planeGeometry = new THREE.PlaneGeometry(GEAR_INDICATOR_WIDTH * 0.0013, GEAR_INDICATOR_HEIGHT * 0.001);
        const frames = new Array(this.indicatorSkins.length).fill(0);
        this.currIndicatorSkinIndex = 0;
        frames[this.currIndicatorSkinIndex] = 1;

        const finalSkins = this.indicatorSkins.concat(new Array(this.indicatorSkins.length).fill(GEAR_INDICATOR_INDEX.BORDER));
        const finalFrames = frames.concat(frames);

        finalSkins.push(GEAR_INDICATOR_INDEX.Max);
        finalFrames.push(0);
        
        const textureSkin = new Float32Array(finalSkins);
        const textureFrame = new Float32Array(finalFrames);
        
        planeGeometry.setAttribute('textureSkin', new THREE.InstancedBufferAttribute(textureSkin, 1));
        planeGeometry.setAttribute('textureFrame', new THREE.InstancedBufferAttribute(textureFrame, 1));

        this.gearIndicator = new THREE.InstancedMesh(planeGeometry, material, finalSkins.length);
        
        this.setIndicatorPositions();
        this.scene.add(this.gearIndicator);
    }

    updateDials(mph, rpm) {

    }

    updateGear(gear) {
        if (this.gearIndicator === undefined) { return; }

        if (gear === -1) {
            gear = "-1";
        }
        gear = GEAR_INDICATOR_INDEX[gear];

        const textureFrameAttr = this.gearIndicator.geometry.getAttribute('textureFrame');
        this.updateCurrGearSkin(0, textureFrameAttr);

        this.currIndicatorSkinIndex = this.indicatorSkins.indexOf(gear);
        this.updateCurrGearSkin(1, textureFrameAttr);

        textureFrameAttr.needsUpdate = true;
    }

    updateCurrGearSkin(skin, textureFrameAttr) {
        textureFrameAttr.array[this.currIndicatorSkinIndex + this.indicatorSkins.length] = skin;
        textureFrameAttr.array[this.currIndicatorSkinIndex] = skin;
        if (this.currIndicatorSkinIndex === this.maxGearIndicatorSkinIndex) {
            textureFrameAttr.array[this.indicatorSkins.length * 2] = skin;
        }
    }

    updateMaxGear(gear) {
        if (this.gearIndicator === undefined) { return; }
        
        if (this.currIndicatorSkinIndex === this.maxGearIndicatorSkinIndex) {
            const textureFrameAttr = this.gearIndicator.geometry.getAttribute('textureFrame');
            textureFrameAttr.array[this.indicatorSkins.length * 2] = 0;
            textureFrameAttr.needsUpdate = true;
        }

        if (gear === -1) {
            gear = "-1";
        }

        this.maxGearIndicatorSkinIndex = this.indicatorSkins.indexOf(GEAR_INDICATOR_INDEX[gear]);
        
        if (this.currIndicatorSkinIndex === this.maxGearIndicatorSkinIndex) {
            const textureFrameAttr = this.gearIndicator.geometry.getAttribute('textureFrame');
            textureFrameAttr.array[this.indicatorSkins.length * 2] = 1;
            textureFrameAttr.needsUpdate = true;
        }

        this.updateMaxGearPosition();
    }


    resize(windowAspectRatio) {
        this.camera.top = 0.5 / windowAspectRatio;
        this.camera.bottom = -0.5 / windowAspectRatio;
        this.camera.updateProjectionMatrix();

        if (this.gearIndicator !== undefined) {
            this.setIndicatorPositions();
        }
    }

    setIndicatorPositions() {
        const dummyMatrix = new THREE.Matrix4();
        for (let i = 0; i < this.indicatorSkins.length; i++) {
            dummyMatrix.setPosition(-0.17 + i * 0.05, this.camera.bottom + 0.04, 0);
            this.gearIndicator.setMatrixAt(i, dummyMatrix);
            this.gearIndicator.setMatrixAt(i + this.indicatorSkins.length, dummyMatrix);
        }

        this.updateMaxGearPosition();
    }

    updateMaxGearPosition() {
        const dummyMatrix = new THREE.Matrix4();
        this.gearIndicator.getMatrixAt(this.maxGearIndicatorSkinIndex, dummyMatrix);
        dummyMatrix.elements[13] += 0.025;
        this.gearIndicator.setMatrixAt(this.indicatorSkins.length * 2, dummyMatrix);
        this.gearIndicator.instanceMatrix.needsUpdate = true;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
 }

 export default HUD;