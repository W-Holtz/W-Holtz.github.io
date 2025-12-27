import { pipelineSetup } from './threeDeeEngine.js'

// #region - Constants

const RESOLUTION=1000
const MAX_FRAMES=1000;
const FRAME_STAGGER=3;

// #endregion - Constants  

// #region - Globals
var canvas;
var gl;
var done;

// #endregion - Globals

// #region - Context/canvas setup
function innit3D() {
	canvas = document.getElementById('game-surface');
	gl = canvas.getContext('webgl2');
    console.log(gl.TEXTURE0)
    console.log(gl.TEXTURE1)
    console.log("hello")
	if (!gl) {
		alert('Your browser does not support WebGL2');
        throw new Error("Browser does not support WebGL");
	}
} 

function setColors(gl) {
    // Pick 2 random colors.
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
        ]),
        gl.STATIC_DRAW);
}

function setGeometry(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            400, 0,
            0, 0,
            200, 346.4,
            600, 0,
            100, 100,
            200, 346.4,
        ]),
        gl.STATIC_DRAW);
}



function canvasSetup() {
    // Get canvas obj
    innit3D();
    
    // Update the canvas context to support pixel drawing
    gl.webkitImageSmoothingEnabled = false;
    gl.mozImageSmoothingEnabled = false;
    gl.imageSmoothingEnabled = false;

    // Time and Frame Setup
    gl.frame = 0;
    gl.tick = 0;
    gl.done = false;

    // Image and Canvas Context Setup
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    // Mouse Position Setup
    gl.canvasMouseX = 0;
    gl.canvasMouseY = 0;
    document.addEventListener('mousemove', mouseMovementHandler);
}

function resizeCanvas() {
    let widthToHeightRatio=(window.innerWidth)/window.innerHeight

    /* In human terms: If the width to height ratio is less than 1 then, we know we need 
    //     to shrink the the physical width of the canvas down so it fits the viewport. 
    //     Since the ratio is smaller, it means width is less than height.
    //     We don't want to squish the image at all (it's a 1:1 image in clip space),
    */
    if (widthToHeightRatio<1) {
        document.querySelector('canvas').style.width = '100dvw';
        document.querySelector('canvas').style.height = '100%';
        canvas.width = RESOLUTION;
        canvas.height = RESOLUTION/widthToHeightRatio;
        gl.viewport(0,((RESOLUTION/widthToHeightRatio)-RESOLUTION)/2, RESOLUTION, RESOLUTION);
    } else {
        document.querySelector('canvas').style.height = '100dvh';
        document.querySelector('canvas').style.width = '100%';
        canvas.height = RESOLUTION;
        canvas.width = RESOLUTION*widthToHeightRatio;
        gl.viewport(((RESOLUTION*widthToHeightRatio)-RESOLUTION)/2, 0, RESOLUTION, RESOLUTION);
    }

    gl.centerX = ((canvas.width/2));
    gl.centerY = ((canvas.height/2));
}

function mouseMovementHandler(event) {
    [canvasMouseX,canvasMouseY] = webpageCoordToCanvasCoord(event.x,event.y)
}
document.addEventListener('mousemove', mouseMovementHandler);

function webpageCoordToCanvasCoord(x, y) {
    return [x*canvas.width/canvas.clientWidth,y*canvas.height/canvas.clientHeight];
}
// #endregion - Context/canvas setup

// #region - Object Instantiation
// #endregion - Object Instantiation

function run() {
    canvasSetup();
    const program = pipelineSetup(gl)
    gl.useProgram(program);
    
    // find out the index (aka pointer) assigned to the attribute/uniform
    const a_positionLocation = gl.getAttribLocation(program, "a_position");
    const a_colorLocation = gl.getAttribLocation(program, "a_color");
    const u_resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    
    function createTestVAO() {
        // create the vertex array before doing any other binding. We want any subsequent binding calls to apply to our VAO (vertex array object)
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // create a buffer where the attribute data will be pulled from
        const positionBuffer = gl.createBuffer();

        // set a binding target for the buffer - targets are effectively singleton globals 
        // which tell webGL how to use the object. Here's the best video I've found on this >> https://www.youtube.com/watch?v=sWBt5WrQTfE&themeRefresh=1
        // For a specific example, notice that when we call "bufferData()" below, we don't pass
        // in positionBuffer, but rather the ARRAY_BUFFER, which we've bound to positionBuffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // three 2d points
        const positions = [
        400, 0,
        0, 0,
        200, 346.4,
        600, 0,
        100, 100,
        200, 346.4,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.uniform2f(u_resolutionLocation, gl.canvas.width, gl.canvas.height);
        
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;          // 2 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(a_positionLocation, size, type, normalize, stride, offset);
    }

    createTestVAO();

    // #region - Main Loop
    function webLoop() {
        // Time logging
        updateFrame();

        // Drawing
        // 1.) clear
        gl.clearColor(0.7,0.85,0.75,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 2.) specify program (shader set)
        gl.useProgram(program);

        //render(program);
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);

        // Loop (or not)
        if (done) { return; }
        requestAnimationFrame(webLoop);
    }

    function updateFrame() {
        gl.tick++;
        if ((gl.tick % FRAME_STAGGER) == 0) { 
            gl.frame++ 
            if (gl.frame > MAX_FRAMES) { gl.frame = 0 }
        };
        return gl.tick,gl.frame;
    }
    // #endregion - Main Loop

    webLoop();
}

run();
