import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); 
let clickableJars = []; 
let backendData = { readings: [], tags: [] };
let textureLoader = new THREE.TextureLoader();

const THEMES = [
    "AI", "Altruism", "Art", "Culture", 
    "Economics", "Environment", "Ethics", "Health", 
    "IR", "Media", "Philosophy", "Policy", 
    "Politics", "Technology", "Humour", "Random"
];

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02030a); // Dark midnight blue instead of pure black

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Move camera back so you aren't staring at a wall
    camera.position.set(0, 5, 10); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lights - Increased intensity to ensure visibility
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

    createRoom();
    createTables();
    fetchData();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

async function fetchData() {
    try {
        const response = await fetch('https://reading-list-backend-a71i.onrender.com/get-data');
        const data = await response.json();
        backendData = data;
        
        clickableJars.forEach((jar) => {
            jar.material.emissiveIntensity = 0.8; 
        });

        console.log("Data loaded successfully");
    } catch (e) {
        console.error("Data fetch failed:", e);
    }
}


function createRoom() {
    const roomSize = 80;
    const loader = new THREE.TextureLoader();
    
    const wallTexture1 = loader.load('./wall1.png');
    const wallTexture2 = loader.load('./wall2.png');
    const wallTexture3 = loader.load('./wall3.png');
    const wallTexture4 = loader.load('./wall4.png');
    const ceilingTexture = loader.load('./ceiling.jpg');
    const floorTexture = loader.load('./floor.png');
    
    const materials = [
        new THREE.MeshBasicMaterial({ map: wallTexture2, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: wallTexture4, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: ceilingTexture, side: THREE.BackSide }), // ceiling
        new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.BackSide }), // floor
        new THREE.MeshBasicMaterial({ map: wallTexture1, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: wallTexture3, side: THREE.BackSide })
    ];

    const boxGeo = new THREE.BoxGeometry(roomSize, roomSize/1.5, roomSize);
    const room = new THREE.Mesh(boxGeo, materials);
    room.position.y = roomSize/4; 
    scene.add(room);

    const grid = new THREE.GridHelper(roomSize, 20, 0x4444ff, 0x222244);
    grid.position.y = 0; 
    scene.add(grid);
}

function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = 1024; 
    canvas.height = 256;

    context.font = 'Bold 80px Arial';
    context.textAlign = 'center';
    context.fillStyle = '#ffffff'; 
    context.strokeStyle = '#6366f1'; 
    context.lineWidth = 6;
    
    context.strokeText(text.toUpperCase(), 512, 150);
    context.fillText(text.toUpperCase(), 512, 150);

    const texture = new THREE.CanvasTexture(canvas);
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true, 
        opacity: 0.5 
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(8, 2, 1); 
    return sprite;
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

            const jar = createJar(themeIndex);
            jar.position.set(x, 3.5, z);
            jar.userData.theme = themeName.toLowerCase();
            scene.add(jar);
            clickableJars.push(jar);

            // Add the floating label
            const label = createTextLabel(themeName);
            label.position.set(x, 8, z); // Floating above the jar
            scene.add(label);

            themeIndex++;
        }
    }
}

function createJar(index) {
    const hue = (index / 16);
    const jarColor = new THREE.Color().setHSL(hue, 0.6, 0.5);

    // Create a silhouette profile for a curved bottle
    const points = [];
    for (let i = 0; i <= 10; i++) {
        // This math creates a "belly" on the bottle
        const x = Math.sin(i * 0.3) * 0.8 + 0.4; 
        const y = (i - 5) * 0.4;
        points.push(new THREE.Vector2(x, y));
    }

    const geometry = new THREE.LatheGeometry(points, 32);
    const material = new THREE.MeshPhysicalMaterial({
        color: jarColor,
        emissive: jarColor,
        emissiveIntensity: 0.6, // Makes them "glow" like the potion images
        transparent: true,
        opacity: 0.7,
        transmission: 0.9,
        roughness: 0.1,
        metalness: 0.2,
        thickness: 2.0
    });

    const jar = new THREE.Mesh(geometry, material);
    
    // Add a cork instead of a metal lid for that aesthetic vibe
    const corkGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.4, 16);
    const corkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const cork = new THREE.Mesh(corkGeo, corkMat);
    cork.position.y = 2.2;
    jar.add(cork);

    // Optional: Add a small point light inside for extra "magic"
    const innerLight = new THREE.PointLight(jarColor, 5, 3);
    jar.add(innerLight);

    return jar;
}

// function createJar(index) {
//     const hue = (index / 16); // colours around the rainbow
//     const jarColor = new THREE.Color().setHSL(hue, 0.6, 0.5);
    
//     // random dimentions
//     const randomHeight = 2.2 + Math.random() * 0.8;
//     const randomRadius = 0.8 + Math.random() * 0.4;

//     const geometry = new THREE.CylinderGeometry(randomRadius, randomRadius * 0.9, randomHeight, 32);
//     const material = new THREE.MeshPhysicalMaterial({
//         color: jarColor,
//         emissive: jarColor,
//         emissiveIntensity: 0.4,
//         transparent: true,
//         opacity: 0.5,
//         transmission: 1.0, 
//         thickness: 1.0,
//         roughness: 0.05,
//         metalness: 0.1
//     });

//     const jar = new THREE.Mesh(geometry, material);
//     const lidGeo = new THREE.CylinderGeometry(randomRadius + 0.1, randomRadius + 0.1, 0.3, 32);
//     const lidMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.8, roughness: 0.2 });
//     const lid = new THREE.Mesh(lidGeo, lidMat);
//     lid.position.y = randomHeight / 2 + 0.1;
//     jar.add(lid);

//     return jar;
// }

function createTable() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3, 16), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
    base.position.y = 1.5;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x4a3223 }));
    top.position.y = 2.65;
    group.add(base, top);
    
    const lamp = new THREE.PointLight(0xffaa44, 10, 15);
    lamp.position.set(0, 5, 0);
    group.add(lamp);
    
    return group;
}

function checkJarInteraction() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableJars);

    if (intersects.length > 0) {
        const jar = intersects[0].object;
        const theme = jar.userData.theme;
        
        let options;
        if (theme === "random") {
            options = backendData.readings; // Everything!
        } else {
            options = backendData.readings.filter(r => r.themes.includes(theme));
        }

        const pick = options[Math.floor(Math.random() * options.length)];
        
        // Shake logic...
        const startX = jar.position.x;
        const startTime = Date.now();
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
                jar.position.x = startX + Math.sin(elapsed * 0.1) * 0.1;
                requestAnimationFrame(shake);
            } else {
                jar.position.x = startX;
                if(pick) {
                    showReadingCard(theme, pick.title, pick.url);
                } else {
                    showReadingCard(theme, "This jar is currently empty!", "#");
                }
            }
        };
        shake();
    }
}

function showReadingCard(theme, title, url) {
    const card = document.getElementById('readingCard');
    document.getElementById('cardTheme').innerText = theme;
    document.getElementById('cardTitle').innerText = title;
    document.getElementById('cardLink').href = url;

    // Show card and unlock pointer so user can click
    card.classList.add('active');
    controls.unlock(); 
}

// Attach this to window so the HTML button can see it
window.closeCard = function() {
    const card = document.getElementById('readingCard');
    card.classList.remove('active');
    // Optional: auto-lock again, or let user click to re-enter
};

// Navigation Logic
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