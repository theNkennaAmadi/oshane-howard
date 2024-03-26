import gsap from "gsap";
import "splitting/dist/splitting.css";
import Splitting from "splitting";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ColorThief from "colorthief";
import { debounce } from "./global.js";
import Lenis from "@studio-freight/lenis";
import normalizeWheel from "https://cdn.skypack.dev/normalize-wheel@1.0.1";
import {
  EffectComposer,
  RenderPass,
  ShaderPass,
} from "https://cdn.skypack.dev/postprocessing@6.27.0";
import * as THREE from "three";

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
  vertexShader: `varying vec2 vUv;
      void main() {
          vUv = uv;
          vec3 pos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
      }`,
  fragmentShader: `varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform vec2 uStrength;
      uniform vec2 uScreenRes;
      uniform float uReducedMotion;
      float smoothcircle(vec2 st, float r){
          float dist = distance(st, vec2(0.5));
          return 1.0 - smoothstep(0., r, dist);
      }
      void main() {
          vec2 uv = vUv;

          // zoom distortion
          float prox = smoothcircle(uv, 1.);
          float zoomStrength = (uStrength.x+uStrength.y)*10.;
          float maxZoomStrength = uReducedMotion > 0.5 ? 0.2 : 0.5;
          zoomStrength = clamp(zoomStrength, 0., maxZoomStrength);
          vec2 zoomedUv = mix(uv, vec2(0.5), prox*zoomStrength);
          vec4 tex = texture2D(tDiffuse, zoomedUv);

          // rgb shift
          if (uReducedMotion < 0.5) {
              float rgbShiftStrength = (uStrength.x+uStrength.y) * 0.3;
              tex.r = texture2D(tDiffuse, zoomedUv + rgbShiftStrength).r;
              tex.b = texture2D(tDiffuse, zoomedUv - rgbShiftStrength).b;
          }

          gl_FragColor = tex;
      }`,
};

class WorkCategory {
  constructor(container) {
    this.container = container;
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
      let mesh = new THREE.Mesh();
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
      console.log(imageTexture);
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
    e.preventDefault();
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
        console.log(name);
        document.querySelector(".name").textContent = name;
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

export default WorkCategory;

/*

  oItems() {
    /*
    const observer = new IntersectionObserver(
      (entries, observer) => {
        // Detect the scrolling direction
        const isScrollingDown = window.scrollY > lastY;
        lastY = window.scrollY;

        // Filter entries that are currently intersecting and sort them by their top bounding client rect
        const sortedEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        // Choose the right item based on the scrolling direction
        const relevantEntry = isScrollingDown
          ? sortedEntries[0]
          : sortedEntries[sortedEntries.length - 1];

        if (relevantEntry) {
          const newIndex = Array.from(this.workItems).findIndex(
            (item) => item === relevantEntry.target
          );
          if (newIndex !== currentIndex) {
            console.log(
              `Item closest to the top at index ${newIndex} is intersecting.`
            );
            currentIndex = newIndex; // Update the current index
          }
        }
      },
      { rootMargin: "0px", threshold: [0.5] }
    ); // Threshold can be an array to report changes more frequently
    */
/*
this.workItems.forEach((item, index) => {
  ScrollTrigger.create({
    trigger: item,
    start: "10% 25%",
    markers: true,
    onEnter: () => {
      this.workNum.textContent = String(index + 1).padStart(2, "0");
      console.log(index);
      this.debouncedShowActiveItem(index);
    },
    onLeaveBack: () => {
      this.workNum.textContent = String(index + 1).padStart(2, "0");
      console.log(index);
      this.debouncedShowActiveItem(index);
    },
  });
});
}

infiniteScroll() {
  this.workContainer.prepend(this.topSentinel);
  this.workContainer.append(this.bottomSentinel);

  // Create a new IntersectionObserver instance
  const observer = new IntersectionObserver(
      (entries) => {
        const b = entries
            .map((entry) => (entry.isIntersecting ? entry.target : null))
            .filter((entry) => entry !== null); // Filter out null values

        if (b.length > 1) {
          // If b contains more than one element, return the last target element
          this.targetElement = b[b.length - 1];
        } else if (b.length === 1) {
          // If b contains only one element, return that target element
          this.targetElement = b[0];
        }

        if (this.targetElement) {
          console.log(this.targetElement);
          this.debouncedShowActiveItem(this.targetElement);
          gsap.set(".bg-layer", {
            background: `linear-gradient(180deg, #fff 0%, rgb(${this.targetElement.dataset.color}) 90%)`,
            //backgroundColor: "black",
          });

          gsap.set(".page-wrapper", {
            background: `linear-gradient(180deg, #fff 0%, rgb(${this.targetElement.dataset.color}) 90%)`,
            //color: `rgb(${this.targetElement.dataset.color})`,
          });
        }
      },
      {
        // Set the root's margin box as the intersection rectangle, 30% from the top
        rootMargin: "-55% 0px",
      }
  );
  //`rgb(${this.targetElement.dataset.color})`
  // Observe each card
  this.workItems.forEach((card) => {
    observer.observe(card);
  });

  const observerSentinel = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === this.topSentinel) {
              // Clone cards and prepend
              const scrollHeightBefore = this.workContainer.scrollHeight;
              const newSet = this.workItems.map((card) => {
                const clonedCard = card.cloneNode(true);
                this.workContainer.insertBefore(
                    clonedCard,
                    this.topSentinel.nextSibling
                );
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              this.sets.unshift(newSet.toReversed()); // Add the new set to the beginning
              // Adjust scroll position to prevent jump
              this.workContainer.scrollTop +=
                  this.workContainer.scrollHeight - scrollHeightBefore;

              // Remove last set of cards if there are more than 3 sets
              if (this.sets.length > 3) {
                const lastSet = this.sets.pop();
                lastSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            } else if (entry.target === this.bottomSentinel) {
              // Clone cards and append
              const newSet = this.workItems.map((card) => {
                const clonedCard = card.cloneNode(true);
                this.workContainer.insertBefore(
                    clonedCard,
                    this.bottomSentinel
                );
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              this.sets.push(newSet); // Add the new set to the end

              // Remove first set of cards if there are more than 3 sets
              if (this.sets.length > 3) {
                const firstSet = this.sets.shift();
                firstSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            }
          }
        });
      },
      { threshold: 1, rootMargin: "100px" }
  );

  observerSentinel.observe(this.topSentinel);
  observerSentinel.observe(this.bottomSentinel);
}

infinite() {
  const container = document.querySelector(".t-list");
  let cards = Array.from(document.querySelectorAll(".t-item"));
  let sets = [cards]; // Keep track of the sets of cards

  // Create sentinel elements
  const topSentinel = document.createElement("div");
  const bottomSentinel = document.createElement("div");

  container.prepend(topSentinel);
  container.append(bottomSentinel);

  // Create a new IntersectionObserver instance
  const observer = new IntersectionObserver(
      (entries) => {
        const b = entries
            .map((entry) => (entry.isIntersecting ? entry.target : null))
            .filter((entry) => entry !== null); // Filter out null values

        let targetElement = null;

        if (b.length > 1) {
          // If b contains more than one element, return the last target element
          targetElement = b[b.length - 1];
        } else if (b.length === 1) {
          // If b contains only one element, return that target element
          targetElement = b[0];
        }

        if (targetElement) {
          console.log(targetElement);
        }
      },
      {
        // Set the root's margin box as the intersection rectangle, 30% from the top
        rootMargin: "-55% 0px",
      }
  );

  // Observe each card
  cards.forEach((card) => {
    observer.observe(card);
  });

  const observerSentinel = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === topSentinel) {
              // Clone cards and prepend
              const scrollHeightBefore = container.scrollHeight;
              const newSet = cards.map((card) => {
                const clonedCard = card.cloneNode(true);
                container.insertBefore(clonedCard, topSentinel.nextSibling);
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              sets.unshift(newSet); // Add the new set to the beginning
              // Adjust scroll position to prevent jump
              container.scrollTop +=
                  container.scrollHeight - scrollHeightBefore;

              // Remove last set of cards if there are more than 3 sets
              if (sets.length > 3) {
                const lastSet = sets.pop();
                lastSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            } else if (entry.target === bottomSentinel) {
              // Clone cards and append
              const newSet = cards.map((card) => {
                const clonedCard = card.cloneNode(true);
                container.insertBefore(clonedCard, bottomSentinel);
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              sets.push(newSet); // Add the new set to the end

              // Remove first set of cards if there are more than 3 sets
              if (sets.length > 3) {
                const firstSet = sets.shift();
                firstSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            }
          }
        });
      },
      { threshold: 1, rootMargin: "100px" }
  );

  observerSentinel.observe(topSentinel);
  observerSentinel.observe(bottomSentinel);
}
 */
