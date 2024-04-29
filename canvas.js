//import Road from './road.js'
//import Renderer from './renderer.js'
const MAX_FRAMES = 1000


// Start by deciding if we are on desktop or mobile:
let canvas = document.querySelector('canvas');
let canvasStyle = window.getComputedStyle(canvas);
let scale = canvasStyle.scale;
const mobile = (canvasStyle.scale === "1")
// Do some basic setup
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

class Sprite {

    constructor(path, x, y, frames=1, skins=1, spriteSheet) {
        if (spriteSheet != null) {
            this.spriteSheet = spriteSheet;
        } else {
            this.spriteSheet = createImageFromPath(path);
        }
        this.height = this.spriteSheet.height / skins;
        this.width = this.spriteSheet.width / frames;
        this.x = x;
        this.y = y;
        this.frameCount = frames;
        // Error to sanity check frame height declaration
        if (!Number.isInteger(this.width)) {
            throw new Error("The spriteSheet could not be divided evenly by the number of frames.");
        } else if (!Number.isInteger(this.height)) {
            throw new Error("The spriteSheet could not be divided evenly by the number of skins.");
        }
    }

    setCenter(x, y) {
        this.x = x-this.width/(2)
        this.y = y-this.height/(2)
    }

    setOrigin(x, y) {
        this.x = x;
        this.y = y;
    }

    drawSprite(ctx, frame = 0, skin = 0, scale = 1) {
        // Draw
        ctx.drawImage(
            this.spriteSheet,
            this.width*(frame%this.frameCount),
            this.height*(skin),
            this.width,
            this.height,
            Math.floor(this.x),
            Math.floor(this.y),
            this.width*scale,
            this.height*scale
        );
    }

}

let seconds = 0;
let oldTimeStamp = 0;
let frameSpeed = 0;
let timeStamp = 0;

const x = window.getScreenDetails;

// Image Declarations
function createImageFromPath(path) {
    const image = new Image();
    image.src = path;
    return image;
}
const mountains = createImageFromPath('./mountains3.png');
const pines = createImageFromPath('./pines3.png');
const stamps = createImageFromPath('./stamps3.png');
const postcard = createImageFromPath('./postcard3.png');
// SCROLL INDICATOR
const SCROLL_PATH = "./scrollDown3.png"
const SCROLL_FRAMES = 23;
const scrollIndicator = new Sprite(SCROLL_PATH,null,null,SCROLL_FRAMES)

console.log(scale);

function run() {
    let done = false;
    draw();
    //animate()
}

function drawImageCenter(ctx,centerX,centerY,image,scale) {
    if (scale == null) {
        scale = 1;
    }
    ctx.drawImage(
        image,
        Math.floor(centerX - image.width/(2/scale)),
        Math.floor(centerY - image.height/(2/scale)),
        image.width*scale,
        image.height*scale
    );
}

// Time and Frame Setup
let frame = 0;
let tick = 0;
const stagger = 3;

// Image and Canvas Context Setup
const imgScale = mobile ? 0.5 : 1; // scaling for mobile
let maxDrawHeight = (canvas.height * ((1+scale)/(2*scale)));

// Scrolling Setup
let scrollPos = 0;
let scrollMomentum = 0; 
addEventListener("wheel", (event) => {
    scrollPos += 0.2 * event.deltaY;
    if (scrollPos >= 800) {
        scrollPos = 800;
    } else if (scrollPos <= -400) {
        scrollPos = -400;
    }
});

function draw() {
    // Time logging
    tick++;
    if ((tick % stagger) == 0) { 
        frame++ 
        if (frame > MAX_FRAMES) { frame = 0 }
    };
    
    // Context updating
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scale = Number(canvasStyle.scale);
    
    centerX = ((canvas.width/2));
    centerY = ((canvas.height/2));
    maxDrawHeight = (canvas.height * ((1+scale)/(2*scale)));
    scrollIndicator.setCenter(centerX,maxDrawHeight - 40)
    
    // Scroll updating
    if ((scrollPos != 0)) {
            scrollPos = scrollPos / 1.1
    }


    // Drawing
    // 1.) clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6e3e15";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2.) background
    drawImageCenter(ctx,centerX,centerY - scrollPos,mountains,imgScale)
    drawImageCenter(ctx,centerX,centerY + scrollPos,pines,imgScale)

    // 3.) sprites
    //if ((frame > 100) && (scrollPos == 0)) {

    //    ctx.globalAlpha = Math.tanh((frame-100)/100)
    //    scrollIndicator.drawSprite(ctx, frame);
    //}

    // Loop
    requestAnimationFrame(draw);
}

run();