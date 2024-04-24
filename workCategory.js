import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "splitting/dist/splitting.css";
import * as THREE from "https://cdn.skypack.dev/-/three@v0.141.0-LAbt1oof2qE22eZZS1lO/dist=es2019,mode=imports/optimized/three.js";
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
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

gsap.registerPlugin(ScrollTrigger);

class WorkCategory {
  lines = [];
  tl = gsap.timeline();
  targetElement = null;
  prevIndex = null;
  currIndex = 1;
  colorThief = new ColorThief();
  tlChangeBG = gsap.timeline();
  constructor(container) {
    this.container = container;
    this.worksName = [...container.querySelectorAll(".works-name-item")];
    this.invisible = [...container.querySelectorAll(".w-condition-invisible")];
    this.remove();
    this.workNum = container.querySelector(".work-num");
    this.workTotal = container.querySelector(".work-total");
    this.workItems = [...container.querySelectorAll(".work-cc-item")];
    this.images = this.workItems.map((item) => ({
      name: item.dataset.name,
      slug: `${window.location.origin}/work/${item.dataset.slug}`,
      image: item.querySelector("img").src,
      video: item.querySelector("video")?.src,
    }));
    this.debouncedShowActiveItem = debounce(
      this.showActiveItem.bind(this),
      200
    );
    this.loadFont()
    this.initParameters();
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

  loadFont() {
    const loader = new FontLoader();
    loader.load('kaneda_gothic_black_regular.json', (font) => {
      this.font = font;
    });
  }

  remove() {
    this.invisible.map((el) => el.remove());
  }

  initParameters() {
    this.mediaTextures = [];

    this.factor = this.images.length % 2 === 0 ? 0.5 : 0;

    this.GRID_GAP = 1;
    this.TILE_SIZE = 6;
    this.totalSize = this.images.length;
    this.TILE_SPACE = this.TILE_SIZE + this.GRID_GAP;
    this.GRID_SIZE = this.TILE_SPACE * this.images.length;
    this.TOTAL_GRID_SIZE = this.GRID_SIZE * this.images.length;
    //console.log(this.GRID_SIZE);
    //console.log(this.TOTAL_GRID_SIZE);

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

    //console.log(this.sortedTitles);

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

    this.oldIndex = -1;

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

  splitText() {
    this.workTotal.textContent = String(this.worksName.length).padStart(2, "0");
    const target = [...this.container.querySelectorAll("[split-target]")];
    const results = Splitting({ target: target, by: "lines" });
    //console.log(results);
    this.words = this.container.querySelectorAll(".word");
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
    this.activeName = target.dataset.name;

    if (this.mediaTextures[this.currIndex].isVideoTexture) {
      let activeVideos = this.mediaTextures.find((item) => {
        return item.name === this.activeName;
      });
      let inactiveVideos = this.mediaTextures.map((item) => {
        if (item.name !== this.activeName) {
          return item;
        }
      });
      activeVideos.source?.data?.play();
      inactiveVideos?.forEach((item) => {
        item?.source?.data?.pause();
      });
    }

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
    gsap.to('body', {overflow: 'hidden'});
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
    this.container.appendChild(this.renderer.domElement);
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
      new THREE.ShaderMaterial(this.distortionShader),
      "tDiffuse"
    );
    this.composer.addPass(shaderPass);
  }

  addObjects() {
    this.TILES.forEach((tile, i) => {
      // Now add text under each tile
      const textGeo = new TextGeometry(tile.name, {
        font: this.font,
        size: 0.5, // adjust size based on your needs
        height: 0.1, // thickness of the text
        curveSegments: 12
      });

      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const textMesh = new THREE.Mesh(textGeo, textMaterial);

      let isVideo = tile.video && tile.video !== "";

      if (isVideo) {
        let video = document.createElement("video");
        video.crossOrigin = "anonymous"; // Add this line
        const getSrc = async () => {
          await fetch(tile.video, {
            method: "HEAD",
          }).then((response) => {
            // console.log(response.url);
            video.src = response.url;
          });
        };
        getSrc().then(() => {
          video.loop = true;
          video.muted = true;
          video.autoplay = true;
          video.playsInline = true;
          video.poster = `${tile.image}`;
          video.setAttribute("playsinline", "");
          //video.play().catch((e) => console.error("Video play failed", e));
        });
        //video.src = tile.video;

        let texture = new THREE.VideoTexture(video);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;

        texture.name = tile.name;

        this.mediaTextures = [...this.mediaTextures, texture];
        //console.log(this.mediaTextures);

        // Wait for the video to load to adjust UV mapping
        video.onloadedmetadata = () => {
          adjustUVs(mesh, video.videoHeight / video.videoWidth);
          texture.needsUpdate = true;
          //video.play().catch((e) => console.error("Video play failed", e));
        };

        let geometry = new THREE.PlaneBufferGeometry(
          this.TILE_SIZE,
          this.TILE_SIZE
        );
        let material = new THREE.MeshBasicMaterial({ map: texture });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...tile.pos);
        mesh.userData = { slug: tile.slug };
        // Position the text under the tile
        textMesh.position.x = tile.pos[0]; // align horizontally with tile
        textMesh.position.y = tile.pos[1] - 1; // adjust vertical position to be under the tile
        textMesh.position.z = tile.pos[2];
        this.TILE_GROUPS.forEach((obj) => obj.group.add(mesh.clone()));
      } else {
        new THREE.TextureLoader().load(tile.image, (tex) => {
          let geometry = new THREE.PlaneBufferGeometry(
            this.TILE_SIZE,
            this.TILE_SIZE
          );
          this.mediaTextures = [...this.mediaTextures, tex];
          let material = new THREE.MeshBasicMaterial({ map: tex });
          let mesh = new THREE.Mesh(geometry, material);
          adjustUVs(mesh, tex.image.height / tex.image.width);
          mesh.position.set(...tile.pos);
          mesh.userData = { slug: tile.slug };

          // Position the text under the tile
          textMesh.position.x = tile.pos[0]; // align horizontally with tile
          textMesh.position.y = tile.pos[1] - 1; // adjust vertical position to be under the tile
          textMesh.position.z = tile.pos[2];

          this.TILE_GROUPS.forEach((obj) => obj.group.add(mesh.clone()));
        });
      }
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
    e.preventDefault();

    // Update the mouse position
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    for (let i = 0; i < intersects.length; i++) {
      // Check if the intersected object is a mesh
      if (intersects[i].object instanceof THREE.Mesh) {
        // Navigate to the URL specified in the slug property of the userData of the mesh
        //window.location.href = intersects[i].object.userData.slug;
        window.open(intersects[i].object.userData.slug, "_self");
        break;
      }
    }
  }

  onMouseMove(e) {
    // Update the mouse position
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    // Check if the mouse is over a mesh
    if (intersects.length > 0 && intersects[0].object instanceof THREE.Mesh) {
      // Change the cursor style to pointer
      document.body.style.cursor = "pointer";
    } else {
      // Change the cursor style to default
      document.body.style.cursor = "default";
    }
  }

  setupListeners() {
    window.addEventListener("resize", this.resize.bind(this));

    window.addEventListener("wheel", this.onWheel.bind(this));
    window.addEventListener("mousewheel", this.onWheel.bind(this));

    window.addEventListener("mousedown", this.onTouchDown.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("mouseup", this.onTouchUp.bind(this));

    window.addEventListener("touchstart", this.onTouchDown.bind(this));
    window.addEventListener("touchmove", this.onTouchMove.bind(this));
    window.addEventListener("touchend", this.onTouchUp.bind(this));

    window.addEventListener("click", this.onClick.bind(this));
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
      let adjusted = this.factor === 0 ? 0.05 : 0;
      percentage = Math.min(percentage + adjusted, 0.991)
      console.log(percentage)


      if (index === 3) {
        let activeIndex = Math.floor((percentage > 0.99 ? 0 : percentage) * this.images.length);
        let name = this.sortedTitles[activeIndex].name;
        let item = this.worksName.find((item) => item.dataset.name === name);
        //console.log(item);
        if (this.oldIndex !== activeIndex) {
          this.debouncedShowActiveItem(item);
          this.oldIndex = activeIndex;
        }
        //console.log(name);
        //document.querySelector(".name").textContent = name;
        //console.log(percentage);
      }


      // Calculate distance from the nearest center position
      let distanceToCenter = Math.min(
        Math.abs(normalizedPosY - 0),
        Math.abs(normalizedPosY - this.GRID_SIZE) % this.GRID_SIZE
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
    this.findCenteredTileGroup();

    requestAnimationFrame(() => {
      this.scroll.current = {
        x: lerp(this.scroll.current.x, this.scroll.target.x, this.scroll.ease),
        y: lerp(this.scroll.current.y, this.scroll.target.y, this.scroll.ease),
      };
      //console.log(this.scroll.current.y % TOTAL_GRID_SIZE);
      let activeIndex =
        Math.round(
          (this.scroll.current.y % this.TOTAL_GRID_SIZE) / this.images.length
        ) % this.images.length;


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

      this.render();
    });
  }
}

function lerp(start, end, amount) {
  return start * (1 - amount) + end * amount;
}

function adjustUVs(mesh, textureAspectRatio) {
  let geometry = mesh.geometry;
  geometry.computeBoundingBox();
  let uvAttribute = geometry.attributes.uv;

  for (let j = 0; j < uvAttribute.count; j++) {
    let u = uvAttribute.getX(j);
    let v = uvAttribute.getY(j);

    if (textureAspectRatio > 1) {
      // Texture is wider than it is tall
      let offset = (1 - 1 / textureAspectRatio) / 2;
      v = v / textureAspectRatio + offset;
    } else {
      // Texture is taller than it is wide
      let offset = (1 - textureAspectRatio) / 2;
      u = u * textureAspectRatio + offset;
    }

    uvAttribute.setXY(j, u, v);
  }
  uvAttribute.needsUpdate = true;
}

export default WorkCategory;

/*
 addObjects() {
    this.TILES.forEach((tile, i) => {
      let imageTexture = new THREE.TextureLoader().load(tile.image, (tex) => {
        tex.needsUpdate = true;

        // Create the geometry, material, and mesh after the texture has loaded
        let geometry = new THREE.PlaneBufferGeometry(
          this.TILE_SIZE * (tex.image.naturalWidth / tex.image.naturalHeight),
          this.TILE_SIZE // Set the height to a constant value
        );
        let material = new THREE.MeshBasicMaterial({ map: imageTexture });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...tile.pos);
        mesh.userData = { slug: tile.slug };
        this.TILE_GROUPS.forEach((obj) => obj.group.add(mesh.clone()));
      });
    });
    this.TILE_GROUPS.forEach((obj) => this.scene.add(obj.group));
  }
 */

//console.log(this.mediaTextures[this.currIndex].source);
//this.mediaTextures[this.currIndex - 1].source.data.load();
//this.mediaTextures[this.currIndex - 1].source.data.play();
//this.mediaTextures[this.prevIndex - 1]?.source?.data?.pause();
