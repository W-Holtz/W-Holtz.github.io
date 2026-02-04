export const fragmentShaderText = `

uniform sampler2D textureAtlas;
uniform float heightStep; // normalized
uniform float widthStep;  // normalized

// Varyings (from vertex shader)
varying vec2 vUv;
varying float vTextureSkin;
varying float vTextureFrame;

void main() {
    // Calculate offset
    vec2 atlasOffset = vec2(vTextureFrame * widthStep, vTextureSkin * heightStep);
    
    // Scale UVs to fit one texture slot and add offset
    vec2 sampleCoord = vUv * vec2(widthStep, heightStep) + atlasOffset;
    
    // Sample the texture
    vec4 color = texture2D(textureAtlas, sampleCoord);
    
    gl_FragColor = color;
}

`;