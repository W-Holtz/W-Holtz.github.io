class Renderer {
    constructor(context) {
        this.context = context;
        this.rotation = 0;
        this.fov_theta = 1.2 // ~69 degrees (radians);
		this.aspect_r = context.height / context.width;
		this.fov_theta = fov_theta;
		this.fov = 1 / Math.tan(fov_theta/2);
		this.zNear = 0.1;
		this.zFar = 1000;
		this.q = zFar/ (zFar - zNear);
		this.proj_matrix = calc_proj_matrix();
    }

    calc_proj_matrix() {
		return [
				[(this.aspect_r * this.fov), 0,        0,      0                  ],
				[0,                          this.fov, 0,      0                  ],
				[0,                          0,        this.q, (-this.zn * this.q)],
				[0,                          0,        1,      0                  ]
			];
    }

	get_projected(in_arr) {
		//#print("Getting Projected")
		//#print("in arr:")
		//#print(in_arr)
		// 1.) First, multiply by the projection matrix
        let new_arr = math.dot(this.proj_matrix, in_arr);
		//#print("dotted:")
		//#print(new_arr)
		// 2.) Then, for every column (vertex) where the w vector is !=, scale by 1/w
		let col_index = 0
        // we know the w vals are stored in the last row of the nested array
        new_arr[3].forEach((currW) => {
            if (currW != 0) {
                new_arr[0][col_index]*=1/currW;
                new_arr[1][col_index]*=1/currW;
                new_arr[2][col_index]*=1/currW;
            }
            col_index++;
        });
		//#print("final:")
		//#print(new_arr)
		return new_arr
    }

    drawTriangle() {

    }
}

export default Renderer

/**
 * # This is the linear algebra heavy file! It is where we do all of our projection from
# 3D to 2D.

import numpy as np
import math

# a = h/w : aspect ratio
# f = 1/tan(theta/2) : feild of view
# q = zf / (zf - zn) : scaling coefficient for the Z axis

class Renderer():
	
	def __init__(self, a, fov_theta, zn, zf):
		self.aspect_r = a
		self.fov_theta = fov_theta
		self.fov = 1 / math.tan(fov_theta/2)
		self.zn = zn
		self.zf = zf
		self.q = zf / (zf - zn)
		self.proj_matrix = None
		self.calc_proj_matrix()

		
	def calc_proj_matrix(self):
		self.proj_matrix = np.array(
			[
				[(self.aspect_r * self.fov), 0,        0,      0                  ],
				[0,                          self.fov, 0,      0                  ],
				[0,                          0,        self.q, (-self.zn * self.q)],
				[0,                          0,        1,      0                  ]
			]
		)
		
	def get_projected(self, in_arr):
		#print("Getting Projected")
		#print("in arr:")
		#print(in_arr)
		# 1. First, multiply by the projection matrix
		new_arr = np.dot(self.proj_matrix, in_arr)
		#print("dotted:")
		#print(new_arr)
		# 2. Then, for every column (vertex) where the w vector is !=, scale by 1/w
		for i,el in enumerate(new_arr[-1,:] != 0):
			if el:
				new_arr[:,i] = new_arr[:,i] / new_arr[-1,i]
		#print("final:")
		#print(new_arr)
		return new_arr


def rotate_x(inp, theta):
	rot_matr = np.array(
		[
			[1, 0,                    0,               0],
			[0, math.cos(theta),      math.sin(theta), 0],
			[0, -1 * math.sin(theta), math.cos(theta), 0],
			[0, 0,                    0,               1]
		]
	)
	return np.dot(rot_matr, inp)

def rotate_z(inp, theta):
	rot_matr = np.array(
		[
			[math.cos(theta),      math.sin(theta), 0, 0],
			[-1 * math.sin(theta), math.cos(theta), 0, 0],
			[0,                    0,               1, 0],
			[0,                    0,               0, 1]
		]
	)
	return np.dot(rot_matr, inp)


def rotate_y(inp, theta):
	rot_matr = np.array(
		[
			[math.cos(theta), 0, -1 * math.sin(theta), 0],
			[0,               1, 0,                    0],
			[math.sin(theta), 0, math.cos(theta),      0],
			[0,               0, 0,                    1]
		]
	)
	return np.dot(rot_matr, inp)
	




 */