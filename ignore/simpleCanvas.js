// #region - Constants
const MAX_FRAMES = 1000
const POSTCARD_PATH = "./Postcards/October11.png";
const POSTCARD_PATH_PREFIX = "./Postcards/";
// POST STACK
const POSTCARD_OVERLAP_OFFSET = 15;
const POSTCARD_CARD_COUNT = 2;
// STAMPS                                       TODO: Add stamp enum
const STAMPS_PATH = "./stamps3.png";
const STAMPS_FRAMES = 2;
const STAMPS_SKINS = 3;
// #endregion - Constants


// #region - Context/canvas setup
// Get canvas obj
let canvas = document.querySelector('canvas');
let canvasStyle = window.getComputedStyle(canvas);
const ctx = canvas.getContext('2d');


/* 

--- RESIZING ---
This one has proven the most troublesome. I could easily resize the images that I draw, but then
the quality is compromised. The only resize function that doesn't blur the images, is the CSS
scale function. However, I run into issues when resizing dynamically via script. For some reason
if the scale is applied this way, then the canvas simply refuses to have its heigh and width adjusted.
Once we are in JS land, it seems like the scale affects the height and width directly, whereas if we
scal ahead of time in the css file, the height and width set by JS are equal to height and width of
the viewport.


*/
function resizeCanvas() {
    canvas.width = 1036;
    canvas.height = 1036;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

// Update the canvas context to support pixel drawing
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

// Handle mobile vs desktop
let scale = Number(canvasStyle.scale);
const mobile = (canvasStyle.scale === "1") // assume mobile if the canvas start with this css scale
// Update canvas dimensions
resizeCanvas();

// Time and Frame Setup
let frame = 0;
let tick = 0;
const stagger = 3;
let done = false;

// Image and Canvas Context Setup
canvas.width = 1554;
canvas.height = 1554;
const imgScale = mobile ? 0.5 : 1; // scaling for mobile
let maxDrawHeight = (canvas.height * ((1+scale)/(2*scale)));
let maxDrawWidth = (canvas.width * ((1+scale)/(2*scale)));
let minDrawHeight = canvas.height - maxDrawHeight;
let minDrawWidth = canvas.width - maxDrawWidth;
let centerX = ((canvas.width/2));
let centerY = ((canvas.height/2));

// Mouse Position Setup
let canvasMouseX = 0;
let canvasMouseY = 0;
function mouseMovementHandler(event) {
    [canvasMouseX,canvasMouseY] = webpageCoordToCanvasCoord(event.x,event.y)
}
document.addEventListener('mousemove', mouseMovementHandler);

// #endregion - Context/canvas setup


// #region - Sprite Classes/Function Declaration
class Sprite {

    constructor(spriteSheet, path, frames=1, skins=1, curr_skin=0, opacity=1) {
        this.frameCount = frames;
        this.curr_frame = 0;
        this.skinCount = skins;
        this.curr_skin = curr_skin;
        this.x = 0;
        this.y = 0;
        this.opacity = opacity;
        if (spriteSheet != null) {
            this.spriteSheet = spriteSheet;
        } else {
            this.spriteSheet = new Image();
            this.spriteSheet.src = path;
        }
        if (this.spriteSheet.width > 0) {
            // If we are pre-loading the img, then recalc immediately
            this.recalculateSize();
        } else {
            // Otherwise, calc on load
            this.spriteSheet.onload = () => this.recalculateSize();
        }
    }

    recalculateSize() {    
        this.skinCount
        this.height = this.spriteSheet.height / this.skinCount;
        this.width = this.spriteSheet.width / this.frameCount;
        
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

    draw(ctx, scale = 1) {
        // Draw
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(
            this.spriteSheet,
            this.width*(this.curr_frame),
            this.height*(this.curr_skin),
            this.width,
            this.height,
            Math.floor(this.x),
            Math.floor(this.y),
            this.width*scale,
            this.height*scale
        );
        ctx.globalAlpha = 1;
    }

    update() {
        // do nothing by default
    }
}

class ScaledImage extends Sprite {

    constructor(path,scale,opacity=1) {
        super(null,path,1,1,0,opacity);
        this.scale = scale;
    }

    draw(ctx, frame = 0, skin = 0) {
        super.draw(ctx, this.scale);
    }
}


function webpageCoordToCanvasCoord(x, y) {
   return [minDrawWidth+x/scale,minDrawHeight+y/scale];
}

// #endregion - Sprite Classes/Function Declaration


// #region - Image Helper Functions

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

// Image Declarations
function createImageFromPath(path) {
    const image = new Image();
    image.src = path;
    return image;
}

// #endregion - Image Helper Functions


// #region - Object Instantiation
// POST CARDS
const postcard = new Sprite(null,POSTCARD_PATH);
postcard.update= function() {
    this.setCenter(centerX,centerY); 
}
// #endregion - Object Instantiation


// #region - Main Loop
function webLoop() {


    resizeCanvas();
    // Time logging
    tick++;
    if ((tick % stagger) == 0) { 
        frame++ 
        if (frame > MAX_FRAMES) { frame = 0 }
    };
    
    // Context updating
    centerX = ((canvas.width/2));
    centerY = ((canvas.height/2));
    maxDrawHeight = (canvas.height * ((1+scale)/(2*scale)));
    maxDrawWidth = (canvas.width * ((1+scale)/(2*scale)));
    minDrawHeight = canvas.height - maxDrawHeight;
    minDrawWidth = canvas.width - maxDrawWidth;

    // Drawing
    // 1.) clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#990000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2.) update all sprites from all layers
    postcard.update(ctx)
    postcard.draw(ctx)

   
    //ctx.fillStyle = "#000000";
    //ctx.fillText(centerX +" "+ centerY,200,200)

    if (done) { return; }
    // Loop
    requestAnimationFrame(webLoop);
}
// #endregion - Main Loop

function run() {
    webLoop();
}

run();
