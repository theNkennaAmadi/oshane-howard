import { Swiper } from "swiper";
import gsap from "gsap";
import * as THREE from "three";
import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

class Test {
  constructor() {
    console.log("hel");
    console.log("kcke, this is amazing, okay really?");
    this.init();
  }

  init() {
    var swiper = new Swiper(".swiper", {
      effect: "cards",
      grabCursor: true,
      autoplay: true,
      initialSlide: 2,
      speed: 400,
      loop: true,
      rotate: true,
      mousewheel: {
        invert: false,
      },
    });
  }
}

class WorkCategory {
  constructor(container) {
    this.container = container;
    this.initVariables();
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

    //this.compose();

    this.render();
  }

  initVariables() {
    this.workItems = [...document.querySelectorAll(".work-cc-item")];
    this.images = this.workItems.map((item) => ({
      name: item.dataset.name,
      slug: `${window.location.origin}/work/${item.dataset.slug}`,
      image: item.querySelector("img").src,
    }));

    this.factor = this.images.length % 2 === 0 ? 0.5 : 0;

    this.GRID_GAP = 1;
    this.TILE_SIZE = 6;
    this.totalSize = this.images.length;
    this.TILE_SPACE = this.TILE_SIZE + this.GRID_GAP;
    this.GRID_SIZE = this.TILE_SPACE * this.totalSize;
    this.TOTAL_GRID_SIZE = this.GRID_SIZE * this.totalSize;

    //image tiles
    this.TILES = [...this.images];

    this.TILES.forEach((tile, index) => {
      tile.pos = [
        0,
        this.TILE_SPACE *
          (-Math.floor(this.TILES.length / 2) + this.factor + index),
        0,
      ];
    });

    this.sortedTitles = this.TILES.toSorted((a, b) => {
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

    console.log(this.sortedTitles);

    // clone groups
    this.TILE_GROUPS = this.TILES.map((tile) => {
      return { pos: [0, 0, 0], name: tile.name };
    });

    this.TILE_GROUPS.forEach((tile, index) => {
      tile.pos = [
        0,
        this.GRID_SIZE *
          (-Math.floor(this.TILE_GROUPS.length / 2) + this.factor + index),
        0,
      ];
    });

    this.reducedMotionMediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    // full screen postprocessing shader
    this.distortionShader = {
      uniforms: {
        tDiffuse: { value: null },
        uStrength: { value: new THREE.Vector2() },
        uScreenRes: { value: new THREE.Vector2() },
        uReducedMotion: {
          value: this.reducedMotionMediaQuery.matches ? 1.0 : 0.0,
        },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    };
  }

  lerp(start, end, amount) {
    return start * (1 - amount) + end * amount;
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
    this.TILE_GROUPS.forEach((obj) => {
      obj.offset = { x: 0, y: 0 };
      obj.group = new THREE.Group();
    });
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.container
      .querySelector("#workCategory")
      .appendChild(this.renderer.domElement);
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
  }

  setupComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    let m = this.distortionShader;
    this.shaderPass = new ShaderPass(new THREE.ShaderMaterial(m), "tDiffuse");
    this.composer.addPass(this.shaderPass);
  }

  addObjects() {
    this.TILES.forEach((tile) => {
      let mesh = new THREE.Mesh();
      let imageTexture = new THREE.TextureLoader().load(tile.image, (tex) => {
        tex.needsUpdate = true;
        mesh.scale.set(
          1.0,
          tex.image.naturalWidth / tex.image.naturalHeight,
          1.0
        );
      });
      let geometry = new THREE.PlaneGeometry(this.TILE_SIZE, this.TILE_SIZE);
      let material = new THREE.MeshBasicMaterial({ map: imageTexture });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...tile.pos);
      this.TILE_GROUPS.forEach((obj) => obj.group.add(mesh.clone()));
    });
    this.TILE_GROUPS.forEach((obj) => this.scene.add(obj.group));
  }

  setPositions() {
    let scrollX = this.scroll?.current.x;
    let scrollY = this.scroll?.current.y;
    this.TILE_GROUPS.forEach(({ offset, pos, group }, i) => {
      let posX = pos[0] + scrollX + offset.x;
      let posY = pos[1] + scrollY + offset.y;
      let dir = this.direction;
      let groupOff = this.GRID_SIZE / 2;

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
        this.TILE_GROUPS[i].offset.x -= this.TOTAL_GRID_SIZE;
      } else if (dir.x > 0 && posX + groupOff < -viewportOff.x) {
        this.TILE_GROUPS[i].offset.x += this.TOTAL_GRID_SIZE;
      }
      // vertical
      if (dir.y < 0 && posY - groupOff > viewportOff.y) {
        this.TILE_GROUPS[i].offset.y -= this.TOTAL_GRID_SIZE;
      } else if (dir.y > 0 && posY + groupOff < -viewportOff.y) {
        this.TILE_GROUPS[i].offset.y += this.TOTAL_GRID_SIZE;
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
    this.distortionShader.uniforms.uScreenRes.value = new THREE.Vector2(
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

  onTouchUp() {
    this.isDown = false;
  }

  onWheel(e) {
    e.preventDefault();
    let normalized = normalizeWheel(e);
    //this.scroll.target.x -= normalized.pixelX * this.scroll.scale;
    this.scroll.target.y += normalized.pixelY * this.scroll.scale;
  }

  onClick() {
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
      let tile = this.TILES.find((tile) => {
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

    if (this.reducedMotionMediaQuery.matches) {
      reducedMotionCheckbox.checked = true;
    }

    reducedMotionCheckbox.addEventListener("change", (e) => {
      this.distortionShader.uniforms.uReducedMotion.value = e.target.checked
        ? 1.0
        : 0.0;
    });
  }

  findCenteredTileGroup() {
    let centeredTileGroupIndex = null;
    let minDistanceToCenter = Infinity;

    this.TILE_GROUPS.forEach((group, index) => {
      let posY = group.group.position.y;

      // Normalize position Y within the total grid range to positive values for easier comparison
      let normalizedPosY =
        ((posY % this.TOTAL_GRID_SIZE) + this.TOTAL_GRID_SIZE) %
        this.TOTAL_GRID_SIZE;

      let percentage = (normalizedPosY % this.GRID_SIZE) / this.GRID_SIZE;

      console.log(percentage);

      if (index === 3) {
        let activeIndex = Math.floor(percentage * this.totalSize);
        let name = this.sortedTitles[activeIndex].name;
        console.log(name);
        document.querySelector(".name").textContent = name;
        //console.log(percentage);
      }

      // Calculate distance from the nearest center position
      let distanceToCenter = Math.min(
        Math.abs(normalizedPosY),
        Math.abs(normalizedPosY - this.GRID_SIZE) % this.GRID_SIZE
      );

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

  compose() {
    console.log(this.composer);
    this.composer.render();
    console.log("hello");
  }

  render() {
    console.log("hello");
    this.findCenteredTileGroup();

    requestAnimationFrame(() => {
      this.scroll.current = {
        x: this.lerp(
          this.scroll.current.x,
          this.scroll.target.x,
          this.scroll.ease
        ),
        y: this.lerp(
          this.scroll.current.y,
          this.scroll.target.y,
          this.scroll.ease
        ),
      };
      //console.log(this.scroll.current.y % TOTAL_GRID_SIZE);
      /*
      let activeIndex =
        Math.round((this.scroll.current.y % this.TOTAL_GRID_SIZE) / this.totalSize) %
        images.length;

       */
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

      this.distortionShader.uniforms.uStrength.value = new THREE.Vector2(
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

export default Test;
