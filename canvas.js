// #region - Constants
const MAX_FRAMES = 1000
// MOUNTAINS
const MOUNTAINS_PATH = './mountains3.png';
// PINES
const PINES_PATH = './pines3.png';
// SCROLL INDICATOR
const SCROLL_PATH = "./scrollDown3.png";
const SCROLL_FRAMES = 23;
// POST CARD
const POSTCARD_PATH = "./postcard3.png";
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

// Update the canvas context to support pixel drawing
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

// Handle mobile vs desktop
let scale = canvasStyle.scale;
const mobile = (canvasStyle.scale === "1") // assume mobile if the canvas start with this css scale

// Update canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Time and Frame Setup
let frame = 0;
let tick = 0;
const stagger = 3;

// Image and Canvas Context Setup
const imgScale = mobile ? 0.5 : 1; // scaling for mobile
let maxDrawHeight = (canvas.height * ((1+scale)/(2*scale)));
let centerX = ((canvas.width/2));
let centerY = ((canvas.height/2));

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

// #endregion - Context/canvas setup


// #region - Sprite Classes/Function Declaration
class Sprite {

    constructor(spriteSheet, path, frames=1, skins=1, curr_skin=0) {
        this.frameCount = frames;
        this.curr_frame = 0;
        this.skinCount = skins;
        this.curr_skin = curr_skin;
        this.x = 0;
        this.y = 0;
        if (spriteSheet != null) {
            this.spriteSheet = spriteSheet;
        } else {
            this.spriteSheet = new Image();
            this.spriteSheet.src = path;
        }
        if  (this.spriteSheet.width = null) {
            this.spriteSheet.onload = () => this.recalculateSize();
        } else {
            this.recalculateSize();
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
    }

    update() {
        // do nothing by default
    }
}

class ScaledImage extends Sprite {

    constructor(path,scale) {
        super(null,path);
        this.scale = scale;
    }

    draw(ctx, frame = 0, skin = 0) {
        super.draw(ctx, this.scale);
    }
}

class Postcard extends Sprite {
    
    constructor(path) {
        super(null,path);
        // Stamps
        this.stampsImg = createImageFromPath(STAMPS_PATH);
        this.stampsImg.onload = () => { this.addStamps(); };
        this.stamps = [];
    }

    addStamps() {
        this.spotify = new Sprite(this.stampsImg,null,2,3,0);
        this.git = new Sprite(this.stampsImg,null,2,3,1);
        this.linkedin = new Sprite(this.stampsImg,null,2,3,2);
        this.stamps = [this.spotify,this.linkedin,this.git];
        console.log("stamps added")
    }

    draw(ctx) { 
        super.draw(ctx);
        for (const stamp of this.stamps) {
            stamp.draw(ctx);
        }
    }
    
    update() { 
        this.setCenter(centerX - ((scrollPos-800)*(scrollPos-800)/625),centerY); 
        for (const stamp of this.stamps) {
            stamp.setCenter(this.x, this.y + (stamp.curr_skin* 20))
        }
    }

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
// MOUNTAINS
const mountains = new ScaledImage(MOUNTAINS_PATH,imgScale);
mountains.update = function () { 
    this.setCenter(centerX,centerY - scrollPos)
}

// PINES
const pines = new ScaledImage(PINES_PATH,imgScale);
pines.update = function () { 
    this.setCenter(centerX,centerY + (scrollPos*scrollPos/500))
}

// SCROLL INDICATOR
const scrollIndicator = new Sprite(null,SCROLL_PATH,SCROLL_FRAMES);
scrollIndicator.update = function () { this.curr_frame = frame };

// POST CARD
const postcard = new Postcard(POSTCARD_PATH);

// List of all sprites
const background = [mountains];
const midground = [scrollIndicator, postcard];
const foreground = [pines];
const layers = [background, midground, foreground];
// #endregion - Object Instantiation


// #region - Main Loop
function webLoop() {
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

    // Scroll
    scrollIndicator.setCenter(centerX,maxDrawHeight - 40)
    if ((scrollPos >= 4) && (scrollPos < 300)) {
        scrollPos = scrollPos - 3;
    } else if (((scrollPos >= 300) && (scrollPos < 790)) || (scrollPos < 0)) {
        scrollPos = scrollPos + 3;
    } 

    // Drawing
    // 1.) clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6e3e15";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2.) update all sprites from all layers
    for (const layer of layers) {
        for (const sprite of layer) {
            sprite.update();
        }
    }
    
    // 3.) draw all sprites from all layers
    for (const layer of layers) {
        for (const sprite of layer) {
            sprite.draw(ctx);
        }
    }
    
    // Scroll
    if ((frame > 100) && (scrollPos == 0)) {
        ctx.globalAlpha = Math.tanh((frame-100)/100)
        scrollIndicator.draw(ctx);
    }
    // Loop
    requestAnimationFrame(webLoop);
}
// #endregion - Main Loop

function run() {
    let done = false;
    webLoop();
}

run();

/*  --- SPRITE ---
properties:
    spritesheet
    x
    y
    width
    height
    frame
    skin

functions:
    new(image,frames,skins,x,y,path)
    draw(ctx)
    update(globalStateStuff)

questions:
    For a sprite that has duplicate spritesheets, how will I handle the storage of that sheet?
     - Ideally, that object is loaded and stored once and the pointer is passed around. Those sheets are essentially static.
    For a group of sprites that are really one object (stamps), should they be handled differently?
     - I think it's not a terrible idea to instantiate and store them seperatley but ultimately, they should be places into the drawing list in the same way.
    How should I handle draw order?
     - For now (small scale) it'll be easy enough with a single layer. I can populate the sprite in order to the array.
     - If I want to accomodate the handling of multiple layers to simplify things in the long run, I should support multiple layers.
    What should be needed for the draw method?
     - The inputs should be minimal. Ctx alone should be pretty much enough. I think sprites should handle their business
    How am I doing to handle input management? (i.e. scrolls, taps, clicks)
     - Brainstorming Options:
     1.) I could assign handlers to each object that wants to listen
     2.) I could handle inputs using a large case statment
     3.) I could do a mix of both, 
         3a.) handlers for inputs that aren't used by most objects
         3b.) case statment used to update global values held as a system state
    For a Postcard, how versatile should the stamp assigment be?
     - For now, I'll hard code it. If I want to have a bunch of card moving forward, it'd be pretty slick to have an enum
     that I can use to apply stamps in the costructor of the postcard.

*/