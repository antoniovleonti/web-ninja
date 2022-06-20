import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { AsciiEffect } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/effects/AsciiEffect.js';

class Sphere {
  constructor (timeOffset = 0) {
    this.start = Date.now() + timeOffset;
    this.duration = 1500;
    this.mesh = new THREE.Mesh( 
      new THREE.SphereGeometry(100, 10, 10), 
      new THREE.MeshPhongMaterial({ flatShading: true, side: THREE.DoubleSide })
    );
    targetMeshes.add(this.mesh);
    // now pick a random function to describe my motion
    this.x0 = Math.random() * 1400 - 700;
    do {
      this.xf = Math.random() * 1400 - 700;
    } while (Math.abs(this.xf - this.x0) < 100);
    this.y0 = -700;
    this.yf = 200; // top of arc
    // init position
    this.mesh.position.set(this.x0, this.y0, 0);
  }
  updatePosition () {
    if (Date.now() > this.start) {
      this.mesh.position.x = this.t * (this.xf - this.x0) + this.x0;
      this.mesh.position.y = Math.sin(this.t * Math.PI) * (this.yf - this.y0) + this.y0;
      this.mesh.rotation.x = Date.now() * 0.002;
      this.mesh.rotation.y = Date.now() * 0.002;
      this.mesh.rotation.z = Date.now() * 0.002;
    }
  }
  get t () {
    return (Date.now() - this.start) / this.duration;
  }
  get isDone () {
    return this.t >= 1;
  }
  get isAtPeak () {
    return Math.abs(this.t - 0.5) < 0.01;
  }
  kill () {
    targetMeshes.remove(this.mesh);
  }
}

class ChoppedSphere {
  constructor (timeOffset, x0, xf) {
    this.start = Date.now() + timeOffset;
    this.duration1 = 1500;
    this.duration2 = 1600;
    // create my two meshes (one for each half)
    this.mesh1 = new THREE.Mesh( 
      new THREE.SphereGeometry(100, 10, 10, 0, Math.PI, 0, Math.PI), 
      new THREE.MeshPhongMaterial( { flatShading: true, side: THREE.DoubleSide } ) 
    );
    scene.add(this.mesh1);
    this.mesh2 = new THREE.Mesh( 
      new THREE.SphereGeometry(100, 10, 10, 0, Math.PI, 0, Math.PI), 
      new THREE.MeshPhongMaterial( { flatShading: true, side: THREE.DoubleSide } ) 
    );
    scene.add(this.mesh2);
    // copy the old parameters
    this.x0_1 = x0;
    this.xf_1 = xf;
    this.y0 = -700;
    this.yf_1 = 200; // top of arc
    this.yf_2 = 250;
    // mirror over y axis at point of chop
    const xi = this.t2 * (xf - x0) + x0;
    this.x0_2 = xi - 1.5 * (x0 - xi);
    this.xf_2 = xi - 1.5 * (xf - xi);
    // init position
  }
  updatePosition () {
    this.mesh1.position.x = this.t1 * (this.xf_1 - this.x0_1) + this.x0_1;
    this.mesh1.position.y = Math.sin(this.t1 * Math.PI) * (this.yf_1 - this.y0) + this.y0;

    this.mesh1.rotation.x = Date.now() * 0.004;
    this.mesh1.rotation.y = Date.now() * 0.004;
    this.mesh1.rotation.z = Date.now() * 0.004;

    this.mesh2.position.x = this.t2 * (this.xf_2 - this.x0_2) + this.x0_2;
    this.mesh2.position.y = Math.sin(this.t2 * Math.PI) * (this.yf_2 - this.y0) + this.y0;

    this.mesh2.rotation.x = Date.now() * -0.004;
    this.mesh2.rotation.y = Date.now() * -0.004;
    this.mesh2.rotation.z = Date.now() * -0.004;
  }
  get t1 () {
    return (Date.now() - this.start) / this.duration1;
  }
  get t2 () {
    return (Date.now() - this.start) / this.duration2;
  }
  get isDone () {
    return this.t2 >= 1;
  }
  get isAtPeak () {
    return false;
  }
  kill () {
    scene.remove(this.mesh1);
    scene.remove(this.mesh2);
  }
}

var camera, scene, renderer, effect;
var mouse, raycaster, targetMeshes;
var spheres, halfSpheres;
var lastRegen = Date.now();

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.set(0,0, 500);

  // these are used for mouse input
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0, 0, 0 );

  targetMeshes = new THREE.Group();
  scene.add(targetMeshes);

  // add two lights to the scene
  const pointLight1 = new THREE.PointLight( 0xffffff );
  pointLight1.position.set( 500, 500, 500 );
  scene.add( pointLight1 );

  const pointLight2 = new THREE.PointLight( 0xffffff, 0.05 );
  pointLight2.position.set( -500, -500, 0 );
  scene.add( pointLight2 );

  spheres = [new Sphere(), new Sphere(750)];
  halfSpheres = [];

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth * 1.0, window.innerHeight);

  effect = new AsciiEffect( renderer, ' \`\',;"%&@#', { invert: true } );
  effect.setSize( window.innerWidth * 1.0, window.innerHeight );

  effect.domElement.style.backgroundColor = 'black';
  effect.domElement.style.color = 'lightgreen';
  document.body.appendChild( effect.domElement );

  window.addEventListener( 'resize', onWindowResize );
  window.addEventListener('mousemove', onMouseMove, false);
}

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(targetMeshes.children);

  for (let i = 0; i < intersects.length; i++) {
    for (let j = 0; j < spheres.length; j++) {
      if (spheres[j].mesh == intersects[i].object) {
        let tmp = new ChoppedSphere(spheres[j].start - Date.now(),
                                    spheres[j].x0,
                                    spheres[j].xf);
        spheres[j].kill();
        spheres[j] = tmp; 
      }
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth * 0.95, window.innerHeight  );
  effect.setSize( window.innerWidth * 0.95, window.innerHeight );
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  for (let i = 0; i < 2; i++) {
    if (spheres[i].isDone) {
      spheres[i].kill();
      spheres[i] = new Sphere(Date.now() - lastRegen < 500 ? 750 : 0);
      lastRegen = Date.now();
    }
    spheres[i].updatePosition();
  }
  effect.render( scene, camera );
}