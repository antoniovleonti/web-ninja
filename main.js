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
    // now z direction to add a little depth
    this.z0 = Math.random() * 200 - 100;
    this.zf = Math.random() * 200 - 100;
    // init position
    this.mesh.position.set(this.x0, this.y0, 0);
  }
  updatePosition () {
    if (Date.now() > this.start) {
      this.mesh.position.x = this.t * (this.xf - this.x0) + this.x0;
      this.mesh.position.y = Math.sin(this.t * Math.PI) * (this.yf - this.y0) + this.y0;
      this.mesh.position.z = this.t * (this.zf - this.z0) + this.z0;

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
  constructor (timeOffset, x0, xf, z0, zf) {
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
    this.y0 = -700;
    this.yf_1 = 200; // top of arc
    this.yf_2 = 250;
    // mirror over y axis at point of chop
    const xi = this.t2 * (xf - x0) + x0;
    this.x0_1 = xi + 1.5 * (x0 - xi);
    this.xf_1 = xi + 1.5 * (xf - xi);
    this.x0_2 = xi - 1.5 * (x0 - xi);
    this.xf_2 = xi - 1.5 * (xf - xi);

    const zi = this.t2 * (zf - z0) + z0;
    this.z0_1 = zi + 2 * (z0 - zi);
    this.zf_1 = zi + 2 * (zf - zi);
    this.z0_2 = zi - 2 * (z0 - zi);
    this.zf_2 = zi - 2 * (zf - zi);
    // init position
  }
  updatePosition () {
    this.mesh1.position.x = this.t1 * (this.xf_1 - this.x0_1) + this.x0_1;
    this.mesh1.position.y = Math.sin(this.t1 * Math.PI) * (this.yf_1 - this.y0) + this.y0;
    this.mesh1.position.z = this.t1 * (this.zf_1 - this.z0_1) + this.z0_1;

    this.mesh1.rotation.x = Date.now() * 0.004;
    this.mesh1.rotation.y = Date.now() * 0.004;
    this.mesh1.rotation.z = Date.now() * 0.004;

    this.mesh2.position.x = this.t2 * (this.xf_2 - this.x0_2) + this.x0_2;
    this.mesh2.position.y = Math.sin(this.t2 * Math.PI) * (this.yf_2 - this.y0) + this.y0;
    this.mesh2.position.z = this.t2 * (this.zf_2 - this.z0_2) + this.z0_2;

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
var trailMesh, trailBuff, trailPoints, lastFrame;
var targets;
var lastRegen; 

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

  targets = [new Sphere(), new Sphere(750)];
  lastRegen = Date.now() + 750;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  effect = new AsciiEffect(renderer, ' \`\',;"%&@#', {invert: true});
  effect.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(effect.domElement);
  effect.domElement.style.backgroundColor = 'black';
  effect.domElement.style.color = 'lightgreen';

  // now set up for the mouse trail
  trailPoints = [
    new THREE.Vector3(0,0,0), 
    new THREE.Vector3(0,0,0), 
    new THREE.Vector3(0,0,0), 
    new THREE.Vector3(0,0,0), 
    new THREE.Vector3(0,0,0)];

  console.log(trailPoints);

  trailBuff = new THREE.BufferGeometry().setFromPoints( trailPoints );
  const lineMat = new THREE.LineBasicMaterial({color: 0xffffff});
  trailMesh = new THREE.Line (trailBuff, lineMat);
  scene.add(trailMesh);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove, false);
}

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // update the trail head
  var vec = new THREE.Vector3(); // create once and reuse
  vec.set(mouse.x, mouse.y, 1);
  vec.unproject( camera );
  vec.sub( camera.position ).normalize();
  var distance = - camera.position.z / vec.z;
  trailPoints[0].copy( camera.position ).add( vec.multiplyScalar( distance ) );
  // raycast into targets
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(targetMeshes.children);
  // replace intersected targets with chopped sphere
  for (let i = 0; i < intersects.length; i++) {
    for (let j = 0; j < targets.length; j++) {
      if (targets[j].mesh == intersects[i].object) {
        let tmp = new ChoppedSphere(targets[j].start - Date.now(),
                                    targets[j].x0,
                                    targets[j].xf,
                                    targets[j].z0,
                                    targets[j].zf);
        targets[j].kill();
        targets[j] = tmp; 
      }
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth , window.innerHeight  );
  effect.setSize( window.innerWidth , window.innerHeight );
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  for (let i = 0; i < 2; i++) {
    if (targets[i].isDone) {
      targets[i].kill();
      targets[i] = new Sphere(Date.now() - lastRegen < 500 ? 750 : 0);
      lastRegen = Date.now();
    }
    targets[i].updatePosition();
  }
  // update trail
  for (let i = 1; i < trailPoints.length; i++) {
    trailPoints[i].lerp(trailPoints[i - 1], 0.8);
  }
  trailBuff.setFromPoints(trailPoints);

  lastFrame = Date.now();
  effect.render( scene, camera );
}