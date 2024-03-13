import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Splitting from "splitting";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(ScrollTrigger, Flip, Draggable);
class Home {
  currIndex = 0;
  firstrun = true;
  tlShowActive = gsap.timeline();
  constructor(container) {
    this.container = container;
    this.heroVisualListWrapper = container.querySelector(
      ".hero-visual-list-wrapper"
    );
    this.heroVisualList = container.querySelector(".hero-visual-list");
    this.heroVisuals = [...container.querySelectorAll(".hero-visual-item")];
    this.heroGrid = container.querySelector(".hero-grid");
    this.init();
  }

  //Helper function to group Array
  groupItems(array) {
    return Array.from({ length: Math.ceil(array.length / 2) }, (_, i) => {
      return array.slice(i * 2, i * 2 + 2);
    });
  }

  init() {
    //create visual highlighters
    this.visualHighlight = document.createElement("div");
    this.visualInner = document.createElement("div");
    this.visualHighlight.classList.add("visual-highlight");
    this.visualInner.classList.add("visual-inner");
    this.visualHighlight.appendChild(this.visualInner);

    this.initSplitting();
    this.initFlip();
    this.addVisualsEventListeners();
  }

  initSplitting() {
    //Initialize Splitting, split the text into characters and get the results
    const targets = [...this.container.querySelectorAll("[split-text]")];
    const results = Splitting({ target: targets, by: "chars" });

    //Get all the words and wrap each word in a span
    let words = this.container.querySelectorAll(".word");
    words.forEach((word) => {
      let wrapper = document.createElement("span");
      wrapper.classList.add("char-wrap");
      word.parentNode.insertBefore(wrapper, word);
      wrapper.appendChild(word);
    });

    //Get all the characters and move them off the screen
    let chars = results.map((result) => result.chars);
    gsap.set(chars, { yPercent: 120, opacity: 0 });

    //Group the characters into pairs because we have one for title and one for category, we need this for accurate index
    this.charGroups = this.groupItems(chars);
  }

  initFlip() {
    let firstrun = this.firstrun;
    let updatedText = false;

    //hide the Oshane logo text and change nav color to black
    let tlUpdate = gsap.timeline({ paused: true });
    tlUpdate.set(".hero-text", { display: "none" });
    tlUpdate.to(".nav-wrapper", { color: "black" });

    //Flip the hero visual items from fullscreen to grid
    let state = Flip.getState(".hero-visual-list, .hero-visual-item");
    document.querySelector(".hero-visual-list").classList.toggle("flip");
    Flip.from(state, {
      duration: 2,
      ease: "expo.inOut",
      simple: true,
      scrollTrigger: {
        trigger: ".hero-grid",
        start: "top top",
        end: () => "+=200%",
        onUpdate: (self) => {
          if (self.progress > 0.4) {
            if (!updatedText) {
              tlUpdate.play();
              updatedText = !updatedText;
            }
          } else {
            if (updatedText) {
              tlUpdate.reverse();
              updatedText = !updatedText;
            }
          }
        },
        onEnterBack: () => {
          Draggable.get(".hero-visual-list-wrapper").kill();
          gsap.to(".hero-visual-list-wrapper", {
            x: 0,
            y: 0,
            duration: 1,
            ease: "power3.inOut",
          });
          gsap.to(".hero-visual-item", { pointerEvents: "none" });
          gsap.to(".char", { yPercent: 120, opacity: 0 });
          firstrun = true;
        },
        onLeave: () => {
          gsap.to(".hero-visual-item", { pointerEvents: "auto" });
          gsap.to(".home-works-name-wrapper", { opacity: 1 });
          this.activateDraggable();
        },
        pin: true,
        scrub: 1,
        markers: true,
      },
    });

    //Scale the hero list wrapper so that it looks like it's zooming in
    gsap.to(".hero-visual-list-wrapper", {
      scale: 1.2,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".hero-visual",
        start: "top top",
        end: () => "+=200%",
        scrub: 1,
      },
    });
  }

  addVisualsEventListeners() {
    this.heroVisuals.forEach((visual, index) => {
      let oItems = this.heroVisuals.filter((item) => item !== visual);

      let tl = gsap.timeline({ paused: true });
      tl.fromTo(
        visual,
        { scale: 1, opacity: 1, ease: "expo.inOut", duration: 0.8 },
        {
          scale: 1.1,
          opacity: 1,
          duration: 0.8,
          force3D: true,
          ease: "expo.inOut",
        }
      );
      tl.fromTo(
        oItems,
        { scale: 1, opacity: 1, ease: "expo.inOut", duration: 0.8 },
        {
          scale: 1,
          opacity: 0.4,
          duration: 0.8,
          ease: "expo.inOut",
          force3D: true,
        },
        "<"
      );

      //visual.style.zIndex = index + 5;
      visual.addEventListener("mouseover", () => {
        if (this.currIndex !== index || this.firstrun) {
          this.showActiveNames(this.currIndex, index);
          this.currIndex = index;
        }
        this.firstrun = false;
        this.showHighlight(index);
        tl.play();
      });
      visual.addEventListener("mouseout", () => {
        tl.reverse();
      });
    });
  }

  showActiveNames(currIndex, index) {
    this.tlShowActive.to([...this.charGroups[currIndex][0]], {
      yPercent: 120,
      opacity: 0.5,
      stagger: {
        amount: 0.1,
        from: "center",
        grid: "auto",
        ease: "linear",
      },
    });
    this.tlShowActive.to(
      [...this.charGroups[currIndex][1]],
      {
        yPercent: 120,
        opacity: 0.5,
        stagger: {
          amount: 0.1,
          from: "center",
          grid: "auto",
          ease: "linear",
        },
      },
      "<"
    );
    this.tlShowActive.to([...this.charGroups[index][0]], {
      yPercent: 0,
      opacity: 1,
      stagger: {
        amount: 0.1,
        from: "center",
        grid: "auto",
        ease: "linear",
      },
    });
    this.tlShowActive.to(
      [...this.charGroups[index][1]],
      {
        yPercent: 0,
        opacity: 1,
        stagger: {
          amount: 0.1,
          from: "center",
          grid: "auto",
          ease: "linear",
        },
      },
      "<"
    );
  }

  showHighlight(index) {
    let state = Flip.getState(this.visualHighlight, this.heroVisuals);
    this.heroVisuals[index].appendChild(this.visualHighlight);
    Flip.from(state, {
      duration: 0.5,
      ease: "expo.out",
    });
  }

  activateDraggable() {
    Draggable.create(".hero-visual-list-wrapper", {
      type: "x,y",
      bounds: ".hero-grid",
      inertia: true,
      ease: "expo.out",
    });
  }
}

export default Home;

/*
const homeWorks = document.querySelector("#homeWorks");

// Function to calculate percentage
const getMousePositionPercentage = (mousePosition, maxPosition) => {
  return (mousePosition / maxPosition) * 100;
};

// Mouse move event listener

document.body.addEventListener("mousemove", (e) => {
  // Get mouse position as a percentage of the window's width and height
  const mouseXPercentage = getMousePositionPercentage(
    e.clientX,
    window.innerWidth
  );
  const mouseYPercentage = getMousePositionPercentage(
    e.clientY,
    window.innerHeight
  );

  // Calculate the movement for the div
  const moveX = gsap.utils.mapRange(0, 100, 20, -20, mouseXPercentage);
  const moveY = gsap.utils.mapRange(0, 100, 30, -30, mouseYPercentage);

  // Animate the div position using GSAP
  gsap.to(".home-works-wrapper", {
    x: `${moveX}%`,
    y: `${moveY}%`,
    ease: "none",
    duration: 0.5,
  });const mouseXPercentage = getMousePositionPercentage(
    e.clientX,
    window.innerWidth
  );
  const mouseYPercentage = getMousePositionPercentage(
    e.clientY,
    window.innerHeight
  );

  // Calculate the movement for the div
  const moveX = gsap.utils.mapRange(0, 100, 20, -20, mouseXPercentage);
  const moveY = gsap.utils.mapRange(0, 100, 30, -30, mouseYPercentage);

  // Animate the div position using GSAP
  gsap.to(".home-works-wrapper", {
    x: `${moveX}%`,
    y: `${moveY}%`,
    ease: "none",
    duration: 0.5,
  });
});

/*
});

/*
Draggable.create("#home-works", {
  type: "x,y",
  bounds: { minX: -760, maxX: 760, minY: -500, maxY: 500 },
  onDrag: function () {
    console.log("hello");
    // Get drag position as a percentage of the window's width and height
    const dragXPercentage = getMousePositionPercentage(
      this.x,
      window.innerWidth
    );
    const dragYPercentage = getMousePositionPercentage(
      this.y,
      window.innerHeight
    );

    // Calculate the movement for the div
    const moveX = gsap.utils.mapRange(0, 100, 20, -20, dragXPercentage);
    const moveY = gsap.utils.mapRange(0, 100, 20, -20, dragYPercentage);
    console.log(moveX, moveY);

    // Update the div position
    gsap.to(".home-works-wrapper", {
      x: `${moveX}%`,
      y: `${moveY}%`,
      ease: "none",
      duration: 0.5,
    });
  },
});

 */

/*
let mySplitText = new SplitText("[split-text]", {
  type: "chars,words,lines",
  charsClass: "chars",
});
let chars = mySplitText.chars; //an array of all the divs that wrap each character
console.log(chars);

gsap.set(chars, { yPercent: 130 });

const homeWorksItem = document.querySelectorAll(".home-works-item");
const homeWorksText = document.querySelectorAll(".home-works-name-item");

homeWorksItem.forEach((item, index) => {
  const tl = gsap.timeline({ paused: true });
  tl.to(homeWorksText[index].querySelectorAll(".chars"), {
    yPercent: 0,
    stagger: {
      // wrap advanced options in an object
      amount: 0.3,
      from: "center",
      grid: "auto",
      ease: "power1.inOut",
    },
  })
    .to(
      item,
      {
        scale: 1.3,
        duration: 0.5,
        ease: "power2.out",
      },
      "<"
    )
    .to(homeWorksItem, { opacity: 0.5, duration: 0.5 }, "<")
    .to(item, { opacity: 1, outlineColor: "#000", duration: 0.5 }, "<");
  item.addEventListener("mouseenter", () => {
    tl.timeScale(1);
    tl.play();
  });
  item.addEventListener("mouseleave", () => {
    tl.timeScale(3);
    tl.reverse();
  });
});
*/

/*
  animateTL() {
    const heroVisuals = this.heroVisuals;
    const heroVisualList = this.heroVisualList;
    let state = Flip.getState(heroVisuals);
    heroVisualList.classList.toggle("flipped");
    const flipTL = Flip.from(state, {
      ease: "none",
      simple: true,
      absolute: true,
      duration: 1,
    });
    ScrollTrigger.create({
      trigger: ".hero-visual",
      pin: ".hero-visual",
      scrub: true,
      end: `+=1000%`,
      animation: flipTL,
      markers: true,
    });
  }
 */
