import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



const container = document.getElementById('frame'); 

const renderer = new THREE.WebGLRenderer();
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(renderer.domElement.setPixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.domElement.setAttribute('tabindex', '0');
renderer.domElement.style.outline = 'none';
container.appendChild(renderer.domElement);

renderer.domElement.focus();

const scene = new THREE.Scene();


let camera;
let mixer;
let action;
let startTime;
let isTransitioning = false;
camera = new THREE.PerspectiveCamera(60, 5 / 5, 0.1, 1000);
camera.position.set(4, 5, 11);






const loader = new GLTFLoader().setPath('public/');
loader.load('cameraNew.gltf', (gltf) => {
  const importedCamera = gltf.cameras?.[0];
  if (importedCamera) {
    camera = importedCamera;
    scene.add(camera);
    
    mixer = new THREE.AnimationMixer(camera);
    action = mixer.clipAction(gltf.animations[0]);
    action.paused = true;  // 처음엔 멈춘 상태
    action.play();         // paused된 상태에서 play 준비
    action.time = startTime;


    const animationDuration = action.getClip().duration;

    window.addEventListener('scroll', () => {
      if (!action) return;
    
      const scrollT = getScrollProgress(); // 0~1
      const animTime = scrollT * animationDuration;
    
      action.time = animTime;
      mixer.update(0); // 강제 반영
      renderer.render(scene, camera);
    });


  }
});

function getScrollProgress() {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  return Math.min(Math.max(scrollTop / scrollHeight, 0), 1); // 0 ~ 1
}



function playSegment(startTime, endTime, durationInSeconds) {
  if (!action) return;
  if (isTransitioning) return;
  isTransitioning = true;
  action.paused = false;
  action.time = startTime;

  const delta = endTime - startTime;
  const start = performance.now();

  function step() {
    const now = performance.now();
    const elapsed = (now - start) / 1000;

    const t = Math.min(elapsed / durationInSeconds, 1); // 0~1 사이
    action.time = startTime + delta * t;
    mixer.update(0); // 강제 업데이트

    renderer.render(scene, camera); // 필수: 부드럽게 갱신

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      action.paused = true; // 끝나면 다시 멈춤
      isTransitioning = false;
      action.time = endTime; // 정확히 맞춰줌
    }
  }

  step();
}













const reRender3D = () => {
  requestAnimationFrame(reRender3D);
  renderer.render(scene, camera);
};
reRender3D();



let currentSegment = 0;

const segments = [
  { start: 0.0, end: 0.7, duration: 2 },
  { start: 0.7, end: 1.5, duration: 2 },
  { start: 1.5, end: 2.5, duration: 2 },
  { start: 2.5, end: 3.16, duration: 2 }
];


const segmentCount = segments.length;

const hashToSegmentIndex = {
  '#project1': 0,
  '#project2': 1,
  '#project3': 2,
  '#project4': 3
};




/*
renderer.domElement.addEventListener('keydown', (event) => {
  if (isTransitioning) return;

  if (event.key === 'ArrowRight') {
    if (currentSegment < segmentCount-1) {
      currentSegment++;
      const s = segments[currentSegment];
      
      playSegment(s.start, s.end, s.duration);
     
    } else {
      lerpCameraTo(
        new THREE.Vector3(-5.2, 5.0, 12.3),
        { x: -0.1, y: 0.2, z: 0.0 },
        1.0,
        () => { currentSegment = 0; } // 이동 후 초기화
      );
    }
  }

  if (event.key === 'ArrowLeft') {
    if (currentSegment > 1) {
      currentSegment--;
      const s = segments[currentSegment-1];
      playSegment(s.end, s.start, s.duration);
    } else {
      lerpCameraTo(
        new THREE.Vector3(-0.1, 4.0, 12.8),
        { x: -0.1, y: 0.2, z: 0.0 },
        1.0,
        () => { currentSegment = segmentCount; } // 이동 후 마지막 구간으로
      );
    }
  }
});
*/



function lerpCameraTo(targetPosition, targetRotation, duration = 2.0, onComplete) {
  if (isTransitioning) return; // 중복 호출 방지
  isTransitioning = true;

  const start = performance.now();
  const startPos = camera.position.clone();
  const deltaPos = targetPosition.clone().sub(startPos);

  const startQuat = camera.quaternion.clone();
  const endQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(targetRotation.x, targetRotation.y, targetRotation.z)
  );

  function animate() {
    const now = performance.now();
    const elapsed = (now - start) / 1000;
    const t = Math.min(elapsed / duration, 1);

    camera.position.set(
      startPos.x + deltaPos.x * t,
      startPos.y + deltaPos.y * t,
      startPos.z + deltaPos.z * t
    );

    const interpolatedQuat = startQuat.clone().slerp(endQuat, t);
    camera.quaternion.copy(interpolatedQuat);

    renderer.render(scene, camera);

    if (t < 1) {
      requestAnimationFrame(animate);
      //console.log('is transitioning: ' + isTransitioning);
    } else {
      isTransitioning = false;
     // console.log('is transitioning: ' + isTransitioning);
      if (typeof onComplete === 'function') onComplete(); // 콜백 실행
    }
  }

  animate();
  

}
// 혹시라도 클릭으로 포커스





const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x555555,
  side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const spotLight = new THREE.SpotLight(0xffffff, 3000, 100, 0.22, 1);
spotLight.position.set(0, 25, 0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;
//scene.add(spotLight);


loader.load('yesTest.gltf', (gltf) => {
 // console.log('loading model');
  const mesh = gltf.scene;

  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  mesh.position.set(0, 0, 0);
  scene.add(mesh);


}, (xhr) => {
 // console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
}, (error) => {
  console.error(error);
});

renderer.domElement.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
