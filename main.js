import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- 1. SETTINGS & GLOBALS ---
let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); 
let clickableJars = []; 
let backendData = { readings: [], tags: [] };

const THEMES = [
    "AI", "Altruism", "Art", "Culture", 
    "Economics", "Environment", "Ethics", "Health", 
    "IR", "Media", "Philosophy", "Policy", 
    "Politics", "Technology", "Humour", "Random"
];

// --- 2. ASSET LOADING ---
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const jarTextures = {};

// Pre-load all 16 textures based on the THEMES array
THEMES.forEach(theme => {
    // Note: ensure your PNGs are in the same folder as this script
    jarTextures[theme] = textureLoader.load(`./assets/${theme}.png`);
});

loadingManager.onLoad = () => {
    console.log("All jar textures successfully loaded.");
};

const shadowTexture = (function() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0,0,0,0.6)'); // Darker center
    gradient.addColorStop(1, 'rgba(0,0,0,0)');   // Transparent edge
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
})();

// --- 3. INITIALIZATION ---
init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02030a); 

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemiLight);
    
    const ambientLight = new THREE.AmbientLight(0x4040ff, 0.6); 
    scene.add(ambientLight);

    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    document.body.addEventListener('click', () => {
        if (!controls.isLocked) {
            controls.lock();
        } else {
            checkJarInteraction();
        }
    });

    const crosshair = document.getElementById('crosshair');

    controls.addEventListener('lock', () => {
        crosshair.style.display = 'block';
    });
    
    controls.addEventListener('unlock', () => {
        crosshair.style.display = 'none';
    });

    createRoom();
    createTables(); // This now uses the pre-loaded sprites
    fetchData();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

// --- 4. DATA FETCHING ---
async function fetchData() {
    try {
        const response = await fetch('https://reading-list-backend-a71i.onrender.com/get-data');
        const data = await response.json();
        backendData = data;
        console.log("Data loaded successfully");
    } catch (e) {
        console.error("Data fetch failed:", e);
    }
}

// --- 5. WORLD BUILDING ---
function createRoom() {
    const roomSize = 80;
    
    // 1. Load the textures for the room
    const wallTexture1 = textureLoader.load('./wall1.png');
    const wallTexture2 = textureLoader.load('./wall2.png');
    const wallTexture3 = textureLoader.load('./wall3.png');
    const wallTexture4 = textureLoader.load('./wall4.png');
    const ceilingTexture = textureLoader.load('./ceiling.jpg');
    const floorTexture = textureLoader.load('./floor.png');
    
    // 2. Define the materials for each face of the box
    const materials = [
        new THREE.MeshBasicMaterial({ map: wallTexture2, side: THREE.BackSide }), // Right
        new THREE.MeshBasicMaterial({ map: wallTexture4, side: THREE.BackSide }), // Left
        new THREE.MeshBasicMaterial({ map: ceilingTexture, side: THREE.BackSide }), // Ceiling
        new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.BackSide }), // Floor
        new THREE.MeshBasicMaterial({ map: wallTexture1, side: THREE.BackSide }), // Front
        new THREE.MeshBasicMaterial({ map: wallTexture3, side: THREE.BackSide })  // Back
    ];

    // 3. Create the box geometry and mesh
    const boxGeo = new THREE.BoxGeometry(roomSize, roomSize / 1.5, roomSize);
    const room = new THREE.Mesh(boxGeo, materials);
    
    // Position the room so the floor is at y=0
    room.position.y = roomSize / 4; 
    scene.add(room);

    // Optional: Keep the grid for a techy floor vibe, or remove it to see just your floor texture
    const grid = new THREE.GridHelper(roomSize, 20, 0x4444ff, 0x222244);
    grid.position.y = 0.01; // Slightly above the floor to prevent flickering
    scene.add(grid);
}

function createTable() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3, 16), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
    base.position.y = 1.5;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x4a3223 }));
    top.position.y = 2.65;
    group.add(base, top);

    const lamp = new THREE.PointLight(0xffaa44, 5, 15);
    lamp.position.set(0, 5, 0);
    lamp.castShadow = true;
    lamp.shadow.mapSize.width = 512; 
    lamp.shadow.mapSize.height = 512;
    group.add(lamp);

    // const lamp = new THREE.PointLight(0xffaa44, 5, 10);
    // lamp.position.set(0, 4, 0);
    // group.add(lamp);
    
    return group;
}

function createJar(index) {
    const group = new THREE.Group(); 
    const themeName = THEMES[index];
    const texture = jarTextures[themeName];

    // The Sprite (The Jar itself)
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        alphaTest: 0.1 
    });
    const jar = new THREE.Sprite(spriteMaterial);
    jar.scale.set(9, 5, 1);
    jar.userData.theme = themeName.toLowerCase();
    group.add(jar);

    // The Shadow Plane (The "feet" of the jar)
    const shadowGeo = new THREE.PlaneGeometry(2.5, 1.5); 
    const shadowMat = new THREE.MeshBasicMaterial({ 
        map: shadowTexture, 
        transparent: true, 
        depthWrite: false,
        opacity: 1
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = -2.5;
    shadow.rotation.x = -Math.PI / 2;
    group.add(shadow);

    const hue = (index / 16);
    const jarColor = new THREE.Color().setHSL(hue, 0.6, 0.5);
    const innerLight = new THREE.PointLight(jarColor, 3, 6);
    innerLight.position.set(0, 0, -0.5);
    group.add(innerLight);

    return group;
}

function createTables() {
    const spacing = 18;
    const start = -30; 
    let themeIndex = 0;

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const x = start + i * spacing;
            const z = start + j * spacing;
            const themeName = THEMES[themeIndex];

            const table = createTable();
            table.position.set(x, 0, z);
            scene.add(table);

            // const jar = createJar(themeIndex);
            // jar.position.set(x, 5.5, z);
            // scene.add(jar);
            // clickableJars.push(jar);

            const jarGroup = createJar(themeIndex);
            jarGroup.position.set(x, 5.5, z); 
            scene.add(jarGroup);
            clickableJars.push(jarGroup.children[0]);

            const label = createTextLabel(themeName);
            label.position.set(x, 10, z); 
            scene.add(label);

            themeIndex++;
        }
    }
}

function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512; canvas.height = 128;
    context.font = 'Bold 40px Arial';
    context.textAlign = 'center';
    context.fillStyle = '#ffffff';
    context.fillText(text.toUpperCase(), 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(6, 1.5, 1);
    return sprite;
}

// --- 6. INTERACTION & ANIMATION ---
function checkJarInteraction() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableJars, true);

    if (intersects.length > 0) {
        const jarSprite = intersects[0].object; 
        const theme = jarSprite.userData.theme;
        
        const startY = 0; 
        const startTime = Date.now();
        
        const hop = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 400) {
                jarSprite.position.y = startY + Math.abs(Math.sin(elapsed * 0.01)) * 1.5;
                requestAnimationFrame(hop);
            } else {
                jarSprite.position.y = startY;
                if(pick) showReadingCard(theme, pick.title, pick.url);
                else showReadingCard(theme, "This jar is currently empty!", "#");
            }
        };
        hop();
    }
}

function showReadingCard(theme, title, url) {
    const card = document.getElementById('readingCard');
    document.getElementById('cardTheme').innerText = theme;
    document.getElementById('cardTitle').innerText = title;
    document.getElementById('cardLink').href = url;
    card.classList.add('active');
    controls.unlock(); 
}

window.closeCard = function() {
    document.getElementById('readingCard').classList.remove('active');
};

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
        case 'ArrowRight': case 'KeyD': moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
        case 'ArrowRight': case 'KeyD': moveRight = false; break;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const directionZ = Number(moveForward) - Number(moveBackward);
    const directionX = Number(moveRight) - Number(moveLeft);
    if (moveForward || moveBackward) controls.moveForward(directionZ * 0.2);
    if (moveLeft || moveRight) controls.moveRight(directionX * 0.2);
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}