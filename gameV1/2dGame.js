// #region - Constants

const FRAME_STAGGER = 3;
const MAX_FRAMES = 1000;
const MIN_VIEW_WIDTH = 200
const MIN_VIEW_HEIGHT = 150
const MIN_VIEW_W_H_RATIO = MIN_VIEW_WIDTH/MIN_VIEW_HEIGHT

// #endregion - Constants


// #region - Globals

let canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let done=false;
let fadeIn=true;

// #endregion - Globals

// #region - Context/canvas setup
function canvasSetup() {
    // Get canvas obj

    
    // Update the canvas context to support pixel drawing
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    // Time and Frame Setup
    ctx.frame = 0;
    ctx.tick = 0;
    ctx.done = false;

    // Image and Canvas Context Setup
    resizeCanvas(ctx)
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    // Mouse Position Setup
    ctx.canvasMouseX = 0;
    ctx.canvasMouseY = 0;
    document.addEventListener('mousemove', mouseMovementHandler);
}

function updateFrame(ctx) {
    ctx.tick++;
    if ((ctx.tick % FRAME_STAGGER) == 0) { 
        ctx.frame++ 
        if (ctx.frame > MAX_FRAMES) { ctx.frame = 0 }
    };
    return ctx.tick,ctx.frame;
}

function resizeCanvas() {
    widthToHeightRatio=(window.innerWidth)/window.innerHeight

    /* In human terms: If the width to height ratio is less than the width to heigh ratio
    //     of the minimum height and width we'd like to see displayed on the canvas (in px)
    //     then, we know we need to scale the width of the canvas up/down so it will fit on
    //     screen. Since the ratio is smaller, it means if we scale to minumum width, then
    //     the height of the canvas (when expanded to fill the screen) will contain more
    //     than enough pixels to display the minumum height amount. If the ratio of the 
    //     constants is greater than the window ratios, then the inverse is true.
    */
    if (widthToHeightRatio<MIN_VIEW_W_H_RATIO) {
        document.querySelector('canvas').style.width = '100dvw';
        document.querySelector('canvas').style.height = '100%';
        canvas.width = MIN_VIEW_WIDTH;
        canvas.height = MIN_VIEW_WIDTH/widthToHeightRatio;
    } else {
        document.querySelector('canvas').style.height = '100dvh';
        document.querySelector('canvas').style.width = '100%';
        canvas.height = MIN_VIEW_HEIGHT;
        canvas.width = MIN_VIEW_HEIGHT*widthToHeightRatio;
    }

    ctx.centerX = ((canvas.width/2));
    ctx.centerY = ((canvas.height/2));
}

function mouseMovementHandler(event) {
    [canvasMouseX,canvasMouseY] = webpageCoordToCanvasCoord(event.x,event.y)
}
document.addEventListener('mousemove', mouseMovementHandler);

function webpageCoordToCanvasCoord(x, y) {
    return [x*canvas.width/canvas.clientWidth,y*canvas.height/canvas.clientHeight];
}
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

    incrementFrame() {
        this.curr_frame += 1
        if (this.curr_frame === this.frameCount) {
            this.curr_frame = 0
        }
    }

    update() {
        // do nothing by default
    }
}

// #endregion - Sprite Classes/Function Declaration

// #region - Object Instantiation

const tree = new Sprite(null,'./assets/pine.png');
tree.update = function (ctx) {
    this.setCenter(ctx.centerX - 20, ctx.centerY);
}
const text = new Sprite(null,'./assets/ConstructionAllText.png');
text.update = function (ctx) {
    this.setCenter(ctx.centerX + 20, ctx.centerY + 42);

}

// List of all sprites
const sprites = [tree,text]
const layers = [sprites];

// #endregion - Object Instantiation


// #region - Main Loop
function webLoop() {
    // Time logging
    updateFrame(ctx);

    // Drawing
    // 1.) clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e1f2dd";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2.) update all sprites from all layers
    for (const layer of layers) {
        for (const sprite of layer) {
            sprite.update(ctx);
        }
    }
    
    // 3.) draw all sprites from all layers
    for (const layer of layers) {
        for (const sprite of layer) {
            sprite.draw(ctx);
        }
    }

    // 4.) hard coded fade-in
    if (fadeIn) {
        if (ctx.frame > 10) {
            ctx.globalAlpha = (40-ctx.frame)/30;
        }
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (ctx.frame >= 40) {
            fadeIn = false;
        }
    }


    ctx.fillStyle = "#990099";
        ctx.strokeRect(0, 0, MIN_VIEW_WIDTH, MIN_VIEW_WIDTH);

    if (done) { return; }
    // Loop
    requestAnimationFrame(webLoop);
}
// #endregion - Main Loop

function run() {
    canvasSetup();
    webLoop();
}

run();