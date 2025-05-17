
import { scene, controls, renderer, camera, dominos, dominoWidth, dominoHeight, dominoGroup, dominoDepth } from "./scene.js";
import { pointLight1, pointLight2, ambientLight, directionalLight, updateLights } from "./light.js";
import { gouraudMaterial, phongMaterial, shininessValues, diffuseReflectances, createShaderMaterial } from "./material.js";

const dominoMaterials = [];
for (let i = 0; i < 9; i++) {
    dominoMaterials.push(createShaderMaterial(i));
}

// State variables
let currentShading = 'phong';
let currentTexture = null;
let currentMapping = 'box';


const textureLoader = new THREE.TextureLoader();
let checkerTexture, woodTexture;

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

function createDomino(x, z) {
    const geo = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth);
    const mat = dominoMaterials[dominos.length % dominoMaterials.length].clone();
    const mesh = new THREE.Mesh(geo, (currentShading === 'phong') ? mat : gouraudMaterial.clone());
    mesh.position.set(x, dominoHeight / 2, z);
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

// applyAll function:
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case '1':
            currentShading = 'gouraud';
            applyAll();
            break;
        case '2':
            currentShading = 'phong';
            applyAll();
            break;
        case '3':
            pointLight1.visible = true;
            pointLight2.visible = false;
            directionalLight.visible = false;
            break;
        case '4':
            pointLight1.visible = true;
            pointLight2.visible = true;
            directionalLight.visible = true;
            break;
        case '5':
            currentTexture = checkerTexture;
            currentMapping = 'box';
            applyAll();
            break;
        case '6':
            currentTexture = woodTexture;
            currentMapping = 'box';
            applyAll();
            break;
        case '7':
            currentTexture = null;
            currentMapping = 'box';
            applyAll();
            break;
        case '8':
            if (currentTexture === checkerTexture) {
                currentMapping = (currentMapping === 'cyl' ? 'box' : 'cyl');
                applyAll();
            }
            break;
        case '9':
            if (currentTexture === checkerTexture) {
                currentMapping = (currentMapping === 'sph' ? 'box' : 'sph');
                applyAll();
            }
            break;
        case 's': case 'S':
            shuffleDominos();
            break;
        case 'a': case 'A':
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

(function animate() {
    requestAnimationFrame(animate);
    updateLights();
    controls.update();
    renderer.render(scene, camera);
})();
