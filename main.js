import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { AsciiEffect } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/effects/AsciiEffect.js';

let camera, scene, renderer, effect;
let sphere, halfSphere;
const start = Date.now();

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 120, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0, 0, 0 );

    const pointLight1 = new THREE.PointLight( 0xffffff );
    pointLight1.position.set( 500, 500, 500 );
    scene.add( pointLight1 );

    const pointLight2 = new THREE.PointLight( 0xffffff, 0.05 );
    pointLight2.position.set( -500, -500, 0 );
    scene.add( pointLight2 );

    sphere = new THREE.Mesh( 
        new THREE.SphereGeometry( 200, 10, 10 ), 
        new THREE.MeshPhongMaterial( { flatShading: true, side: THREE.DoubleSide } ) );
    scene.add( sphere );

    // will be added to scene when a sphere is sliced
    halfSphere = new THREE.Mesh( 
        new THREE.SphereGeometry( 200, 10, 10, 0, Math.PI, 0, Math.PI), 
        new THREE.MeshPhongMaterial( { flatShading: true, side: THREE.DoubleSide } ) );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    effect = new AsciiEffect( renderer, ' \`\'^+"%&@#', { invert: true } );
    effect.setSize( window.innerWidth, window.innerHeight );
    //effect.domElement.style.color = 'white';
    effect.domElement.style.backgroundColor = 'black';

    // Special case: append effect.domElement, instead of renderer.domElement.
    // AsciiEffect creates a custom domElement (a div container) where the ASCII elements are placed.

    document.body.appendChild( effect.domElement );
    //

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    effect.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    render();

}

function render() {

    const timer = Date.now() - start;

    sphere.position.x = Math.sin( timer * 0.002 ) * 150;
    sphere.rotation.x = timer * 0.0003;
    sphere.rotation.z = timer * 0.0002;

    effect.render( scene, camera );
}
