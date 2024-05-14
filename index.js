import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const gameOverDisplay = document.getElementById("gameOverDisplay");
const scores = document.getElementById("scores");
const gameOverScore = document.getElementById("score");
let score = 0;

//create renderer
let renderer = new THREE.WebGLRenderer({ antialize: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
//renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//append render to body
document.body.appendChild(renderer.domElement);

//create scene
var scene = new THREE.Scene();

//create camera
var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(6.61, 3.74, 8);
// camera.lookAt(0,0,0)

//create controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// controls.enablePan = false;
// controls.ninDistance = 5;
// controls.maxDistance = 20;
// controls.maxPolarAngle = 0.5;
// controls.maxPolarAngle = 2;
// controls.autoRotate = false;
//controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
};

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color = "#00ff00",
    velocity = {
      x: 0,
      y: 0,
      z: 0,
    },
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    zAcceleration = false,
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({
        color: color,
      })
    );

    this.width = width;
    this.height = height;
    this.depth = depth;
    this.position.set(position.x, position.y, position.z);

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = 0.002;
    this.friction = 0.5;

    this.zAcceleration = zAcceleration;
  }
  setSides() {
    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;
    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }
  update(ground) {
    this.setSides();
    if (this.zAcceleration) {
      this.velocity.z += 0.0003;
    }

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }
  applyGravity(ground) {
    this.velocity.y += -this.gravity;
    if (
      boxCollision({
        box1: this,
        box2: ground,
      })
    ) {
      this.velocity.y *= this.friction;
      this.velocity.y = -this.velocity.y;
    } else {
      this.position.y += this.velocity.y;
    }
  }
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  velocity: {
    x: 0,
    y: -0.02,
    z: 0,
  },
});
cube.position.set(0, 0, 0);
cube.castShadow = true;
scene.add(cube);

const ground = new Box({
  width: 10,
  height: 0.5,
  depth: 50,
  color: "#0369a1",
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});

ground.receiveShadow = true;
scene.add(ground);

const enemies = [];

//create lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight("0xffffff", 10);
directionalLight.position.y = 3;
directionalLight.position.z = 1;
directionalLight.castShadow = true;
scene.add(directionalLight);

//draw screen
let frames = 0;
let spawnRate = 200;
function animate() {
  const animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);
  playerControl();
  cube.update(ground);
  controls.update();
  enemies.forEach((enemy, index) => {
    if (enemy.back >= ground.front) {
      enemies.splice(index, 1);
      score++;
    }

    enemy.update(ground);
    if (boxCollision({ box1: cube, box2: enemy })) {
      gameOverDisplay.classList.add("active");
      cancelAnimationFrame(animationId);
    }
  });
  if (frames % spawnRate === 0) {
    if (spawnRate > 20) {
      spawnRate -= 20;
    }
    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      velocity: {
        x: 0,
        y: -0.02,
        z: 0.01,
      },
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: -20,
      },
      color: "red",
      zAcceleration: true,
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }
  frames++;
  console.log(score);
  scores.innerHTML = score;
  gameOverScore.innerHTML = score;
}
animate();

function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right;
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
  const zCollision = box1.front >= box2.back && box1.back <= box2.front;
  return xCollision && yCollision && zCollision;
}

function playerControl() {
  cube.velocity.x = 0;
  cube.velocity.z = 0;
  if (keys.a.pressed) {
    cube.velocity.x = -0.05;
  }
  if (keys.d.pressed) {
    cube.velocity.x = 0.05;
  }
  if (keys.w.pressed) {
    cube.velocity.z = -0.05;
  }
  if (keys.s.pressed) {
    cube.velocity.z = 0.05;
  }
}

window.addEventListener("keydown", (e) => {
  console.log(e.key);
  if (e.key.toLowerCase() == "a") {
    keys.a.pressed = true;
  }
  if (e.key.toLowerCase() == "d") {
    keys.d.pressed = true;
  }
  if (e.key.toLowerCase() == "w") {
    keys.w.pressed = true;
  }
  if (e.key.toLowerCase() == "s") {
    keys.s.pressed = true;
  }
  if (e.key === "ArrowUp" && cube.position.y < 0.001) {
    cube.velocity.y = 0.1;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key.toLowerCase() == "a") {
    keys.a.pressed = false;
  }
  if (e.key.toLowerCase() == "d") {
    keys.d.pressed = false;
  }
  if (e.key.toLowerCase() == "w") {
    keys.w.pressed = false;
  }
  if (e.key.toLowerCase() == "s") {
    keys.s.pressed = false;
  }
});

// rescale on window resize
window.addEventListener("resize", function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
