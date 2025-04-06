const DEFAULT_DEPTH=5;
const DEFAULT_WIDTH=10;

class Segment {

    /**
     * PURPOSE: Constructor for a segment
     * PARAMS:
     *   p1           - the first point of the seg (smaller z val)
     *   color        - the color of the segment (formatted '#000000')
     *   width (opt)  - the width of the segment (center to edge), default = 10
     *   p2 (opt)     - the second seg point, by default, the second point is
     *                  created relative the first point but with 5 added to the z
     */
    constructor(p1, color, width, p2) {
        // Set both points for the segment
        let { x, y, z } = p1;
        this.x1 = x;
        this.y1 = y;
        this.z1 = z;
        if (typeof p2 === undefined) {
            p2 = p1; // we aren't worried about accidentally changing p1
            p2.z += DEFAULT_DEPTH;
        }
        ({ x, y, z } = p2);
        this.x2 = x;
        this.y2 = y;
        this.z2 = z;
        // Save width to determine the shape, default is 10
        this.width = width || DEFAULT_WIDTH;
        // Set the segment color
        this.color = color;
    }
    
    /**
     * PURPOSE: Generates points of the segment in 3d space based on its properties
     * RETURNS: [p1,p2,p3,p4] where points are an object contain an x, y, and z value
     *          and the points are listed in clockwise order starting with the point
     *          closest to the camera on the right (i.e. p1+{w,0,0}).
     */
    getPoints() {
        return [
            { x:this.x1 + this.width, y:this.y1, z:this.z1 },
            { x:this.x1 - this.width, y:this.y1, z:this.z1 },
            { x:this.x2 - this.width, y:this.y2, z:this.z2 },
            { x:this.x2 + this.width, y:this.y2, z:this.z2 },
        ]
    }

}

export default Segment;