import Segment from './send.js'
const DEFAULT_WIDTH=10;

class Bend {

    /**
     * PURPOSE: Constructor for a bend
     * PARAMS:
     *   points       - the array of points that make up the bend (assumed to be 2D points for now)
     *                  (example array: [[0,0],[1,1],[2,2]])
     *   offsetPoint  - constant offset point to be added to the value of each point on construction.
     *                  This uses a 3D point to support future cases.
     *   offsetRotation - 
     *   width (opt)  - the width of the bend (center to edge), default = 10
     */
    constructor(points, offsetPoint, width, darkColor, lightColor) {
        this.segments = [];
        let { x, y, z } = offsetPoint;
        this.width = width || DEFAULT_WIDTH;
        this.darkColor=darkColor;
        this.lightColor=lightColor;
        
        for (let pointNum=0; pointNum<this.points.length; pointNum++) {
            this.segements.push(new Segment(
                [points[pointNum][0] + x,points[pointNum][1] += y], 
                this.width,
                (pointNum % 2 === 0) ? this.darkColor : this.lightColor,
                ))
        }
    }
}

export default Bend;