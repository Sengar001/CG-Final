export function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 25, 30);

  const followCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  followCamera.position.set(-15, 3, -8);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  return { scene, renderer, camera, followCamera, controls };
}
