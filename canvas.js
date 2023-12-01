//import Road from './road.js'
//import Renderer from './renderer.js'

let canvas = document.querySelector('canvas');
canvas.width = screen.availWidth;
canvas.height = screen.availHeight;
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
const backdrop = new Image();
backdrop.src = './Website In-Progress.png';
const backdropW = 240;
const backdropH = 116;

function run() {
    let done = false;
    draw();
    //animate()
}


function draw() {
    let scalar = 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#90956c";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    //background
    ctx.drawImage(backdrop,100,100,backdropW*scalar,backdropH*scalar);
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