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

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new PointerLockControls(camera, document.body);

    document.body.addEventListener('click', () => {
        controls.lock();
    });

    scene.add(controls.getObject());

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404080, 1.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    createRoom();
    createTables();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    window.addEventListener('resize', onWindowResize);
}

function createRoom() {

    const roomSize = 80;

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({ 
            color: 0x1a1d3a,
            metalness: 0.2,
            roughness: 0.6
        })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x10142a,
        side: THREE.BackSide
    });

    const room = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, 40, roomSize),
        wallMaterial
    );

    room.position.y = 20;
    scene.add(room);

    // Add glowing ceiling effect
    const ceilingGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize - 5, roomSize - 5),
        new THREE.MeshBasicMaterial({
            color: 0x2244aa,
            transparent: true,
            opacity: 0.15
        })
    );

    ceilingGlow.rotation.x = Math.PI / 2;
    ceilingGlow.position.y = 39.9;
    scene.add(ceilingGlow);
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