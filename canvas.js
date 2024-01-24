//import Road from './road.js'
//import Renderer from './renderer.js'

// Start by deciding if we are on desktop or mobile:
let canvas = document.querySelector('canvas');
var canvasStyle = window.getComputedStyle(canvas);
const scale = (canvasStyle.scale === "none") ? 1 : canvasStyle.scale; //get
const mobile = (canvasStyle.scale === "1.5")
// Do some basic setup
canvas.width = screen.availWidth;
canvas.height = screen.availHeight;
let lazyWindowOffsetX = window.screenX;
let lazyWindowOffsetY = window.screenY;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
/*
const standerImage = new Image();
const standerBuilder = new Image();
const pine = new Image();
standerBuilder.src = 'StanderBuilder.png';
pine.src = 'Pine.png';
standerImage.src = 'Stander1.png';

const spriteWidth = 16;
const spriteHeight = 16;
const builderHeight = 32;
const pineWidth = 128;
const pineHeight = 128;
//const renderer = new Renderer(ctx)

let tick = 0;
let frame = 0;
let stagger = 7;
let start = Date.now();
*/
let seconds = 0;
let oldTimeStamp = 0;
let frameSpeed = 0;
let timeStamp = 0;

const x = window.getScreenDetails;
const backdrop = new Image();
backdrop.src = './MountainsBase.png';
const backdropW = 518;
const backdropH = 518;
let originX = ((canvas.width)/2) - lazyWindowOffsetX - (backdropW/2);
let originY = ((canvas.height)/2) - lazyWindowOffsetY - (backdropH/2);
const screenWhipScalar = 6; // Increase for slower whip

console.log(scale);

function run() {
    let done = false;
    draw();
    //animate()
}

function draw() {
    // Time logging
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Context updating
    lazyWindowOffsetX += (window.screenX/scale - lazyWindowOffsetX) / screenWhipScalar;
    lazyWindowOffsetY += (window.screenY/scale - lazyWindowOffsetY) / screenWhipScalar;
    originX = ((canvas.width/2) - lazyWindowOffsetX - (backdropW/2));
    originY = ((canvas.height/2) - lazyWindowOffsetY - (backdropH/2));


    // Drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#90956c";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    //background
    ctx.drawImage(backdrop,originX,originY);
    requestAnimationFrame(draw);
}

/*
function animate() {
    let scalar = 5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //background
    ctx.drawImage(pine,10*scalar,10*scalar,pineWidth*scalar,pineHeight*scalar);
    
    //foreground
    ctx.drawImage(standerImage,spriteWidth*(frame%17),0,spriteWidth,spriteHeight,(80*scalar),(122)*scalar,spriteWidth*scalar,spriteHeight*scalar);
    ctx.drawImage(standerBuilder,spriteWidth*(frame%26),0,spriteWidth,builderHeight,(43*scalar),(106)*scalar,spriteWidth*scalar,builderHeight*scalar);

    requestAnimationFrame(animate);
    tick++;
    if ((tick % stagger) == 0) { frame++ };
    if (frame==100) { console.log(Date.now() - start) }
}
*/


run();