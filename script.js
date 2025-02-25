// GPU specifications
const gpuSpecs = {
    smpCount: 16,
    warpSize: 32,
    maxThreadsPerBlock: 1024,
    maxThreadsPerSMP: 1536,
    maxBlockDimensions: [1024, 1024, 64],
    maxGridDimensions: [2147483647, 65535, 65535],
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121212);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationSpeed = 0.01;

// Raycaster for object selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Groups for different zoom levels
const gpuGroup = new THREE.Group();
const smpGroup = new THREE.Group();
const warpGroup = new THREE.Group();
const threadGroup = new THREE.Group();

scene.add(gpuGroup);

// Create the GPU visualization
function createGPU() {
    // GPU as a whole
    const gpuGeometry = new THREE.BoxGeometry(400, 200, 50);
    const gpuMaterial = new THREE.MeshPhongMaterial({
        color: 0x00aa00,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
    });
    const gpu = new THREE.Mesh(gpuGeometry, gpuMaterial);
    gpu.userData = {
        type: "GPU",
        description: "Your GPU contains 16 Streaming Multiprocessors (SMPs). Each SMP can handle multiple warps and threads simultaneously.",
    };
    gpuGroup.add(gpu);

    // SMPs
    const smpWidth = 80;
    const smpHeight = 160;
    const smpDepth = 30;
    const smpSpacing = 10;
    const smpsPerRow = 4;

    const smpGeometry = new THREE.BoxGeometry(smpWidth, smpHeight, smpDepth);
    const smpMaterial = new THREE.MeshPhongMaterial({
        color: 0x4285f4,
        transparent: true,
        opacity: 0.8,
    });

    for (let i = 0; i < gpuSpecs.smpCount; i++) {
        const smp = new THREE.Mesh(smpGeometry, smpMaterial);

        const row = Math.floor(i / smpsPerRow);
        const col = i % smpsPerRow;

        smp.position.x =
            col * (smpWidth + smpSpacing) -
            ((smpsPerRow - 1) * (smpWidth + smpSpacing)) / 2;
        smp.position.y =
            Math.floor(row / 2) * (smpHeight + smpSpacing) -
            (Math.floor((gpuSpecs.smpCount - 1) / smpsPerRow) / 2) *
            (smpHeight + smpSpacing);
        smp.position.z = row % 2 === 0 ? 0 : 30;

        smp.userData = {
            type: "SMP",
            id: i + 1,
            description: `SMP #${i + 1}: Can handle up to ${
        gpuSpecs.maxThreadsPerSMP
      } threads simultaneously, organized in warps.`,
        };

        gpuGroup.add(smp);
    }
}

// Create SMP Detailed View
function createSMPDetail() {
    // Single SMP representation
    const smpGeometry = new THREE.BoxGeometry(300, 400, 50);
    const smpMaterial = new THREE.MeshPhongMaterial({
        color: 0x4285f4,
        transparent: true,
        opacity: 0.5,
    });
    const smp = new THREE.Mesh(smpGeometry, smpMaterial);
    smp.userData = {
        type: "SMP Detail",
        description: `Each SMP can handle up to ${gpuSpecs.maxThreadsPerSMP} threads at once, organized into warps of ${gpuSpecs.warpSize} threads each.`,
    };
    smpGroup.add(smp);

    // Warps inside SMP
    const warpsPerSMP = Math.floor(gpuSpecs.maxThreadsPerSMP / gpuSpecs.warpSize);
    const warpWidth = 50;
    const warpHeight = 35;
    const warpDepth = 10;
    const warpSpacing = 5;
    const warpsPerRow = 6;

    const warpGeometry = new THREE.BoxGeometry(warpWidth, warpHeight, warpDepth);
    const warpMaterial = new THREE.MeshPhongMaterial({ color: 0xf4b400 });

    for (let i = 0; i < warpsPerSMP; i++) {
        const warp = new THREE.Mesh(warpGeometry, warpMaterial);

        const row = Math.floor(i / warpsPerRow);
        const col = i % warpsPerRow;

        warp.position.x =
            col * (warpWidth + warpSpacing) -
            ((warpsPerRow - 1) * (warpWidth + warpSpacing)) / 2;
        warp.position.y =
            row * (warpHeight + warpSpacing) -
            (Math.floor((warpsPerSMP - 1) / warpsPerRow) *
                (warpHeight + warpSpacing)) /
            2;
        warp.position.z = 30;

        warp.userData = {
            type: "Warp",
            id: i + 1,
            description: `Warp #${i + 1}: Contains ${
        gpuSpecs.warpSize
      } threads that execute the same instruction simultaneously.`,
        };

        smpGroup.add(warp);
    }
}

// Create Warp Detailed View
function createWarpDetail() {
    // Single Warp representation
    const warpGeometry = new THREE.BoxGeometry(300, 150, 20);
    const warpMaterial = new THREE.MeshPhongMaterial({
        color: 0xf4b400,
        transparent: true,
        opacity: 0.5,
    });
    const warp = new THREE.Mesh(warpGeometry, warpMaterial);
    warp.userData = {
        type: "Warp Detail",
        description: `A warp contains ${gpuSpecs.warpSize} threads that execute in lock-step. All threads in a warp execute the same instruction at the same time.`,
    };
    warpGroup.add(warp);

    // Threads inside warp
    const threadSize = 10;
    const threadSpacing = 5;
    const threadsPerRow = 8;

    const threadGeometry = new THREE.SphereGeometry(threadSize, 16, 16);
    const threadMaterial = new THREE.MeshPhongMaterial({ color: 0xdb4437 });

    for (let i = 0; i < gpuSpecs.warpSize; i++) {
        const thread = new THREE.Mesh(threadGeometry, threadMaterial);

        const row = Math.floor(i / threadsPerRow);
        const col = i % threadsPerRow;

        thread.position.x =
            col * (threadSize * 2 + threadSpacing) -
            ((threadsPerRow - 1) * (threadSize * 2 + threadSpacing)) / 2;
        thread.position.y =
            row * (threadSize * 2 + threadSpacing) -
            (Math.floor((gpuSpecs.warpSize - 1) / threadsPerRow) *
                (threadSize * 2 + threadSpacing)) /
            2;
        thread.position.z = 20;

        thread.userData = {
            type: "Thread",
            id: i + 1,
            description: `Thread #${
        i + 1
      }: The smallest execution unit in the GPU. Runs a single instance of your program.`,
        };

        warpGroup.add(thread);
    }
}

// Create Thread Detailed View
function createThreadDetail() {
    // Single Thread representation with pulsing effect
    const threadGeometry = new THREE.SphereGeometry(50, 32, 32);
    const threadMaterial = new THREE.MeshPhongMaterial({
        color: 0xdb4437,
        emissive: 0x881010,
    });
    const thread = new THREE.Mesh(threadGeometry, threadMaterial);
    thread.userData = {
        type: "Thread Detail",
        description: `A thread is the smallest execution unit. Your GPU can manage up to ${
      gpuSpecs.maxThreadsPerBlock
    } threads per block. With ${gpuSpecs.smpCount} SMPs, each handling up to ${
      gpuSpecs.maxThreadsPerSMP
    } threads, your GPU can process ${
      gpuSpecs.smpCount * gpuSpecs.maxThreadsPerSMP
    } threads simultaneously!`,
    };
    threadGroup.add(thread);

    // Add some visual elements to represent instructions
    const instructionCount = 8;
    const radius = 120;

    for (let i = 0; i < instructionCount; i++) {
        const angle = (i / instructionCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
        const cubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x0f9d58,
            transparent: true,
            opacity: 0.8,
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        cube.position.set(x, y, 0);
        cube.userData = {
            type: "Instruction",
            id: i + 1,
            description: `Instruction #${
        i + 1
      }: Threads execute instructions from your program one by one.`,
        };

        threadGroup.add(cube);
    }
}

// Initialize all visualizations
createGPU();
createSMPDetail();
createWarpDetail();
createThreadDetail();

// Handle window resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Zoom handling
document.addEventListener("wheel", (event) => {
    event.preventDefault();

    const zoomSpeed = 0.1;
    const zoom = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

    camera.position.multiplyScalar(zoom);

    // Ensure we don't zoom too far in or out
    if (camera.position.length() < 100) {
        camera.position.setLength(100);
    } else if (camera.position.length() > 2000) {
        camera.position.setLength(2000);
    }
});

// Mouse rotation handling
document.addEventListener("mousedown", (event) => {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
    };
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

document.addEventListener("mousemove", (event) => {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        const activeGroup = scene.children.find((child) => child.type === "Group");

        if (activeGroup) {
            activeGroup.rotation.y += deltaMove.x * rotationSpeed;
            activeGroup.rotation.x += deltaMove.y * rotationSpeed;
        }

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY,
        };
    }

    // Update mouse position for raycaster
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Object selection
document.addEventListener("click", () => {
            raycaster.setFromCamera(mouse, camera);

            const activeGroup = scene.children.find((child) => child.type === "Group");

            if (activeGroup) {
                const intersects = raycaster.intersectObjects(activeGroup.children, true);

                if (intersects.length > 0) {
                    const selectedObject = intersects[0].object;

                    if (selectedObject.userData) {
                        document.getElementById("details").innerHTML = `
            <strong>${selectedObject.userData.type}</strong>
            ${
              selectedObject.userData.id
                ? ` #${selectedObject.userData.id}`
                : ""
            }
            <p>${selectedObject.userData.description}</p>
          `;
      }
    }
  }
});

// View navigation buttons
document.getElementById("overview").addEventListener("click", () => {
  switchView("overview");
});

document.getElementById("smp").addEventListener("click", () => {
  switchView("smp");
});

document.getElementById("warp").addEventListener("click", () => {
  switchView("warp");
});

document.getElementById("thread").addEventListener("click", () => {
  switchView("thread");
});

function switchView(viewName) {
  // Remove all groups from scene
  scene.remove(gpuGroup);
  scene.remove(smpGroup);
  scene.remove(warpGroup);
  scene.remove(threadGroup);

  // Reset rotations
  gpuGroup.rotation.set(0, 0, 0);
  smpGroup.rotation.set(0, 0, 0);
  warpGroup.rotation.set(0, 0, 0);
  threadGroup.rotation.set(0, 0, 0);

  // Add appropriate group based on view
  switch (viewName) {
    case "overview":
      scene.add(gpuGroup);
      camera.position.set(0, 0, 500);
      document.getElementById("description").innerHTML =
        "GPU Overview: Use your mouse wheel to zoom in/out. Click and drag to rotate the view. Click on components to learn more.";
      document.getElementById(
        "details"
      ).innerHTML = `This visualization shows your GPU with ${gpuSpecs.smpCount} Streaming Multiprocessors (SMPs).`;
      break;
    case "smp":
      scene.add(smpGroup);
      camera.position.set(0, 0, 500);
      document.getElementById("description").innerHTML =
        "SMP Detail View: Shows how warps are organized within a single Streaming Multiprocessor.";
      document.getElementById(
        "details"
      ).innerHTML = `Each SMP can handle up to ${gpuSpecs.maxThreadsPerSMP} threads organized into warps.`;
      break;
    case "warp":
      scene.add(warpGroup);
      camera.position.set(0, 0, 300);
      document.getElementById("description").innerHTML =
        "Warp Detail View: Shows the threads within a single warp.";
      document.getElementById(
        "details"
      ).innerHTML = `A warp contains exactly ${gpuSpecs.warpSize} threads that execute in lock-step.`;
      break;
    case "thread":
      scene.add(threadGroup);
      camera.position.set(0, 0, 300);
      document.getElementById("description").innerHTML =
        "Thread Detail View: Shows a single execution thread and the instructions it processes.";
      document.getElementById("details").innerHTML =
        "A thread is the smallest execution unit that runs your code.";
      break;
  }
}

// Start with overview
switchView("overview");

// Animation
function animate() {
  requestAnimationFrame(animate);

  // Add some gentle rotation for visual interest
  if (!isDragging) {
    const activeGroup = scene.children.find((child) => child.type === "Group");
    if (activeGroup) {
      activeGroup.rotation.y += 0.001;
    }
  }

  // Add pulsing effect to thread in thread view
  if (scene.children.includes(threadGroup)) {
    const thread = threadGroup.children[0];
    if (thread) {
      const time = Date.now() * 0.001;
      const scale = 1 + Math.sin(time * 2) * 0.05;
      thread.scale.set(scale, scale, scale);

      // Make instructions orbit
      for (let i = 1; i < threadGroup.children.length; i++) {
        const instruction = threadGroup.children[i];
        const angle = (i / (threadGroup.children.length - 1)) * Math.PI * 2;
        const radius = 120;
        instruction.position.x = Math.cos(angle + time) * radius;
        instruction.position.y = Math.sin(angle + time) * radius;
        instruction.rotation.x += 0.01;
        instruction.rotation.y += 0.01;
      }
    }
  }

  // Update TWEEN animations if needed
  TWEEN.update();

  renderer.render(scene, camera);
}

animate();