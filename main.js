import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const gltfLoader = new GLTFLoader();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);
let treeVelocity = 0.01;

camera.position.set(0, 0.1, 1);
// camera.lookAt(0, 0, 0);
class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color,
    velocity = { x: 0, y: 0, z: 0 },
    position = { x: 0, y: 0, z: 0 },
    Zacc = false,
  }) {
    console.log(color);
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: color })
    );
    this.height = height;
    this.width = width;
    this.depth = depth;
    this.gravity = 0.01;
    this.position.set(position.x, position.y, position.z);
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    this.left = this.position.x - this.width / 2;
    this.right = this.position.x + this.width / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
    this.Zacc = Zacc;
    this.velocity = velocity;
  }
  update(ground) {
    this.updateSides();
    this.applyGravity(ground);
    if (this.Zacc) {
      this.velocity.z += 0.001;
    }
    this.position.z += this.velocity.z;
    this.position.x += this.velocity.x;
  }
  updateSides() {
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    this.left = this.position.x - this.width / 2;
    this.right = this.position.x + this.width / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }
  applyGravity(ground) {
    // console.log(this.boxCollision({ box1: this, box2: ground }));
    this.velocity.y += -this.gravity;
    if (boxCollision({ box1: this, box2: ground })) {
      this.velocity.y = this.velocity.y * 0.8;
      this.velocity.y = -this.velocity.y;
    } else this.position.y += this.velocity.y;
  }
}
function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right;
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
  const zCollision = box1.front >= box2.back && box1.back <= box2.front;
  return xCollision && yCollision && zCollision;
}
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});

renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;

renderer.setPixelRatio(devicePixelRatio);
// LIGHT
console.log(new OrbitControls(camera, renderer.domElement));
const light = new THREE.DirectionalLight(0xffffff, 4);
light.position.set(0, 5, 1);
light.castShadow = true;

scene.add(light);
// CUBE
const cubeMesh = new Box({
  height: 1,
  width: 1,
  depth: 1,
  color: 0x00ff00,
  velocity: { x: 0, y: -0.01, z: 0 },
  position: { x: 2, y: 0, z: 0 },
});
cubeMesh.castShadow = true;
scene.add(cubeMesh);
//PLANE

const planeMesh = new Box({
  height: 0.5,
  width: 10,
  depth: 75,
  color: 0x00369a1,
  position: { x: 0, y: -2, z: 0 },
});
planeMesh.receiveShadow = true;
scene.add(planeMesh);
camera;
camera.position.z = 5;
// camera.position.y = 1;
let velocity = 0;
renderer.render(scene, camera);
const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  space: {
    pressed: false,
  },
};
scene.add(new THREE.AmbientLight(0xffffff, 1));
window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = true;
      break;
    case "KeyD":
      keys.d.pressed = true;
      break;
    case "KeyW":
      keys.w.pressed = true;
      break;
    case "KeyS":
      keys.s.pressed = true;
      break;

    case "Space":
      keys.space.pressed = true;
  }
});
window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA":
      console.log();
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
    case "KeyW":
      keys.w.pressed = false;
      break;
    case "KeyS":
      keys.s.pressed = false;
      break;
    case "Space":
      keys.space.pressed = false;
  }
});

const enemies = [];
let spawnRate = 100;
let frame = 0;
const treesLeft = [];
for (let i = 0; i < 5; i++) {
  gltfLoader.load(
    "./Assets/minecraft_tree/scene.gltf",
    function (gltf) {
      const tree = gltf.scene;
      tree.scale.set(1, 4, 1);
      tree.position.set(
        -5 - 0.5 * Math.random(),
        -4,
        -i * 5 * Math.random() - 1
      );
      treesLeft.push(tree);
      scene.add(tree);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}
const treesRight = [];
for (let i = 0; i < 5; i++) {
  gltfLoader.load(
    "./Assets/minecraft_tree/scene.gltf",
    function (gltf) {
      const tree = gltf.scene;
      tree.scale.set(1, 4, 1);
      tree.position.set(
        5 + 0.5 * Math.random(),
        -4,
        -i * 5 * Math.random() - 1
      );
      treesRight.push(tree);
      scene.add(tree);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}
function animate() {
  const animationId = requestAnimationFrame(animate);
  cubeMesh.velocity.x = 0;
  cubeMesh.velocity.z = 0;
  frame++;
  if (frame % spawnRate == 0) {
    if (spawnRate > 20) {
      spawnRate -= 20;
    }

    const enemy = new Box({
      height: 1,
      width: 1,
      depth: 1,
      color: 0xff0000,
      velocity: { x: 0, y: 0, z: 0.001 },
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: -Math.random() * 15 - 7,
      },
      Zacc: true,
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }
  enemies.forEach((enemy) => {
    enemy.update(planeMesh);
    if (boxCollision({ box1: cubeMesh, box2: enemy })) {
      cancelAnimationFrame(animationId);
    }
  });
  if (frame % 30 == 0) {
    if (treeVelocity < 0.1) treeVelocity += 0.005;

    console.log("scsij");
    gltfLoader.load(
      "./Assets/minecraft_tree/scene.gltf",
      function (gltf) {
        const tree = gltf.scene;
        tree.scale.set(1, 4, 1);
        tree.position.set(5 + 0.5 * Math.random(), -4, Math.random() * 4 - 20);
        treesRight.push(tree);
        scene.add(tree);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );
    gltfLoader.load(
      "./Assets/minecraft_tree/scene.gltf",
      function (gltf) {
        const tree = gltf.scene;
        tree.scale.set(1, 4, 1);
        tree.position.set(-5 - 0.5 * Math.random(), -4, Math.random() * 4 - 20);
        treesLeft.push(tree);
        scene.add(tree);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );
  }
  treesLeft.forEach((tree) => {
    tree.position.z += treeVelocity;
  });
  treesRight.forEach((tree) => {
    tree.position.z += treeVelocity;
  });
  if (keys.a.pressed) {
    cubeMesh.velocity.x = -0.1;
  } else if (keys.d.pressed) {
    cubeMesh.velocity.x = 0.1;
  } else if (keys.w.pressed) {
    cubeMesh.velocity.z = -0.1;
  } else if (keys.s.pressed) {
    cubeMesh.velocity.z = 0.1;
  }
  if (keys.space.pressed) {
    cubeMesh.velocity.y = 0.15;
  }

  cubeMesh.update(planeMesh);
  renderer.render(scene, camera);
}
animate();
document.body.appendChild(renderer.domElement);
