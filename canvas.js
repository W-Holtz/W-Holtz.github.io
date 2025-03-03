// #region - Constants
const MAX_FRAMES = 1000
// MOBILE MESSAGE
const MOBILE_MESSAGE = './mobileWarning.png';
const WINDOW = './window.png';
// MOUNTAINS
const MOUNTAINS_PATH = './mountains3.png';
// PINES
const PINES_PATH = './LongPines.png'; // add 500 to base for long pines
// SCROLL INDICATOR
const SCROLL_PATH = "./scrollDown3.png";
const SCROLL_FRAMES = 23;
// LABELS
const ABOUT_PATH = './AboutMenuLabel.png';
const PLAY_PATH = './PlayMenuLabel.png'
const LABELS_PATH = './MenuLabels.png'
// POST CARD
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
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

// Update the canvas context to support pixel drawing
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

// Handle mobile vs desktop
let scale = Number(canvasStyle.scale);
const mobile = false//(canvasStyle.scale === "1") // assume mobile if the canvas start with this css scale
// Update canvas dimensions
resizeCanvas();

// Time and Frame Setup
let frame = 0;
let tick = 0;
const stagger = 3;
let done = false;

// Image and Canvas Context Setup
const imgScale = mobile ? 0.5 : 1; // scaling for mobile
let maxDrawHeight = (canvas.height * ((1+scale)/(2*scale)));
let maxDrawWidth = (canvas.width * ((1+scale)/(2*scale)));
let minDrawHeight = canvas.height - maxDrawHeight;
let minDrawWidth = canvas.width - maxDrawWidth;
let centerX = ((canvas.width/2));
let centerY = ((canvas.height/2));
let sidebarWidth;

// Scrolling Setup
let targetScrollPosition = 0;
let currScrollPosition = targetScrollPosition;
let backgroundHoverOffset = 0;
let scrollMomentum = 0; 
let isTransitioning=false;
let transitioningTo=null;
addEventListener("wheel", (event) => {
    if (isTransitioning) { return; } // ignore scrolling if we are doing a click/tab based transistion
    targetScrollPosition += 0.001 * event.deltaY;
    if (targetScrollPosition >= 1.1) {
        targetScrollPosition = 1.1;
    } else if (targetScrollPosition <= -1.1) {
        targetScrollPosition = -1.1;
    }
});

function updateScroll() { // For an efficiency gain, convert this to a polynomial
    if (isTransitioning) {
        switch(transitioningTo) {
            case 0:
                currScrollPosition -= 0.02 * Math.sin((currScrollPosition - 0.30) * 2 * Math.PI ) + 0.02;
                if (currScrollPosition < .2) {
                    targetScrollPosition = .1;
                    isTransitioning = false;
                    transitioningTo=null;
                }
                break;
            case 1:
                currScrollPosition += 0.02 * Math.sin((currScrollPosition - 0.20) * 2 * Math.PI ) + 0.02;
                if (currScrollPosition > .80) {
                    targetScrollPosition = .9;
                    isTransitioning = false;
                    transitioningTo=null;
                }
                break;
        }
    } else {
        targetScrollPosition += -0.01 * Math.sin((targetScrollPosition) * 2 * Math.PI ); // <- Derivative of the cos() that give us a good change in position
        currScrollPosition += 0.1 * (targetScrollPosition - currScrollPosition);
        //if (currScrollPosition <= -.95) {
        //    window.location.href = "game.html";
        //}
    }
}

// Mouse Position Setup
let canvasMouseX = 0;
let canvasMouseY = 0;
function mouseMovementHandler(event) {
    [canvasMouseX,canvasMouseY] = webpageCoordToCanvasCoord(event.x,event.y)
}

document.addEventListener('mousemove', mouseMovementHandler);

// I'm updating scrolling with the following goals in mind:
//  1. Smooth
//  2. Appropriate inertia
//  3. Easier to program around
//
// - I could use an int from 1 -> 1000 or some arbirtrary number, 
// - or I could use a float  0 -> 1
// Float wins for smooth-ness
// 
// To make it smooth, I'll need a buffer, I can't just have input=change
// - I could make positive scroll+=acceleration and use a physics model
// - I could make the buffer a target, and handle the movement towards that target gradually
//



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

class PineBorder extends ScaledImage {
    
    draw(ctx) {
        super.draw(ctx, this.scale);
        let borderWidth = Math.floor((canvas.width-(this.width*scale))/2) + 1;
        ctx.fillStyle = "#000000";
        // Handle Borders
        ctx.fillRect(0, 0, this.x, canvas.height);
        ctx.fillRect(this.x+this.width-1, 0, this.x+this.width+borderWidth, canvas.height);
        ctx.fillRect(0, this.y+this.height-1, canvas.width, canvas.height);
        // Handle fade to black
        if (currScrollPosition <= -.6) {
            ctx.globalAlpha = - (2.5 * (currScrollPosition + .6));
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.globalAlpha = 1;
    }

}

class Stamp extends Sprite {

    constructor(spriteSheet, path, frames=1, skins=1, curr_skin=0, angle, postcardXOffset=682, postcardYOffset=110,isEnabled=false) {
        super(spriteSheet, path, frames, skins, curr_skin);
        this.angle = angle;
        this.isEnabled=isEnabled;
        this.eventListeners=[];
        this.postcardXOffset=postcardXOffset;
        this.postcardYOffset=postcardYOffset;
        this.initializeEventListeners()
    }

    // Initializes the event listeners for the stamp:
    //   - listen for mouse move
    //   - listen for mouse down
    initializeEventListeners() {
        let handleMouseUp = (event) => {
            if (this.curr_frame===1) {
                switch(this.curr_skin) {
                    case 0:
                        window.location.href = "https://open.spotify.com/user/williamholtz?fo=1&a="; 
                        done=true;
                        break;
                    case 1:
                        window.location.href = "https://www.linkedin.com/in/william-holtz-ab8981123"; 
                        done=true;
                        break;
                    case 2:
                        window.location.href = "https://github.com/W-Holtz"; 
                        done=true;
                        break;
                    default:
                }
            }
        };

        this.eventListeners.unshift(["mousedown",(event) => {
            if (this.curr_frame===1 && this.isEnabled) { addEventListener("mouseup", handleMouseUp, {once : true}) } 
        }]);

        addEventListener(this.eventListeners[0][0], this.eventListeners[0][1]);
    }

    unload() {
        this.spriteSheet=null;
        for (const listener of this.eventListeners) {
            removeEventListener(listener[0], listener[1])
        }
    }

    update() {
        // We want to confirm that the converted X and Y click difference is not outside the width (x and y here are center)
        if (this.isEnabled && (-this.width/2 < (-this.x + canvasMouseX) && (-this.x + canvasMouseX) < this.width/2 && 
            -this.height/2 < (-this.y + canvasMouseY) && (-this.y + canvasMouseY) < this.height/2 )) 
        {
            this.curr_frame=1;
        } else {
           this.curr_frame=0;
        }
    }

    // Steps for a successful angled drawing:
    // 1. Center the page around the middle of the stamp (translate moves the canvas
    //    in the negative, so to move the stamp local to center, I want a positive X
    //    and a negtive y)
    //    That difference between what I want and have is equal to the distance to the 
    //    center
    // 2. Rotate the page
    // 3. Draw
    // 4. Undo in order
    draw(ctx) {
        ctx.translate(Math.floor(this.x),Math.floor(this.y));
        ctx.rotate(this.angle);
        ctx.drawImage(
            this.spriteSheet,
            this.width*(this.curr_frame),
            this.height*(this.curr_skin),
            this.width,
            this.height,
            Math.floor(-this.width/2),
            Math.floor(-this.height/2),
            this.width,
            this.height
        );
        ctx.rotate(-this.angle);
        ctx.translate(-Math.floor(this.x),-Math.floor(this.y));
    }
}

class Postcard extends Sprite {
    
    constructor(path) {
        super(null,path);
        this.isEnabled=false;
        // Stamps
        this.stamps=[];
        this.stampsImg = createImageFromPath(STAMPS_PATH);
        this.stampsImg.onload = () => { 
            this.addStamps();
        };
        this.path=path;
        this.status = 0; // TODO : Add an enum - 0 is stable, 1 is flying out, 2 in flying in, -1 is fading into the ether
        console.log(this.width)
    }

    unload() {
        for (const stamp of this.stamps) {
            stamp.unload();
            this.stamps=[];
        }
        this.stampsImg=null;
    }

    addStamps() {
        this.spotify = new Stamp(this.stampsImg,null,2,3,0,Math.random()-0.75,580,100,this.isEnabled);
        this.git = new Stamp(this.stampsImg,null,2,3,1,Math.random()-0.75,688,108,this.isEnabled);
        this.linkedin = new Stamp(this.stampsImg,null,2,3,2,Math.random()-0.75,600,200,this.isEnabled);
        this.stamps = [this.spotify,this.linkedin,this.git];
    }

    enable() {
        this.isEnabled=true;
        for (const stamp of this.stamps) {
            stamp.isEnabled=true;
        } 
    }

    disable() {
        this.isEnabled=false;
        for (const stamp of this.stamps) {
            stamp.isEnabled=false;
        } 
    }

    draw(ctx) { 
        super.draw(ctx);
        for (const stamp of this.stamps) {
            stamp.draw(ctx);
        }
    }

    update() {
        this.updateStamps()
    }

    updateStamps() {
        for (const stamp of this.stamps) {
            stamp.setCenter(this.x + stamp.postcardXOffset, this.y + stamp.postcardYOffset)
            stamp.update();
        }
    }
}

class CardStack extends Sprite{

    constructor(folderPath) { // TODO : Add loading and unloading code to manage the number of sprites being drawn
        super(null, folderPath+"October11.png")

        this.postcards = [];
        this.imageList = [];
        this.depthOffsets = [];
        this.topCardHoverOffset = 0;

        this.imageList = [folderPath+"AboutMe.png",folderPath+"October11.png", folderPath+"AboutMe.png",folderPath+"October11.png"];
        for (var index=0; index<POSTCARD_CARD_COUNT; index++) {
            this.loadNextPostcard(true)
        }
        this.postcards[0].enable()
        

        this.initializeEventListeners();
    }

    loadNextPostcard(reverse=false) {
        if (reverse) {
            let path = this.imageList.pop();
            this.postcards.unshift(new Postcard(path));
            this.depthOffsets.unshift(-POSTCARD_OVERLAP_OFFSET);
            this.imageList.unshift(path);
        } else {
            let path = this.imageList[POSTCARD_CARD_COUNT];
            this.postcards.push(new Postcard(path));
            this.depthOffsets.push(2 * POSTCARD_OVERLAP_OFFSET);
            this.imageList.push(this.imageList.shift());
        }
    }

    unloadPostcard(reverse=false) {
        if (reverse) {
            this.depthOffsets.pop();
            this.postcards.pop().unload();
        } else {
            this.depthOffsets.shift();
            this.postcards.shift().unload();
        }
    }

    // Initializes the event listeners for the stamp:
    //   - listen for mouse move
    //   - listen for mouse down
    initializeEventListeners() {
        let handleMouseUpForNext = (event) => {
            if (this.isMousingToNextCard()) {
                this.moveFrontToBack()
            }
        };

        let handleMouseUpForPrev = (event) => {
            if (this.isMousingToPrevCard()) {
                this.moveBackToFront()
            }
        };

        addEventListener("mousedown", (event) => {
            if (this.isMousingToNextCard()) {
                addEventListener("mouseup", handleMouseUpForNext, {once : true})
            } else if (this.isMousingToPrevCard()) {
                addEventListener("mouseup", handleMouseUpForPrev, {once : true})
            }
        });
    }

    // Move the front card to the back of the stack
    moveFrontToBack() {
        const topCardIndex = this.postcards.findIndex((postcard) => {return postcard.status !== 1})
        const topCard=this.postcards[topCardIndex]
        // trigger unload
        topCard.status = 1;
        this.topCardHoverOffset = 0;
        // load
        topCard.disable();
        this.postcards[topCardIndex+1].enable();
        this.loadNextPostcard();
    }

    // Move the back card to the front of the stack
    moveBackToFront() {
        const bottomCard = this.postcards.findLast((postcard) => {return postcard.status !== -1});
        // trigger unload
        bottomCard.status = -1;
        // load
        this.loadNextPostcard(true);
        this.postcards[0].enable();
        this.postcards[1].disable();
        // trigger load transistion
        this.postcards[0].x = - this.width;
        this.postcards[0].status = 2;
        this.topCardHoverOffset = 0;
        // unload
        this.postcards[this.postcards.length - 1].status = -1;
    }

    /*

    Card Stack Behavior:
    
    -- Card Consolidation --
    The card stack is tightly stacked when in transit. Once it becomes stationary, it "relaxes" its stack
    so that cards in front are staggered slightly up and to the right. When the user begins to scroll,
    things quickly tighten back up.

    -- Card Hovering --
    When the user hovers over near far right side of the postcard, the postcard at the back of the stack
    shifts slightly to the right, exposing it more than before. When the user hovers over near the left
    side of the top card, then the top card will shift slightly left. The motion is fast, slow, then rest.

    -- Solution to the above --
    1. An array of cards
    2. An array of card offsets (for depth) - we don't need a "goal" array here because that goal is just
    '(index-1) * DEPTH_OFFSET'.
    3. LOGIC:
        a. if the cardstack is in motion (target pos != pos), card offset "goals" are just 0 across the board
        b. if the cardstack is stationary, card offset "goals" are standard (see bullet '2.')
        c. top card offset is handled seperately altogether

    
    -- Card Clicking -- 
    If the user clicks on the right side of the postcard and NOT on a stamp, the postcard at the top of
    the stack will move to the back, and the card beneath will take its place

    -- Card Loading and Unloading --
    Ultimately, we want 3-4 cards actually visible:
    1. Top card is unobscured
    2. Second card is mostly visible, but a transparent film should be added to show it in the shade
    3. Third card should be loaded, but mostly or completely in shade
    4. Fourth card is totally obscured and doesn't need to be loaded

    Outline of code behavior:
    1. Calculate and set the position of the cardstack as a whole
    2. Update depth offsets
    3. Update outlier offsets
        a. Click handling for the top card
            i. Load + Unload
            ii. Movement of the top card
        b. Hover handling for the top card (ONLY if click handling was not being done)

    */
    update() {
        this.updateCardStackPosition()
        // Standard behaviors
        this.updatePostcardLocations()
        // Outlier behaviors
        this.handleMousePosition()
    }

    isMousingToPrevCard() {
        return (0 < (-this.x + canvasMouseX) && (-this.x + canvasMouseX) < this.width/2 && 
            0 < (-this.y + canvasMouseY) && (-this.y + canvasMouseY) < this.height );
    }

    isMousingToNextCard() {
        return (this.width > (-this.x + canvasMouseX) && (-this.x + canvasMouseX) > this.width/2 && 
            0 < (-this.y + canvasMouseY) && (-this.y + canvasMouseY) < this.height );
    }

    handleMousePosition() {
        // 1.) Update hover based offset
        if (this.isMousingToNextCard() && this.postcards[0].status !== 2)
        {
            if (this.topCardHoverOffset > .999) {
                this.topCardHoverOffset = .999;
            } else  {
                this.topCardHoverOffset -= 0.25 * (this.topCardHoverOffset*this.topCardHoverOffset - this.topCardHoverOffset);
            }
        } else {
            if (this.topCardHoverOffset < 0.001) {
                this.topCardHoverOffset = 0.001;
            } else  {
                this.topCardHoverOffset += 0.25 * (this.topCardHoverOffset*this.topCardHoverOffset - this.topCardHoverOffset);
            }
        }
        // 2.) Update top card position
        this.postcards[0].x -= this.topCardHoverOffset*60;
        this.postcards[0].updateStamps();
    }

    updatePostcardLocations() {
        // Handle offset array
        if (currScrollPosition > .5 && targetScrollPosition-currScrollPosition > -.001 && targetScrollPosition-currScrollPosition < .001) {
            for (var index=0; index<this.depthOffsets.length; index++) {
                if (this.postcards[index].status != -1) {
                    this.depthOffsets[index] += (((index - 1) * POSTCARD_OVERLAP_OFFSET) - this.depthOffsets[index]) / 30
                }
            }
        } else {
            for (var index=0; index<this.depthOffsets.length; index++) {
                if (this.postcards[index].status != -1) {
                    this.depthOffsets[index] -= this.depthOffsets[index] / 20
                }
                this.topCardHoverOffset=0;
            } 
        }

        // Update cards with new offset value
        for (const [index, card] of this.postcards.entries()) {
            if (card.status === 0) { // Stable/normal card state
                card.setOrigin(this.x + this.depthOffsets[index], this.y + this.depthOffsets[index]);
            } else if (card.status === 1) { // Top card unloading (flying off)
                card.setOrigin(card.x - 1 - Math.abs((card.x - this.x) / 2), this.y + this.depthOffsets[index]);
                if (card.x < -card.width) {
                    this.unloadPostcard()
                }
            } else if (card.status === 2) { // Back card loading (flying on)
                card.setOrigin(card.x + ((this.x + this.depthOffsets[index] - card.x) / 20), this.y + this.depthOffsets[index]);
                if (Math.floor(this.x + this.depthOffsets[index] - card.x) <= 1) {
                    card.status = 0;
                }
            } else if (card.status === -1) { // Back card unloading (fading out)
                if (this.depthOffsets[index] + POSTCARD_OVERLAP_OFFSET >= POSTCARD_CARD_COUNT * POSTCARD_OVERLAP_OFFSET) {
                    this.unloadPostcard(true);
                } else {
                    this.depthOffsets[index] += 2
                }
            }
            card.update()
        }

    }

    updateCardStackPosition() {  // for an efficiency gain, consider removing the trig func infavor of a polynomial
        let sendOffScreenMultiplier = - Math.tanh(10 * currScrollPosition - .2 ) + 1
        this.setCenter(centerX - (800 * (1 - currScrollPosition)) - (3000 * sendOffScreenMultiplier),centerY); 
    }

    draw(ctx) { 
        // Draw main card stack
        for (var i=this.postcards.length-1; i>=0; i--) {
            this.postcards[i].draw(ctx);
            ctx.globalAlpha = (this.depthOffsets[i] + POSTCARD_OVERLAP_OFFSET)/(POSTCARD_CARD_COUNT * POSTCARD_OVERLAP_OFFSET);
            
            ctx.fillRect(Math.floor(this.postcards[i].x),Math.floor(this.postcards[i].y),this.width,this.height)
            ctx.globalAlpha = 1;
        }
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
// MOUNTAINS
const mountains = new ScaledImage(MOUNTAINS_PATH,imgScale);
mountains.update = function () { 
    this.setCenter(centerX,centerY - ((currScrollPosition + backgroundHoverOffset) * 1000))
    if (currScrollPosition >= .8) { 
        this.opacity = 5 - (5 * currScrollPosition);
        if (currScrollPosition >= 1) {this.opacity = 0;}
    } else {
        this.opacity = 1;
    }
}

// PINES
const pines = new PineBorder(PINES_PATH,imgScale);
pines.update = function () { 
    this.setCenter(centerX,centerY + ((currScrollPosition + backgroundHoverOffset) * 800) + 500)
    if (currScrollPosition >= .8) { 
        this.opacity = 5 - (5 * currScrollPosition)
        if (currScrollPosition >= 1) {this.opacity =0;}
    } else {
        this.opacity = 1;
    }
}

// LABELS
const about = new Sprite(null,LABELS_PATH,2,2,0);
about.update = function () { 
    this.setCenter(centerX + 180,centerY - ((currScrollPosition + backgroundHoverOffset) * 1000) + 90)
    // We want to confirm that the converted X and Y click difference is not outside the width (x and y here are center)
    if (canvasMouseY > this.y - 120 && canvasMouseY < this.y + 100) 
    {
        this.curr_frame=1;
    } else {
        this.curr_frame=0;
    }
    if (currScrollPosition >= .8) { 
        this.opacity = 5 - (5 * currScrollPosition)
        if (currScrollPosition >= 1) {this.opacity =0;}
    } else {
        this.opacity = 1;
    }
}
/*
const play = new Sprite(null,LABELS_PATH,2,2,1);
play.update = function () { 
    this.setCenter(centerX + 190,centerY + ((currScrollPosition + backgroundHoverOffset) * 800) + 190)
    if (canvasMouseY > 518) 
    {
        this.curr_frame=1;
    } else {
        this.curr_frame=0;
    }
}
*/
// POST CARDS
const postcards = new CardStack(POSTCARD_PATH_PREFIX);
// Transition Setup
addEventListener("mousedown",(event) => {
    if (currScrollPosition < 0.01 && currScrollPosition > -0.01) { // Home case
        if (about.curr_frame===1) { addEventListener("mouseup", (event) => { 
            if (about.curr_frame===1 && !isTransitioning && targetScrollPosition < 0.01 && targetScrollPosition > -0.01) {
                transitioningTo=1;
                isTransitioning=true;
            }
        }, {once : true}) } 
    } else if (currScrollPosition > 0.99 && currScrollPosition < 1.01) { // Postcard case
        if ((postcards.x > canvasMouseX) || (postcards.y > canvasMouseY) || (postcards.y + postcards.height < canvasMouseY) || 
            (postcards.x + postcards.width < canvasMouseX)) { addEventListener("mouseup", (event) => { 
            if ((postcards.x < canvasMouseX) || (postcards.y > canvasMouseY) || (postcards.y + postcards.height > canvasMouseY) || 
                (postcards.x + postcards.width > canvasMouseX) && !isTransitioning && currScrollPosition > 0.99 && currScrollPosition < 1.01) {
                transitioningTo=0;
                isTransitioning=true;
            }
        }, {once : true}) } 
    }
});

// MOBILE ONLY
const mobileMessage = new ScaledImage(MOBILE_MESSAGE,1,0);
mobileMessage.update = function () { this.setCenter(centerX,centerY)};
const windowPane = new ScaledImage(WINDOW,1,1);
windowPane.update = function () { this.setCenter(centerX,centerY)};

// List of all sprites
const background = [mountains,about];
const midground = [postcards];
const foreground = [pines];
let foo = 1
const layers = [];
if (mobile) {
    layers.push([windowPane,mobileMessage]);
    mobileMessage.setCenter(centerX,centerY);
    windowPane.setCenter(centerX,centerY);

    // Transition Setup
    addEventListener("click",(event) => {
        windowPane.update = function () { 
            this.setCenter(centerX,centerY);
            if (this.opacity === 0) {
                if (mobileMessage.opactiy !== 1) {
                    mobileMessage.opacity += .1;
                    if (mobileMessage.opacity > 1) { 
                        mobileMessage.opacity = 1;
                    }
                }
            }
            this.opacity -= 0.1;
            if (this.opacity < 0) {
                this.opacity = 0;
            }
        }
    }, {once : true});

} else {
    layers.push(background, midground, foreground);
}
// #endregion - Object Instantiation


// #region - Main Loop
function webLoop() {

    // Time logging
    tick++;
    if ((tick % stagger) == 0) { 
        frame++ 
        if (frame > MAX_FRAMES) { frame = 0 }
    };

    if (frame === 40 && windowPane.opacity === 1) {
        windowPane.update = function () { 
            if (this.opacity === 0) {
                if (mobileMessage.opactiy !== 1) {
                    mobileMessage.opacity += .04
                }
            }
            this.opacity -= 0.01;
            if (this.opacity < 0) {
                this.opacity = 0;
            }
        }
    }
    
    // Context updating
    centerX = ((canvas.width/2));
    centerY = ((canvas.height/2));
    maxDrawHeight = (canvas.height * ((1+scale)/(2*scale)));
    maxDrawWidth = (canvas.width * ((1+scale)/(2*scale)));
    minDrawHeight = canvas.height - maxDrawHeight;
    minDrawWidth = canvas.width - maxDrawWidth;

    // Scroll
    updateScroll();

    // Drawing
    // 1.) clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mobile) {
        ctx.fillStyle = "#90956c";
    } else if (currScrollPosition < .2) {
        ctx.fillStyle = "#e1f2dd";
    } else {
        ctx.fillStyle = "#6e3e15";
    }
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

New UI planning:
 - Pressing buttons will prompt the user to click on either the mountains or the trees
 - Clicking the mountains > transition to postcard
 - Clicking the trees > transistion to game
 - Clicking on the postcard > switches between cards
 - Clicking outside of the postcard > switches back to home
 Dragging????

*/
