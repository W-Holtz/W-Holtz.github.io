import {vertexShaderText} from './shaders/vertex.js';
import {fragmentShaderText} from './shaders/fragment.js';

/**
 * Sets up a webGL program with a vertex and fragment shader pulled from the
 * vertex.js and fragment.js files.
 * @param gl The webGL context
 * @returns The newly created webGL program
 */
export function pipelineSetup (gl) {
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);
    return createProgram(gl, vertexShader, fragmentShader);
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}