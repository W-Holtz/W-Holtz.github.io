import Stats from '../node_modules/three/examples/jsm/libs/stats.module';

class PerformanceLog {

    constructor() {
        //FPS stats
        this.statsFPS = new Stats();
        this.statsFPS.dom.style.cssText = "position:absolute;top:3px;left:3px;";
        this.statsFPS.showPanel(0); // 0: fps,

        //Memory stats
        this.statsMemory = new Stats();
        this.statsMemory.showPanel(2); //2: mb, 1: ms, 3+: custom
        this.statsMemory.dom.style.cssText = "position:absolute;top:3px;left:84px;";

        document.body.appendChild(this.statsFPS.dom);
        document.body.appendChild(this.statsMemory.dom);
    }

    update() {
        this.statsFPS.update();
        this.statsMemory.update();
    }

    setVisible(visible) {
        const display = visible ? 'block' : 'none';
        this.statsFPS.dom.style.display = display;
        this.statsMemory.dom.style.display = display;
    } 
}

export default PerformanceLog;