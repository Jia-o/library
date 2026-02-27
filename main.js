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
    "Politics", "Technology", "History", "Random"
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

// Separate fetch function so it doesn't block the rendering
async function fetchData() {
    try {
        const response = await fetch('https://reading-list-backend-a71i.onrender.com/get-data');
        const data = await response.json();
        backendData = data;
        
        // Assign tags to existing jars
        clickableJars.forEach((jar, index) => {
            if (data.tags && data.tags[index]) {
                jar.userData.theme = data.tags[index];
                // Change color slightly to show it's "loaded"
                jar.material.emissiveIntensity = 1.0; 
            }
        });
        console.log("Jars labeled with themes:", data.tags);
    } catch (e) {
        console.error("Data fetch failed, jars will remain random.");
    }
}


function createRoom() {
    const roomSize = 80;
    const loader = new THREE.TextureLoader();
    
    // Load your galaxy texture
    const galaxyTexture = loader.load('ceiling.png');
    galaxyTexture.wrapS = THREE.RepeatWrapping;
    galaxyTexture.wrapT = THREE.RepeatWrapping;
    galaxyTexture.repeat.set(2, 2); // Tiles the stars so they aren't stretched

    // 1. THE BOX (Walls and Ceiling)
    // We make it slightly larger than the floor to avoid gaps
    const boxGeo = new THREE.BoxGeometry(roomSize, roomSize / 2, roomSize);
    
    // We use BackSide so the texture is visible from the INSIDE
    const boxMat = new THREE.MeshBasicMaterial({
        map: galaxyTexture,
        side: THREE.BackSide,
        color: 0x333333 // Dims the texture slightly for a "deep space" feel
    });

    const room = new THREE.Mesh(boxGeo, boxMat);
    // Position it so the bottom of the box is at y = 0
    room.position.y = roomSize / 4; 
    scene.add(room);

    // 2. THE FLOOR (Polished & Visible)
    const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMat = new THREE.MeshPhysicalMaterial({
        color: 0x111122,      // Midnight Blue
        metalness: 0.6,
        roughness: 0.2,
        clearcoat: 1.0,       // This makes the floor reflect the jars!
        reflectivity: 0.5
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // 3. THE GRID (Essential for seeing the square boundaries)
    const grid = new THREE.GridHelper(roomSize, 20, 0x4444ff, 0x222244);
    grid.position.y = 0.01; 
    scene.add(grid);
}

// function createTables() {
//     const spacing = 15;
//     const start = -15;

//     for (let i = 0; i < 4; i++) {
//         for (let j = 0; j < 3; j++) {
//             const x = start + i * spacing;
//             const z = start + j * spacing;

//             const table = createTable();
//             table.position.set(x, 0, z);
//             scene.add(table);

//             const jar = createJar();
//             jar.position.set(x, 3.5, z);
//             scene.add(jar);
//             clickableJars.push(jar); 
//         }
//     }
// }

// function createTable() {
//     const group = new THREE.Group();
//     const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3, 16), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
//     base.position.y = 1.5;
//     const top = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x4a3223 }));
//     top.position.y = 3.25;
//     group.add(base, top);
    
//     const lamp = new THREE.PointLight(0xffaa44, 10, 15);
//     lamp.position.set(0, 5, 0);
//     group.add(lamp);
    
//     return group;
// }

// function createJar() {
//     return new THREE.Mesh(
//         new THREE.CylinderGeometry(1, 1, 2.5, 32),
//         new THREE.MeshPhysicalMaterial({
//             color: 0x88ccff, transparent: true, opacity: 0.5,
//             transmission: 1, thickness: 0.5, emissive: 0x0066ff, emissiveIntensity: 0.2
//         })
//     );
// }

// 2. Updated Table Creation for a 4x4 Grid (16 tables)
function createTables() {
    const spacing = 18;
    const start = -27; // Adjusted to center the 4x4 grid
    let themeIndex = 0;

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const x = start + i * spacing;
            const z = start + j * spacing;

            const table = createTable();
            table.position.set(x, 0, z);
            scene.add(table);

            // Create a unique jar for this theme
            const jar = createJar(themeIndex);
            jar.position.set(x, 3.5, z);
            
            // Assign the theme name to the jar's data
            jar.userData.theme = THEMES[themeIndex].toLowerCase();
            
            scene.add(jar);
            clickableJars.push(jar); 
            themeIndex++;
        }
    }
}

// 3. The "Cooler" Unique Jar Function
function createJar(index) {
    // Generate a unique color based on the index
    const hue = (index / 16); // Distributes colors around the rainbow
    const jarColor = new THREE.Color().setHSL(hue, 0.6, 0.5);
    
    // Randomize dimensions slightly so they aren't identical
    const randomHeight = 2.2 + Math.random() * 0.8;
    const randomRadius = 0.8 + Math.random() * 0.4;

    const geometry = new THREE.CylinderGeometry(randomRadius, randomRadius * 0.9, randomHeight, 32);
    const material = new THREE.MeshPhysicalMaterial({
        color: jarColor,
        emissive: jarColor,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.5,
        transmission: 1.0, // High glass effect
        thickness: 1.0,
        roughness: 0.05,
        metalness: 0.1
    });

    const jar = new THREE.Mesh(geometry, material);
    
    // Add a "Lid" to make it look like a real jar
    const lidGeo = new THREE.CylinderGeometry(randomRadius + 0.1, randomRadius + 0.1, 0.3, 32);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.8, roughness: 0.2 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = randomHeight / 2 + 0.1;
    jar.add(lid);

    return jar;
}

function createTable() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3, 16), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
    base.position.y = 1.5;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x4a3223 }));
    top.position.y = 3.25;
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
        
        if (!theme) {
            alert("This jar is still empty... try another or wait for the library to load!");
            return;
        }

        const options = backendData.readings.filter(r => r.themes.includes(theme));
        const pick = options[Math.floor(Math.random() * options.length)];

        // Simple Shake
        const startX = jar.position.x;
        const startTime = Date.now();
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 400) {
                jar.position.x = startX + Math.sin(elapsed * 0.1) * 0.1;
                requestAnimationFrame(shake);
            } else {
                jar.position.x = startX;
                if(pick) alert(`[${theme.toUpperCase()}]\n\n${pick.title}\n\nLink: ${pick.url}`);
            }
        };
        shake();
    }
}

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