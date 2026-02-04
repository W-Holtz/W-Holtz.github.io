import * as THREE from 'three';

const VS = `

attribute float size;
attribute float angle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size / gl_Position.w;
}`;


const FS = `
uniform sampler2D diffuseTexture;

void main() {
  gl_FragColor = texture2D(diffuseTexture, gl_PointCoord);
}`;

class TireParticles {
  constructor(parentMesh, camera) {
    const uniforms = {
        diffuseTexture: {
            value: new THREE.TextureLoader().load('./assets/gravel.png')
        },
    };

    this.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: VS,
        fragmentShader: FS,
        blending: THREE.NormalBlending,
        depthTest: true,
        depthWrite: false,
        transparent: false,
        vertexColors: true
    });

    this.camera = camera;
    this.particles = [];

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
    this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));

    this.points = new THREE.Points(this.geometry, this.material);
    
    this.parentMesh=parentMesh;
    this.parentMesh.add(this.points);
  
    this.updateGeometry();
  }

  addParticles(velocity, position, count) {
    for (let i = 0; i < count; i++) {
      const newVelocity = new THREE.Vector3();
      newVelocity.x = (Math.random() - .5) * 3;
      newVelocity.z = (Math.random() - .5) * 3;
      newVelocity.addScaledVector(velocity, 1);
      const newPosition = position.clone();
      console.log(position.length(), newPosition.length())
      newPosition.x += (Math.random() - .5) * 0.2;
      newPosition.z += (Math.random() - .5) * 0.2;
      //console.log(newPosition)

      this.particles.push({
          position: newPosition,
          size: (Math.random() + 0.5) * 6,
          rotation: Math.random() * 2.0 * Math.PI,
          velocity: newVelocity,
          originalHeight: newPosition.y,
      });
    }
  }

  updateGeometry() {
    const positions = [];
    const angles = [];
    const sizes = [];

    for (let p of this.particles) {
      positions.push(p.position.x, p.position.y, p.position.z);
      sizes.push(p.size);
      angles.push(p.rotation);
    }

    this.geometry.setAttribute(
        'position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute(
        'size', new THREE.Float32BufferAttribute(sizes, 1));
    this.geometry.setAttribute(
        'angle', new THREE.Float32BufferAttribute(angles, 1));
  
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.angle.needsUpdate = true;
  }

  updateParticles(timeElapsed) {
    const gravity = -5 * timeElapsed;
    for (let p of this.particles) {
      p.rotation += timeElapsed * 0.5;
      p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));
      p.velocity.y += gravity;
    }

    this.particles = this.particles.filter(p => {
      return p.position.y >= p.originalHeight;
    });
  }

  step(timeElapsed) {
    this.updateParticles(timeElapsed);
    this.updateGeometry();
    this.geometry.computeBoundingSphere();
  }
}

export default TireParticles;
