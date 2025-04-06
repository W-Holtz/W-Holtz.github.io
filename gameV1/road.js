import Segment from './segment.js'

class Road {

    contructor(numberOfSegs) {
        this.segs = [];
        this.width = 10;
        this.color1 = '#8f8f8f8';
        this.color2 = '#9c9c9c9';
        let currColor = '';
        let point = {
            x:0,
            y:0,
            z:0,
        }
        for (let segNum=0; segNum<numberOfSegs; segNum++) {
            currColor = (segNum % 2 === 0) ? this.color1 : this.color2;
            this.segs.push(new Segment(p1,currColor,width));
        }
    }
}

export default Road