class Segment {

    /**
     * PURPOSE: Constructor for a segment
     * PARAMS:
     *   p1           - the first point of the seg (drawn from)
     *   color        - the color of the segment (formatted 0x000000)
     *   width (opt)  - the width of the segment (center to edge), default = 4
     *   p2 (opt)     - the second seg point (drawn to), by default, the second point is
     *                  created relative the first point but with 5 added to the z
     */
    constructor(points, color) {
        // Save points for the segment
        this.points=points
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