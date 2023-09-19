import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
let firstGame = true;
let treeVelocity;
let treeSpawnRate;
const gltfLoader = new GLTFLoader();
let lastTree;
let cubeMesh;
let enemyAcc;
let treeModel;
let myTime = {
  second: 0,
  centi: 0,
};
// Create an Audio object
const audio = new Audio("./Assets/backGroundMusic.mp3");
let timerId;
function timer() {
  timerId = setInterval(() => {
    document.querySelector(".centi").innerHTML = myTime.centi
      .toString()
      .padStart(2, "0");
    myTime.centi++;
    if (myTime.centi > 99) {
      myTime.second++;
      myTime.centi = 0;
      document.querySelector(".seconds").innerHTML =
        myTime.second.toString().padStart(2, "0") + "s";
    }
  }, 10);
}
// Function to play the audio in a loop
function playAudioLoop() {
  audio
    .play()
    .then(() => {
      // Audio started playing
      console.log("Audio started playing");
    })
    .catch((error) => {
      // Handle any errors
      console.error("Error playing audio:", error);
    });

  // Listen for the "ended" event to restart the audio
  audio.addEventListener("ended", () => {
    audio.currentTime = 0; // Reset to the beginning
    audio.play(); // Play again
  });
}
let gameStart = false;
// Start playing the audio in a loop

addEventListener("keydown", () => {
  if (!gameStart) {
    init();
    gameStart = true;
    document.querySelector(".press").style.display = "none";
  }
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  innerWidth / innerHeight,
  0.1,
  1000
);

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
  update(ground, index) {
    this.updateSides();
    this.applyGravity(ground);
    if (this.Zacc) {
      this.velocity.z += enemyAcc;
    }
    this.position.z += this.velocity.z;
    if (this.position.z > ground.front) {
      scene.remove(this);
      enemies.splice(index, 1);
    }
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
const light = new THREE.DirectionalLight(0xffffff, 4);
light.position.set(0, 5, 1);
light.castShadow = true;

scene.add(light);
// CUBE

const planeMesh = new Box({
  height: 0.5,
  width: 10,
  depth: 75,
  color: 0x00369a1,
  position: { x: 0, y: -2, z: 0 },
});
planeMesh.receiveShadow = true;
scene.add(planeMesh);

//PLANE

// camera.position.y = 1;
camera.position.set(0, 1.5, planeMesh.front + 5);
camera.lookAt(0, -1.25, planeMesh.front);

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
    // case "KeyW":
    //   keys.w.pressed = true;
    //   break;
    // case "KeyS":
    //   keys.s.pressed = true;
    //   break;

    // case "Space":
    //   keys.space.pressed = true;
  }
});
window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
    // case "KeyW":
    //   keys.w.pressed = false;

    // case "KeyS":
    //   keys.s.pressed = false;

    // case "Space":
    //   keys.space.pressed = false;
  }
});
function loadTree() {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      "./Assets/tree/scene.gltf",
      function (gltf) {
        const tree = gltf.scene;
        tree.scale.set(1, 1, 1);
        resolve(tree); // Resolve the promise with the loaded tree object
      },
      undefined,
      function (error) {
        console.error(error);
        reject(error); // Reject the promise if there's an error
      }
    );
  });
}
loadTree()
  .then((tree) => {
    treeModel = tree;
    document.querySelector(".frosted").style.display = "none";
    init();

    console.log(treeModel);
  })
  .catch((err) => {
    console.log(err);
  });
function makeTrees(x, z) {
  return new Promise((resolve, reject) => {
    let tree = treeModel.clone();
    tree.position.set(x, 2, z);
    resolve(tree);
  });
}
let enemies = [];
let spawnRate = 100;
let frame = 0;
let treesRight = [];
let treesLeft = [];
function init() {
  myTime.centi = 0;
  myTime.second = 0;
  document.querySelector(".centi").innerHTML = "00";

  document.querySelector(".seconds").innerHTML = "00s";

  if (!firstGame) {
    timer();
  }

  spawnRate = 100;
  treeVelocity = 0.07;
  treeSpawnRate = 20;
  enemyAcc = 0.001;
  enemies = [];
  treesLeft = [];
  treesRight = [];
  const length = scene.children.length;
  for (let i = length - 1; i > 2; i--) {
    console.log(scene.children);
    scene.remove(scene.children[i]);
  }
  cubeMesh = new Box({
    height: 1,
    width: 1,
    depth: 1,
    color: 0x00ff00,
    velocity: { x: 0, y: -0.01, z: 0 },
    position: { x: 0, y: -1.25, z: planeMesh.front - 2 },
  });
  cubeMesh.castShadow = true;
  scene.add(cubeMesh);

  for (let i = 0; i < 15; i++) {
    makeTrees(planeMesh.left - 0.5, -i * 5 + planeMesh.front)
      .then((tree) => {
        scene.add(tree);
        // tree.rotateY(Math.PI / 2);

        treesLeft.push(tree);
        lastTree = tree;
        renderer.render(scene, camera);
      })
      .catch((err) => {
        console.log(err);
      });
    makeTrees(planeMesh.right + 0.5, -i * 5 + planeMesh.front)
      .then((tree) => {
        scene.add(tree);

        treesRight.push(tree);
        renderer.render(scene, camera);
      })
      .catch((err) => {
        console.log(err);
      });
    renderer.render(scene, camera);
  }
  // console.log(lasr)
  if (!firstGame) {
    animate();
  } else {
    addEventListener("keydown", () => {
      console.log("xygxuagx");
      if (firstGame) {
        animate();
        timer();
        playAudioLoop();
        document.querySelector(".press").style.display = "none";
        firstGame = false;
      }
    });
  }
}

function animate() {
  if (frame % 100 === 0) {
    enemyAcc += 0.0008;
    treeVelocity += 0.003;
  }
  console.log("fdud");
  const animationId = requestAnimationFrame(animate);

  cubeMesh.velocity.x = 0;
  cubeMesh.velocity.z = 0;
  frame++;
  if (frame % spawnRate == 0) {
    if (spawnRate > 10) {
      spawnRate -= 2;
    }
    const enemy = new Box({
      height: 1,
      width: 1,
      depth: 1,
      color: 0xff0000,
      velocity: { x: 0, y: 0, z: 0.001 },
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 1,
        z: Math.random() * planeMesh.back + 10 * Math.random(),
      },
      Zacc: true,
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }
  enemies.forEach((enemy, index) => {
    enemy.update(planeMesh, index);
    if (boxCollision({ box1: cubeMesh, box2: enemy })) {
      cancelAnimationFrame(animationId);
      document.querySelector(".press").style.color = "red";
      document.querySelector(".press").innerHTML =
        "Game over.<br> press any key to restart";
      document.querySelector(".press").style.display = "block";
      clearInterval(timerId);

      gameStart = false;
    }
  });
  if (lastTree && lastTree.position.z - planeMesh.back > 8) {
    if (treeSpawnRate > 5) treeSpawnRate - 1;
    if (treeVelocity < 2) treeVelocity += 0.008;

    makeTrees(planeMesh.left - 0.5, -35)
      .then((tree) => {
        scene.add(tree);
        // tree.rotateY(Math.PI / 2);
        treesLeft.push(tree);
        lastTree = tree;
      })
      .catch((err) => {
        console.log(err);
      });

    makeTrees(planeMesh.right + 0.5, -35)
      .then((tree) => {
        scene.add(tree);

        treesRight.push(tree);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  treesLeft.forEach((tree, index) => {
    tree.position.z += treeVelocity;
    if (tree.position.z > planeMesh.front + 2) {
      scene.remove(tree);
      treesLeft.splice(index, 1);
    }
  });
  treesRight.forEach((tree, index) => {
    tree.position.z += treeVelocity;
    if (tree.position.z > planeMesh.front + 2) {
      scene.remove(tree);
      treesRight.splice(index, 1);
    }
  });
  if (keys.a.pressed && cubeMesh.left > planeMesh.left) {
    cubeMesh.velocity.x = -0.2;
  } else if (keys.d.pressed && cubeMesh.right < planeMesh.right) {
    cubeMesh.velocity.x = 0.2;
  } else if (keys.w.pressed) {
    cubeMesh.velocity.z = -0.2;
  } else if (keys.s.pressed) {
    cubeMesh.velocity.z = 0.2;
  }
  if (keys.space.pressed) {
    cubeMesh.velocity.y = 0.15;
  }
  cubeMesh.update(planeMesh);
  renderer.render(scene, camera);
}
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);
