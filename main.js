import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
let firstGame = true;
let cubeScale = { X: 1, Y: 1, Z: 1 };
let planeScale = { X: 1, Y: 1, Z: 1 };
let treeScale = { X: 1, Y: 1, Z: 1 };
if (isTouchDevice() && innerWidth < 600) {
  cubeScale.X = 0.5;
  cubeScale.Y = 0.5;
  cubeScale.Z = 0.5;
  planeScale.X = 0.4;
  planeScale.Y = 1;
  planeScale.Z = 1;
  treeScale.Y = 0.7;
  treeScale.Z = 0.7;
  treeScale.X = 0.7;
} else {
  document.querySelector(".press").style.display = "block";
  document.querySelector(".touchScreen").style.display = "none";
}
let treeVelocity;
const gltfLoader = new GLTFLoader();
let lastTree;
let cubeMesh;
let enemyAcc;
let treeModel;
let highScore = {
  centi: 0,
  second: 0,
};
let myTime = {
  second: 0,
  centi: 0,
};
function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

let highCentiDom = document.querySelector(".highCenti");
let highSecondDom = document.querySelector(".highSeconds");
if (localStorage.getItem("highCenti") && localStorage.getItem("highSeconds")) {
  highScore.centi = localStorage.getItem("highCenti") * 1;
  highScore.second = localStorage.getItem("highSeconds") * 1;
  highCentiDom.innerHTML = highScore.centi;
  highSecondDom.innerHTML = highScore.second + "s";
}

function incrementHighScore() {
  if (highScore.second < myTime.second) {
    highScore.centi = myTime.centi;
    highScore.second = myTime.second;
    highCentiDom.innerHTML = highScore.centi.toString().padStart(2, "0");
    highSecondDom.innerHTML =
      highScore.second.toString().padStart(2, "0") + "s";
  } else if (
    highScore.second === myTime.second &&
    myTime.centi > highScore.centi
  ) {
    highScore.centi = myTime.centi;
    highCentiDom.innerHTML = highScore.centi.toString().padStart(2, "0");
  }
}

// Create an Audio object
const audio = new Audio("./Assets/backGroundMusic.mp3");
let timerId;
function timer() {
  timerId = setInterval(() => {
    document.querySelector(".centi").innerHTML = myTime.centi
      .toString()
      .padStart(2, "0");
    incrementHighScore();
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
const overlay = document.querySelector(".overlay");

addEventListener("keydown", (e) => {
  if (!gameStart && e.key === "Enter") {
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
    this.updateSides();
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
      this.velocity.y = this.velocity.y * 0.6;
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
  height: 0.5 * planeScale.Y,
  width: 10 * planeScale.X,
  depth: 100 * planeScale.Z,
  color: 0x00369a1,
  position: { x: 0, y: -2, z: 0 },
});
planeMesh.receiveShadow = true;
scene.add(planeMesh);

//PLANE

// camera.position.y = 1;
if (isTouchDevice()) {
  camera.position.set(0, 1.0 * cubeScale.X, planeMesh.front + 2);

  camera.lookAt(0, 1 * cubeScale.X, planeMesh.front + 2);
} else {
  camera.position.set(0, 1.5 * cubeScale.X, planeMesh.front + 4);

  camera.lookAt(0, 1 * cubeScale.X, planeMesh.front + 2);
}
function screenWidthToThreeJsUnits(screenWidthInPixels, camera) {
  // Calculate the aspect ratio of the camera
  const aspect = camera.aspect;

  // Calculate the horizontal field of view (in radians) of the camera
  const horizontalFOV = camera.fov * (Math.PI / 180);

  // Calculate the width of the screen in Three.js units
  const halfWidth = Math.tan(horizontalFOV / 2);
  const distanceToScreen = screenWidthInPixels / 2 / halfWidth;
  const screenUnits =
    (screenWidthInPixels / window.innerWidth) * distanceToScreen * 2;

  return screenUnits;
}

// Example usage:
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
    case "ArrowLeft":
      keys.a.pressed = true;
      break;
    case "ArrowRight":
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
    case "ArrowLeft":
      keys.a.pressed = false;
      break;
    case "ArrowRight":
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
// Touch Screen logic

document.querySelector(".left").addEventListener("touchstart", () => {
  keys.a.pressed = true;
});
document.querySelector(".left").addEventListener("touchend", () => {
  keys.a.pressed = false;
});
document.querySelector(".right").addEventListener("touchstart", () => {
  keys.d.pressed = true;
});
document.querySelector(".right").addEventListener("touchend", () => {
  keys.d.pressed = false;
});
let clickCount = 0;
document.querySelector(".overlay").addEventListener("click", function () {
  clickCount++;
  let doubleClickTimeout;
  if (clickCount === 1) {
    doubleClickTimeout = setTimeout(function () {
      clickCount = 0;
    }, 300); // Adjust the time threshold (in milliseconds) as needed
  } else if (clickCount === 2) {
    console.log("doubled");
    clearTimeout(doubleClickTimeout);
    clickCount = 0;

    if (isTouchDevice()) {
      showFrostedElement()
        .then(() => {
          if (!gameStart && isTouchDevice() && !firstGame) {
            gameStart = true;
            setTimeout(() => {
              init();
            }, 5);
            document.querySelector(".press").style.display = "none";
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
});
function showFrostedElement() {
  return new Promise((resolve, reject) => {
    document.querySelector(".frosted").innerHTML = "Loading...";

    const frostedElement = document.querySelector(".frosted");
    if (frostedElement) {
      frostedElement.style.display = "flex";
      console.log("ddiv");
      resolve(); // Resolve the Promise when the element's display is set to "flex"
    } else {
      reject(new Error("Element with class 'frosted' not found"));
    }
  });
}

function loadTree() {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      "./Assets/tree/scene.gltf",
      function (gltf) {
        const tree = gltf.scene;
        tree.scale.set(1 * treeScale.X, 1 * treeScale.Y, 1 * treeScale.Z);
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
  })
  .catch((err) => {});
function makeTrees(x, z) {
  return new Promise((resolve, reject) => {
    let tree = treeModel.clone();
    tree.position.set(x, 2 * cubeScale.X * treeScale.Y, z);
    resolve(tree);
  });
}
let enemies = [];
let spawnRate = 100;
let frame = 0;
let treesRight = [];
let treesLeft = [];
function init() {
  document.querySelector(".overlay").style.display = "none";
  myTime.centi = 0;
  myTime.second = 0;
  frame = 0;
  document.querySelector(".centi").innerHTML = "00";

  document.querySelector(".seconds").innerHTML = "00s";

  if (!firstGame) {
    timer();
  }

  spawnRate = 100;
  treeVelocity = 0.07;

  enemyAcc = 0.0;
  enemies = [];
  treesLeft = [];
  treesRight = [];
  const length = scene.children.length;
  for (let i = length - 1; i > 2; i--) {
    scene.remove(scene.children[i]);
  }
  cubeMesh = new Box({
    height: 1 * cubeScale.Y,
    width: 1 * cubeScale.X,
    depth: 1 * cubeScale.Z,
    color: 0x00ff00,
    velocity: { x: 0, y: -0.01, z: 0 },
    position: {
      x: 0,
      y: planeMesh.top + (1 * cubeScale.Y) / 2,
      z: planeMesh.front - 4,
    },
  });
  cubeMesh.castShadow = true;
  scene.add(cubeMesh);

  for (let i = 0; i < (planeMesh.front - planeMesh.back) / 5 + 1; i++) {
    makeTrees(planeMesh.left - 0.5, -i * 5 + planeMesh.front)
      .then((tree) => {
        scene.add(tree);

        treesLeft.push(tree);
        lastTree = tree;
        renderer.render(scene, camera);
      })
      .catch((err) => {});
    makeTrees(planeMesh.right + 0.5, -i * 5 + planeMesh.front)
      .then((tree) => {
        scene.add(tree);

        treesRight.push(tree);
        renderer.render(scene, camera);
        if (
          i === parseInt((planeMesh.front - planeMesh.back) / 5) &&
          !firstGame
        ) {
          setTimeout(() => {
            document.querySelector(".frosted").style.display = "none";
          }, 0);
        }
      })
      .catch((err) => {});
    renderer.render(scene, camera);
  }
  if (!firstGame) {
    animate();
  } else {
    addEventListener("keydown", () => {
      if (firstGame) {
        gameStart = true;
        animate();
        timer();
        playAudioLoop();
        document.querySelector(".press").style.display = "none";
        firstGame = false;
      }
    });
    document.querySelector(".touchScreen").addEventListener("click", () => {
      if (firstGame && isTouchDevice()) {
        gameStart = true;

        animate();
        timer();
        playAudioLoop();
        document.querySelector(".press").style.display = "none";
        document.querySelector(".left").classList.add("left--close");
        document.querySelector(".right").classList.add("right--close");
        setTimeout(() => {
          document.querySelector(".left").innerHTML = "";
          document.querySelector(".right").innerHTML = "";
        }, 1000);
        firstGame = false;
      }
    });
  }
}

function animate() {
  if (frame % 100 === 0) {
    if (enemyAcc < 0.01) enemyAcc += 0.00058;
    if (treeVelocity < 1) treeVelocity += 0.05;
  }
  if (enemyAcc >= 0.01) {
    spawnRate = 15;
  }
  const animationId = requestAnimationFrame(animate);

  cubeMesh.velocity.x = 0;
  cubeMesh.velocity.z = 0;
  frame++;
  if (frame % spawnRate == 0) {
    if (spawnRate > 20) {
      spawnRate -= 5;
    }
    const enemy = new Box({
      height: 1 * cubeScale.Y,
      width: 1 * cubeScale.X,
      depth: 1 * cubeScale.Z,
      color: 0xff0000,
      velocity: { x: 0, y: 0, z: 0.001 },
      position: {
        x:
          (Math.random() - 0.5) *
          (planeMesh.right - planeMesh.left - 1 * cubeScale.X),
        y: 4,
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
      document.querySelector(".press").innerHTML = `You Crashed<br> ${
        isTouchDevice() ? "Double tap to restart" : "Press enter to restart"
      }`;
      document.querySelector(".press").style.display = "block";

      clearInterval(timerId);

      localStorage.setItem("highCenti", highScore.centi);
      localStorage.setItem("highSeconds", highScore.second);

      gameStart = false;
      document.querySelector(".overlay").style.display = "block";
    }
  });
  if (lastTree && lastTree.position.z - planeMesh.back > 5) {
    makeTrees(planeMesh.left - 0.5, planeMesh.back)
      .then((tree) => {
        scene.add(tree);
        // tree.rotateY(Math.PI / 2);
        treesLeft.push(tree);
        lastTree = tree;
      })
      .catch((err) => {});

    makeTrees(planeMesh.right + 0.5, planeMesh.back)
      .then((tree) => {
        scene.add(tree);

        treesRight.push(tree);
      })
      .catch((err) => {});
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
    cubeMesh.velocity.x = -0.2 * cubeScale.X;
  } else if (keys.d.pressed && cubeMesh.right < planeMesh.right) {
    cubeMesh.velocity.x = 0.2 * cubeScale.X;
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
