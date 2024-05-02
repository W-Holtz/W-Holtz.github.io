//import Road from './road.js'
//import Renderer from './renderer.js'

const MAX_FRAMES = 1000


// Start by deciding if we are on desktop or mobile:
let canvas = document.querySelector('canvas');
let canvasStyle = window.getComputedStyle(canvas);
let scale = canvasStyle.scale;
const mobile = (canvasStyle.scale === "1")
// Do some basic setup
const ctx = canvas.getContext('2d');
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let centerX = ((canvas.width/2));
let centerY = ((canvas.height/2));

class Drawable {

    constructor(path, x, y, frames=1, skins=1, spriteSheet) {
        this.frameCount = frames;
        this.skinCount = skins;
        this.x = x;
        this.y = y;
        if (spriteSheet != null) {
            this.spriteSheet = spriteSheet;
        } else {
            this.spriteSheet = new Image();
            this.spriteSheet.onload = () => this.recalculateSize();
            this.spriteSheet.src = path;
        }
    }

    recalculateSize() {    
        this.height = this.spriteSheet.height / this.skinCount;
        this.width = this.spriteSheet.width / this.frameCount;
        console.log(this.height);
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

// Image Declarations
function createImageFromPath(path) {
    const image = new Image();
    image.src = path;
    return image;
}

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

const mountains = createImageFromPath('./mountains3.png');
const pines = createImageFromPath('./pines3.png');
// SCROLL INDICATOR
const SCROLL_PATH = "./scrollDown3.png";
const SCROLL_FRAMES = 23;
const scrollIndicator = new Drawable(SCROLL_PATH,null,null,SCROLL_FRAMES);
// POST CARD
let cardX = centerX - ((scrollPos-800)*(scrollPos-800)/625) ;
let cardY = centerY;
const POSTCARD_PATH = "./postcard3.png";
const postcard = new Drawable(POSTCARD_PATH,null,null);
// STAMPS
const STAMPS_PATH = "./stamps3.png";
const STAMPS_FRAMES = 2;
const STAMPS_SKINS = 3;
const stamps = new Drawable(STAMPS_PATH,null,null,STAMPS_FRAMES,STAMPS_SKINS,);
// List of all sprites
const sprites = [stamps, scrollIndicator, postcard]
for (const sprite of sprites) {
    sprite.recalculateSize();
}

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
    // Sprite Updating
    // Scroll
    scrollIndicator.setCenter(centerX,maxDrawHeight - 40)
    if ((scrollPos >= 4) && (scrollPos < 300)) {
        scrollPos = scrollPos - 3;
    } else if (((scrollPos >= 300) && (scrollPos < 790)) || (scrollPos < 0)) {
        scrollPos = scrollPos + 3;
    } 

    cardX = centerX - ((scrollPos-800)*(scrollPos-800)/625) ;
    cardY = centerY;
    console.log(cardX + " " + cardY)
    // Postcard
    postcard.setCenter(cardX, cardY);


    // Drawing
    // 1.) clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6e3e15";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2.) background
    drawImageCenter(ctx,centerX,centerY - scrollPos,mountains,imgScale)

    // 3.) sprites
    postcard.drawSprite(ctx,0)
    // Stamps
    stamps.setCenter(cardX + 280, cardY - 140);
    stamps.drawSprite(ctx,0,1)
    // Stamps
    stamps.setCenter(cardX + 240, cardY - 200);
    stamps.drawSprite(ctx,0,0)
    // Stamps
    stamps.setCenter(cardX + 200, cardY - 100);
    stamps.drawSprite(ctx,0,2)
    drawImageCenter(ctx,centerX,centerY + (scrollPos*scrollPos/500),pines,imgScale)
    // Scroll
    if ((frame > 100) && (scrollPos == 0)) {

        ctx.globalAlpha = Math.tanh((frame-100)/100)
        scrollIndicator.drawSprite(ctx, frame);
    }

    // Loop
    requestAnimationFrame(draw);
}

run();