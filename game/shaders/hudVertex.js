export const vertexShaderText = `

attribute float textureSkin;
attribute float textureFrame;

varying vec2 vUv;
varying float vTextureSkin;
varying float vTextureFrame;

void main() {
    vUv = uv;
    vTextureSkin = textureSkin;
    vTextureFrame = textureFrame;
    
    vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * instancePosition;
}

`;
