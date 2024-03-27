import gsap from "gsap";
import "splitting/dist/splitting.css";
import * as THREE from "https://cdn.skypack.dev/-/three@v0.141.0-LAbt1oof2qE22eZZS1lO/dist=es2019,mode=imports/optimized/three.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import normalizeWheel from "https://cdn.skypack.dev/normalize-wheel@1.0.1";
import {
  EffectComposer,
  RenderPass,
  ShaderPass,
} from "https://cdn.skypack.dev/postprocessing@6.27.0";
import fragment from "./fragment.glsl";
import vertex from "./vertex.glsl";
import Splitting from "splitting";
import { debounce } from "./global.js";
import ColorThief from "colorthief";

gsap.registerPlugin(ScrollTrigger);

let workItems = [...document.querySelectorAll(".work-cc-item")];
let images = workItems.map((item) => ({
  name: item.dataset.name,
  slug: `${window.location.origin}/work/${item.dataset.slug}`,
  image: item.querySelector("img").src,
}));

let factor = images.length % 2 === 0 ? 0.5 : 0;

const GRID_GAP = 1;
const TILE_SIZE = 6;
const totalSize = images.length;
const TILE_SPACE = TILE_SIZE + GRID_GAP;
const GRID_SIZE = TILE_SPACE * images.length;
const TOTAL_GRID_SIZE = GRID_SIZE * images.length;
const IMAGE_RES = 1920;
console.log(GRID_SIZE);
console.log(TOTAL_GRID_SIZE);

//image tiles
const TILES = [...images];

TILES.forEach((tile, index) => {
  tile.pos = [
    0,
    TILE_SPACE * (-Math.floor(TILES.length / 2) + factor + index),
    0,
  ];
});

let sortedTitles = TILES.toSorted((a, b) => {
  let aValue = a.pos[1];
  let bValue = b.pos[1];

  // Special handling to ensure 0 comes first
  if (aValue === 0) return -1;
  if (bValue === 0) return 1;

  // For negative numbers, sort in descending order (so that -7 comes before -14)
  if (aValue < 0 && bValue < 0) return bValue - aValue;

  // For positive numbers, also sort in descending order
  if (aValue > 0 && bValue > 0) return bValue - aValue;

  // Ensure negative numbers come before positive numbers
  if (aValue < 0) return -1;
  if (bValue < 0) return 1;
});

console.log(sortedTitles);

// clone groups
const TILE_GROUPS = TILES.map((tile) => {
  return { pos: [0, 0, 0], name: tile.name };
});

TILE_GROUPS.forEach((tile, index) => {
  tile.pos = [
    0,
    GRID_SIZE * (-Math.floor(TILE_GROUPS.length / 2) + factor + index),
    0,
  ];
});

let oldIndex = -1;

const reducedMotionMediaQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

// full screen postprocessing shader
const distortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: new THREE.Vector2() },
    uScreenRes: { value: new THREE.Vector2() },
    uReducedMotion: { value: reducedMotionMediaQuery.matches ? 1.0 : 0.0 },
  },
  vertexShader: vertex,
  fragmentShader: fragment,
};

class App {
  lines = [];
  tl = gsap.timeline();
  targetElement = null;
  prevIndex = 0;
  currIndex = 1;
  colorThief = new ColorThief();
  tlChangeBG = gsap.timeline();
  constructor(container) {
    this.worksName = [...container.querySelectorAll(".works-name-item")];
    this.workNum = container.querySelector(".work-num");
    this.workTotal = container.querySelector(".work-total");
    this.debouncedShowActiveItem = debounce(
      this.showActiveItem.bind(this),
      200
    );
    this.splitText();
    this.init();
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupComposer();

    // this.addSettings();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.resize();
    this.setupListeners();
    this.setupReducedMotionListeners();

    this.render();
  }

  splitText() {
    this.workTotal.textContent = String(this.worksName.length).padStart(2, "0");
    const target = [...document.querySelectorAll("[split-target]")];
    const results = Splitting({ target: target, by: "lines" });
    //console.log(results);
    this.words = document.querySelectorAll(".word");
    gsap.set(this.words, { yPercent: 120, opacity: 0 });
    this.words.forEach((word) => {
      let wrapper = document.createElement("span");
      wrapper.classList.add("char-wrap");
      word.parentNode.insertBefore(wrapper, word);
      wrapper.appendChild(word);
    });
    this.lines = results.map((result) => result.lines);
    //console.log(this.lines);
    // console.log(results);
    gsap.to(".works-name-item", { opacity: 1 });
  }

  showActiveItem(target) {
    this.currIndex = this.worksName.findIndex((item) => {
      return item.dataset.name === target.dataset.name;
    });
    console.log(this.currIndex);

    this.workNum.textContent = String(this.currIndex + 1).padStart(2, "0");

    if (this.currIndex !== this.prevIndex) {
      this.tl.to(this.lines[this.prevIndex], {
        yPercent: 120,
        opacity: 0,
        duration: 0.2,
      });
      this.tl.to(this.lines[this.currIndex], {
        yPercent: 0,
        opacity: 1,
        duration: 0.2,
      });
    }

    this.prevIndex = this.currIndex;
  }

  init() {
    this.direction = {
      x: 1,
      y: 1,
    };
    this.scroll = {
      ease: 0.05,
      scale: 0.02,
      current: {
        x: 0,
        y: 0,
      },
      target: {
        x: 0,
        y: 0,
      },
      last: {
        x: 0,
        y: 0,
      },
    };
    TILE_GROUPS.forEach((obj) => {
      obj.offset = { x: 0, y: 0 };
      obj.group = new THREE.Group();
    });
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    document.body.appendChild(this.renderer.domElement);
    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.camera.position.z = 10;
    // this.camera.position.z = 40;
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.addObjects();
    // this.addLighting();
  }

  setupComposer() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    const shaderPass = new ShaderPass(
      new THREE.ShaderMaterial(distortionShader),
      "tDiffuse"
    );
    this.composer.addPass(shaderPass);
  }

  addObjects() {
    TILES.forEach((tile, i) => {
      let mesh;
      let imageTexture = new THREE.TextureLoader().load(tile.image, (tex) => {
        tex.needsUpdate = true;
        mesh.scale.set(
          1.0,
          tex.image.naturalWidth / tex.image.naturalHeight,
          1.0
        );
      });
      let geometry = new THREE.PlaneBufferGeometry(TILE_SIZE, TILE_SIZE);
      let material = new THREE.MeshBasicMaterial({ map: imageTexture });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...tile.pos);
      TILE_GROUPS.forEach((obj) => obj.group.add(mesh.clone()));
    });
    TILE_GROUPS.forEach((obj) => this.scene.add(obj.group));
  }

  setPositions() {
    let scrollX = this.scroll?.current.x;
    let scrollY = this.scroll?.current.y;
    TILE_GROUPS.forEach(({ offset, pos, group }, i) => {
      let posX = pos[0] + scrollX + offset.x;
      let posY = pos[1] + scrollY + offset.y;
      let dir = this.direction;
      let groupOff = GRID_SIZE / 2;

      let viewportOff = {
        x: this.viewport.width / 2,
        y: this.viewport.height / 2,
      };
      if (i === 4) {
        ///console.log(posY);
      }

      group.position.set(posX, posY, pos[2]);

      // if a group is off screen move it to the opposite side of the entire grid
      // offset is added to the grid position on next call
      // horizontal
      if (dir.x < 0 && posX - groupOff > viewportOff.x) {
        TILE_GROUPS[i].offset.x -= TOTAL_GRID_SIZE;
      } else if (dir.x > 0 && posX + groupOff < -viewportOff.x) {
        TILE_GROUPS[i].offset.x += TOTAL_GRID_SIZE;
      }
      // vertical
      if (dir.y < 0 && posY - groupOff > viewportOff.y) {
        TILE_GROUPS[i].offset.y -= TOTAL_GRID_SIZE;
      } else if (dir.y > 0 && posY + groupOff < -viewportOff.y) {
        TILE_GROUPS[i].offset.y += TOTAL_GRID_SIZE;
      }
    });
  }

  resize() {
    this.screen = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.composer.setSize(this.screen.width, this.screen.height);
    this.camera.aspect = this.screen.width / this.screen.height;
    this.camera.updateProjectionMatrix();

    // mobile
    if (this.screen.width < 768) {
      this.camera.position.z = 20;
      this.scroll.scale = 0.08;
    } else {
      this.camera.position.z = 10;
      this.scroll.scale = 0.02;
    }

    // update screen res uniform
    distortionShader.uniforms.uScreenRes.value = new THREE.Vector2(
      this.screen.width,
      this.screen.height
    );

    // calculate viewport size in world units (not pixel units) 🤯
    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = {
      height,
      width,
    };
    this.setPositions();
  }

  onTouchDown(e) {
    this.isDown = true;
    this.scroll.position = {
      //x: this.scroll.current.x,
      x: 0,
      y: this.scroll.current.y,
    };
    //this.startX = e.touches ? e.touches[0].clientX : e.clientX;
    this.startY = e.touches ? e.touches[0].clientY : e.clientY;
  }

  onTouchMove(e) {
    if (!this.isDown) return;
    //const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    // const distanceX = (this.startX - x) * this.scroll.scale;
    const distanceY = (this.startY - y) * this.scroll.scale;

    this.scroll.target = {
      //x: this.scroll.position.x - distanceX,
      x: 0,
      y: this.scroll.position.y + distanceY,
    };
  }

  onTouchUp(e) {
    this.isDown = false;
  }

  onWheel(e) {
    //e.preventDefault();
    let normalized = normalizeWheel(e);
    //this.scroll.target.x -= normalized.pixelX * this.scroll.scale;
    this.scroll.target.y += normalized.pixelY * this.scroll.scale;
  }

  onClick(e) {
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    for (let i = 0; i < intersects.length; i++) {
      // intersects[i].object is the object that intersected
      // 'click' action can be performed here
      let intersectedObject = intersects[i].object;

      // Find the tile that corresponds to the intersected object
      let tile = TILES.find((tile) => {
        let tilePosition = new THREE.Vector3(...tile.pos);
        return tilePosition.equals(intersectedObject.position);
      });

      // If a tile was found, open the image URL of the tile in a new tab
      if (tile) {
        window.open(tile.url, "_blank");
      }
    }
  }

  setupListeners() {
    window.addEventListener("resize", this.resize.bind(this));

    window.addEventListener("wheel", this.onWheel.bind(this));
    window.addEventListener("mousewheel", this.onWheel.bind(this));

    window.addEventListener("mousedown", this.onTouchDown.bind(this));
    window.addEventListener("mousemove", this.onTouchMove.bind(this));
    window.addEventListener("mouseup", this.onTouchUp.bind(this));

    window.addEventListener("touchstart", this.onTouchDown.bind(this));
    window.addEventListener("touchmove", this.onTouchMove.bind(this));
    window.addEventListener("touchend", this.onTouchUp.bind(this));

    //window.addEventListener("click", this.onClick.bind(this));
  }

  setupReducedMotionListeners() {
    const reducedMotionCheckbox = document.querySelector(
      "#reduced-motion-toggle input"
    );

    if (reducedMotionMediaQuery.matches) {
      reducedMotionCheckbox.checked = true;
    }

    reducedMotionCheckbox.addEventListener("change", (e) => {
      distortionShader.uniforms.uReducedMotion.value = e.target.checked
        ? 1.0
        : 0.0;
    });
  }

  findCenteredTileGroup() {
    let centeredTileGroupIndex = null;
    let minDistanceToCenter = Infinity;

    TILE_GROUPS.forEach((group, index) => {
      let posY = group.group.position.y;

      // Normalize position Y within the total grid range to positive values for easier comparison
      let normalizedPosY =
        ((posY % TOTAL_GRID_SIZE) + TOTAL_GRID_SIZE) % TOTAL_GRID_SIZE;

      let percentage = (normalizedPosY % GRID_SIZE) / GRID_SIZE;

      if (index === 3) {
        let activeIndex = Math.floor(percentage * images.length);
        let name = sortedTitles[activeIndex].name;
        let item = this.worksName.find((item) => item.dataset.name === name);
        //console.log(item);
        if (oldIndex !== activeIndex) {
          this.debouncedShowActiveItem(item);
          oldIndex = activeIndex;
        }
        //console.log(name);
        //document.querySelector(".name").textContent = name;
        //console.log(percentage);
      }

      // Calculate distance from the nearest center position
      let distanceToCenter = Math.min(
        Math.abs(normalizedPosY - 0),
        Math.abs(normalizedPosY - GRID_SIZE) % GRID_SIZE
      );

      if (index === 4) {
        //console.log("Distance to Center:", distanceToCenter);
      }

      // Update the closest tile group to center if this one is closer
      if (distanceToCenter < minDistanceToCenter) {
        minDistanceToCenter = distanceToCenter;
        centeredTileGroupIndex = index;
      }
    });

    // Here you have the index of the tile group that is currently centered
    //console.log("Centered Tile Group Index:", centeredTileGroupIndex);
    // Perform any additional logic with centeredTileGroupIndex
  }

  render() {
    this.composer.render();
    // this.renderer.render(this.scene, this.camera);
    //console.log(TILE_GROUPS[4].group.position.y);
    //console.log(TILE_GROUPS[4].name);
    this.findCenteredTileGroup();

    requestAnimationFrame(() => {
      this.scroll.current = {
        x: lerp(this.scroll.current.x, this.scroll.target.x, this.scroll.ease),
        y: lerp(this.scroll.current.y, this.scroll.target.y, this.scroll.ease),
      };
      //console.log(this.scroll.current.y % TOTAL_GRID_SIZE);
      let activeIndex =
        Math.round((this.scroll.current.y % TOTAL_GRID_SIZE) / images.length) %
        images.length;
      //console.log(sortedTitles[activeIndex].name);

      // vertical dir
      if (this.scroll.current.y > this.scroll.last.y) {
        this.direction.y = -1;
      } else if (this.scroll.current.y < this.scroll.last.y) {
        this.direction.y = 1;
      }
      // horizontal dir
      if (this.scroll.current.x > this.scroll.last.x) {
        this.direction.x = -1;
      } else if (this.scroll.current.x < this.scroll.last.x) {
        this.direction.x = 1;
      }

      distortionShader.uniforms.uStrength.value = new THREE.Vector2(
        Math.abs(
          ((this.scroll.current.x - this.scroll.last.x) / this.screen.width) *
            10
        ),
        Math.abs(
          ((this.scroll.current.y - this.scroll.last.y) / this.screen.width) *
            10
        )
      );

      this.setPositions();

      this.scroll.last = {
        x: this.scroll.current.x,
        y: this.scroll.current.y,
      };

      //console.log(this.scroll.current);
      //console.log(this.scroll.current.y);

      this.render();
    });
  }
}

new App(document.querySelector(".page-wrapper"));

function lerp(start, end, amount) {
  return start * (1 - amount) + end * amount;
}

export default WorkCategory;
