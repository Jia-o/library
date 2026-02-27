import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
animate();

function init() {
    const floorColour = 0x888888; 
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    controls = new PointerLockControls(camera, document.body);
    controls.getObject().position.set(0, 5, 0);
    scene.add(controls.getObject());

    const ambientLight = new THREE.AmbientLight(0x4040ff, 0.5); 
    scene.add(ambientLight);

    const topLight = new THREE.DirectionalLight(0x5599ff, 1.0);
    topLight.position.set(0, 40, 0);
    scene.add(topLight);

    document.body.addEventListener('click', () => {
        controls.lock();
    });

    scene.add(controls.getObject());

    createRoom();
    createTables();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    window.addEventListener('resize', onWindowResize);
}

function createRoom() {
    const roomSize = 80;
    const loader = new THREE.TextureLoader();
    const galaxyTexture = loader.load('ceiling.png');
    
    const ceilingGeo = new THREE.SphereGeometry(
        roomSize / 2,
        64,
        32, 
        0, 
        Math.PI * 2, 
        0, 
        Math.PI / 2 
    );

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'white'); 
    gradient.addColorStop(0.8, 'white');
    gradient.addColorStop(1, 'black'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);

    const alphaTexture = new THREE.CanvasTexture(canvas);

    const ceilingMat = new THREE.MeshBasicMaterial({
        map: galaxyTexture,
        alphaMap: alphaTexture,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.NormalBlending,
        color: 0xffffff
    });

    const dome = new THREE.Mesh(ceilingGeo, ceilingMat);
    dome.position.y = 0; 
    scene.add(dome);
}

function createTables() {

    const spacing = 12;
    const start = -18;

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {

            const x = start + i * spacing;
            const z = start + j * spacing;

            const table = createTable();
            table.position.set(x, 0, z);
            scene.add(table);

            const jar = createJar();
            jar.position.set(x, 3.5, z);
            scene.add(jar);
        }
    }
}

function createTable() {

    const group = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 3, 16),
        new THREE.MeshStandardMaterial({ color: 0x5a3e2b })
    );
    base.position.y = 1.5;

    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 0.5, 32),
        new THREE.MeshStandardMaterial({ color: 0x7b523a })
    );
    top.position.y = 3.25;

    group.add(base);
    group.add(top);
    
    const lampLight = new THREE.PointLight(0xffaa44, 1.5, 15);
    lampLight.position.set(0, 5, 0); 
    group.add(lampLight);

    return group;
}

function createJar() {

    const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 2.5, 32),
        new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            roughness: 0,
            transmission: 1,
            thickness: 0.5,
            emissive: 0x3366ff,
            emissiveIntensity: 0.5
        })
    );

    return jar;
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp': moveForward = true; break;
        case 'ArrowDown': moveBackward = true; break;
        case 'ArrowLeft': moveLeft = true; break;
        case 'ArrowRight': moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp': moveForward = false; break;
        case 'ArrowDown': moveBackward = false; break;
        case 'ArrowLeft': moveLeft = false; break;
        case 'ArrowRight': moveRight = false; break;
    }
}

function animate() {
    requestAnimationFrame(animate);

    scene.traverse((object) => {
        if (object.geometry && object.geometry.type === 'SphereGeometry') {
            object.rotation.y += 0.0003; 
        }
    });

    const time = Date.now() * 0.002;
    scene.traverse((object) => {
        if (object instanceof THREE.PointLight) {
            object.intensity = 1.5 + Math.sin(time) * 0.2;
        }
    });

    renderer.render(scene, camera);

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward)
        controls.moveForward(direction.z * 0.2);

    if (moveLeft || moveRight)
        controls.moveRight(direction.x * 0.2);

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}