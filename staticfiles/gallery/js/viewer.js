import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function loadModel(containerId, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Сцена
    const scene = new THREE.Scene();
    //scene.background = new THREE.Color(0xf5f5f5); // Светло-серый фон
    scene.background = null

    // 2. Камера
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    // 3. Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Для четкости на Retina экранах
    renderer.outputColorSpace = THREE.SRGBColorSpace; // ВАЖНО для GLTF!

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Контролы
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;

    // 5. Окружение (Свет)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
        new RoomEnvironment(renderer)
    ).texture;

    // 6. Загрузка модели
    const loader = new GLTFLoader();
    loader.load(
        modelUrl,
        (gltf) => {
            const model = gltf.scene;
            fitCameraToObject(camera, model, controls); // Передаем controls тоже!
            scene.add(model);

            // ВАЖНО: Обновляем цель контроллера, чтобы вращение было вокруг центра модели
            controls.target.set(0, 0, 0);
            controls.update();
        },
        undefined,
        (err) => console.error(err)
    );

    // 7. Анимация
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Вспомогательная функция для центровки модели
function fitCameraToObject(camera, object, controls) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Сдвигаем модель в центр
    object.position.x = -center.x;
    object.position.y = -center.y;
    object.position.z = -center.z;

    // Ставим камеру
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
    camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
    camera.lookAt(0, 0, 0);
}
