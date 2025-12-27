import Stats from 'https://unpkg.com/three@0.169.0/examples/jsm/libs/stats.module.js';

class PerformanceLog {

    constructor() {
        //FPS stats
        const statsFPS = new Stats();
        statsFPS.domElement.style.cssText = "position:absolute;top:3px;left:3px;";
        statsFPS.showPanel(0); // 0: fps,

        //Memory stats
        const statsMemory = new Stats();
        statsMemory.showPanel(2); //2: mb, 1: ms, 3+: custom
        statsMemory.domElement.style.cssText = "position:absolute;top:3px;left:84px;";

        document.body.appendChild(statsFPS.dom);
        document.body.appendChild(statsMemory.dom);
    }

    update() {
        statsFPS.update();
        statsMemory.update();
    }
}

export default PerformanceLog;