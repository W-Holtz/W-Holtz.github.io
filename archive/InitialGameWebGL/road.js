import Bend from './bend.js'



class Road {

    contructor() {
        this.segs = [];
        this.width = 10;
        this.color1 = '#8f8f8f8';
        this.color2 = '#9c9c9c9';
        let currColor = '';
        let pos = {
            x:0,
            y:0,
            z:0,
        }
        for (let segNum=0; segNum<numberOfSegs; segNum++) {
            currColor = (segNum % 2 === 0) ? this.color1 : this.color2;
            this.segs.push(new Bend(p1,currColor,width));
        }
    }
}

export default Road