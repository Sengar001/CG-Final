import { vertexShader, fragmentShader } from "./shaders.js";
import { scene, controls, renderer, camera } from "./scene.js";
import { pointLight1, pointLight2, ambientLight, directionalLight } from "./light.js";

// Base materials (no texture)
const gouraudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, shininess: 30 });
const phongMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 150, specular: 0x333333 });

const shininessValues = [10, 30, 60, 90, 120, 150, 180, 210, 240];
const diffuseReflectances = [
    0.1, 0.56, 0.67, 0.78, 0.82, 0.45, 0.93, 0.72, 0.88
];

// Shader Material Creation
function createShaderMaterial(index) {
    return new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            shadingMode: { value: 0 },
            textureMap: { value: null },
            useTexture: { value: 0 },
            lightPositions: { value: [] },
            lightColors: { value: [] },
            numLights: { value: 0 },
            diffuseReflectance: { value: diffuseReflectances[index % diffuseReflectances.length] },
            ambientColor: { value: new THREE.Color(0.2, 0.2, 0.2) },
            shininess: { value: shininessValues[index % shininessValues.length] }
        },
        glslVersion: THREE.GLSL1
    });
}

// In your initialization code, replace material creation:
const dominoMaterials = [];
for (let i = 0; i < 9; i++) {
    dominoMaterials.push(createShaderMaterial(i));
}



// State variables
let currentShading = 'phong';   // 'phong' or 'gouraud'
let currentTexture = null;      // null, checkerTexture, or woodTexture
let currentMapping = 'box';     // 'box', 'cyl', 'sph'

// Texture loader
const textureLoader = new THREE.TextureLoader();
let checkerTexture, woodTexture;

// Create checkerboard texture programmatically
function createCheckerTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const rows = 8, cols = 8;
    const cw = size / cols, ch = size / rows;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#000';
            ctx.fillRect(j * cw, i * ch, cw, ch);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
}
checkerTexture = createCheckerTexture();
woodTexture = textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg', () => {
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(1, 1);
});

// Domino geometry setup
const dominoWidth = 0.5, dominoHeight = 2, dominoDepth = 1;
const dominos = [], dominoGroup = new THREE.Group();
scene.add(dominoGroup);

function createDomino(x, z) {
    const geo = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth);
    // pick a distinct Phong material by index (0–8):
    const mat = dominoMaterials[dominos.length % dominoMaterials.length].clone();
    // if we're in Gouraud mode, override with the single Lambert:
    const mesh = new THREE.Mesh(geo, (currentShading === 'phong') ? mat : gouraudMaterial.clone());
    mesh.position.set(x, dominoHeight / 2, z);
    // mesh.castShadow=true; mesh.receiveShadow=true;
    dominoGroup.add(mesh);
    dominos.push(mesh);
}

// Arrangements
function createUniformArrangement() {
    dominoGroup.clear(); dominos.length = 0;
    const spacing = 2;
    for (let i = 0; i < 9; i++) createDomino((i - 4) * spacing, 0);
    applyAll();
}
function createNonUniformArrangement() {
    dominoGroup.clear();
    dominos.length = 0;

    const numDominos = 10;
    const startX = -6;
    const z = 0;
    let currentX = startX;

    for (let i = 0; i < numDominos; i++) {
        createDomino(currentX, z);
        const randomGap = 1 + Math.random() * 1.5;
        currentX += randomGap;
    }

    applyAll();
}

// Initial
createUniformArrangement();
let currentArrangement = 'uniform';

// Shuffle
function shuffleDominos() {
    const positions = dominos.map(d => d.position.clone());
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    dominos.forEach((d, i) => d.position.copy(positions[i]));
}

// UV‐mapping helpers
function applyCylindricalUV(geo) {
    const pos = geo.attributes.position;
    const uv = [];
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const theta = Math.atan2(z, x);
        const u = (theta + Math.PI) / (2 * Math.PI);
        const v = (y + dominoHeight / 2) / dominoHeight;
        uv.push(u, v);
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
}
function applySphericalUV(geo) {
    const pos = geo.attributes.position;
    const uv = [];
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const r = Math.sqrt(x * x + y * y + z * z);
        const u = 0.5 + (Math.atan2(z, x) / (2 * Math.PI));
        const v = 0.5 - (Math.asin(y / r) / Math.PI);
        uv.push(u, v);
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
}

// Update your applyAll function:
function applyAll() {
    dominos.forEach((domino, idx) => {
        const material = domino.material;

        // Update material properties
        material.uniforms.shadingMode.value = currentShading === 'phong' ? 1 : 0;
        material.uniforms.useTexture.value = currentTexture ? 1 : 0;
        material.uniforms.textureMap.value = currentTexture;
        material.uniforms.shininess.value = shininessValues[idx % shininessValues.length];
        material.uniforms.diffuseReflectance.value = diffuseReflectances[idx % diffuseReflectances.length];
        // Update geometry (same as before)
        let geo;
        if (currentTexture === checkerTexture && currentMapping === 'cyl') {
            geo = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth, 100, 100, 100);
            applyCylindricalUV(geo);
        } else if (currentTexture === checkerTexture && currentMapping === 'sph') {
            geo = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth, 100, 100, 100);
            applySphericalUV(geo);
        } else {
            geo = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth);
        }
        domino.geometry.dispose();
        domino.geometry = geo;
    });
}


// Add this to your animation loop:
function updateLights() {
    const activeLights = [];
    if (pointLight1.visible) activeLights.push(pointLight1);
    if (pointLight2.visible) activeLights.push(pointLight2);
    if (directionalLight.visible) activeLights.push(directionalLight);

    dominos.forEach(domino => {
        const uniforms = domino.material.uniforms;
        const lightPositions = [];
        const lightColors = [];

        activeLights.forEach(light => {
            lightPositions.push(light.position.clone());
            lightColors.push(light.color.clone());
        });

        // Pad arrays to 3 elements
        while (lightPositions.length < 3) lightPositions.push(new THREE.Vector3());
        while (lightColors.length < 3) lightColors.push(new THREE.Color(0, 0, 0));

        uniforms.lightPositions.value = lightPositions;
        uniforms.lightColors.value = lightColors;
        uniforms.numLights.value = activeLights.length;
    });
}

// Event listeners
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case '1': // Gouraud
            currentShading = 'gouraud';
            applyAll();
            break;
        case '2': // Phong
            currentShading = 'phong';
            applyAll();
            break;
        case '3': // Single light
            pointLight1.visible = true;
            pointLight2.visible = false;
            directionalLight.visible = false;
            break;
        case '4': // Multiple lights
            pointLight1.visible = true;
            pointLight2.visible = true;
            directionalLight.visible = true;
            break;
        case '5': // Checkerboard
            currentTexture = checkerTexture;
            currentMapping = 'box';
            applyAll();
            break;
        case '6': // Wood
            currentTexture = woodTexture;
            currentMapping = 'box';
            applyAll();
            break;
        case '7': // No texture
            currentTexture = null;
            currentMapping = 'box';
            applyAll();
            break;
        case '8': // Cylindrical mapping toggle
            if (currentTexture === checkerTexture) {
                currentMapping = (currentMapping === 'cyl' ? 'box' : 'cyl');
                applyAll();
            }
            break;
        case '9': // Spherical mapping toggle
            if (currentTexture === checkerTexture) {
                currentMapping = (currentMapping === 'sph' ? 'box' : 'sph');
                applyAll();
            }
            break;
        case 's': case 'S': // Shuffle
            shuffleDominos();
            break;
        case 'a': case 'A': // Toggle arrangement
            if (currentArrangement === 'uniform') {
                createNonUniformArrangement();
                currentArrangement = 'non-uniform';
            } else {
                createUniformArrangement();
                currentArrangement = 'uniform';
            }
            break;
    }
});

// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.2 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Modify your animate function:
(function animate() {
    requestAnimationFrame(animate);
    updateLights();
    controls.update();
    renderer.render(scene, camera);
})();
