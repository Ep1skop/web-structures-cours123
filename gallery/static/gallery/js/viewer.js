import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function loadModel(container, modelUrl) {
    if (!container) return;

    // ===== Сцена =====
    const scene = new THREE.Scene();
    scene.background = null;

    // ===== Камера =====
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    // ===== Рендерер =====
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Очистка контейнера и добавление canvas
    const playBtn = container.querySelector('.play-btn');
    if (playBtn) playBtn.remove();
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    // ===== Контролы =====
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;

    // ===== Окружение =====
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer)).texture;

    // ===== Загрузка модели =====
    const loader = new GLTFLoader();
    loader.load(
        modelUrl,
        (gltf) => {
            const model = gltf.scene;
            fitCameraToObject(camera, model, controls);
            scene.add(model);
        },
        undefined,
        (err) => console.error('Ошибка загрузки модели:', err)
    );

    // ===== Анимация =====
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // ===== Resize =====
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// ===== Центровка модели =====
function fitCameraToObject(camera, object, controls) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    object.position.x = -center.x;
    object.position.y = -center.y;
    object.position.z = -center.z;

    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
    camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
    camera.lookAt(0, 0, 0);

    controls.target.set(0, 0, 0);
    controls.update();
}

// ===== Инициализация всех карточек =====
document.querySelectorAll('.js-load-3d').forEach(container => {
    const url = container.dataset.url;

    // Клик по карточке (мини-превью)
    container.addEventListener('click', e => {
        if (e.target.classList.contains('fullscreen-btn')) return; // чтобы кнопка fullscreen не запускала этот код
        if (container.querySelector('canvas')) return;

        // Убираем фон карточки и кнопку play
        container.style.backgroundImage = 'none';
        container.style.backgroundColor = '#ffffff';
        const playBtn = container.querySelector('.play-btn');
        if (playBtn) playBtn.remove();

        loadModel(container, url);
    });

    // Fullscreen
    const btn = container.querySelector('.fullscreen-btn');
    if (btn) {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            openFullscreen(url);
        });
    }
});

// ===== Fullscreen overlay =====
function openFullscreen(modelUrl) {
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';
    document.body.appendChild(overlay);

    const container = document.createElement('div');
    container.style.width = '90%';
    container.style.height = '90%';
    container.style.background = '#ffffff';
    container.style.borderRadius = '10px';
    overlay.appendChild(container);

    // Кнопка закрытия
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.innerText = '✖';
    overlay.appendChild(closeBtn);
    closeBtn.addEventListener('click', () => overlay.remove());

    loadModel(container, modelUrl);
}