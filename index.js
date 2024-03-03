import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, Flip, SplitText);
class Home {
  constructor(container) {
    this.container = container;
    this.homeWorks = container.querySelector("#homeWorks");
    this.heroVisualList = container.querySelector(".hero-visual-list");
    this.heroVisuals = container.querySelectorAll(".hero-visual-item");
    this.homeWorksText = container.querySelectorAll(".home-works-name-item");
    this.animateTL();
  }
  init() {
    document.addEventListener("click", () => {
      console.log("clicked");
      let homeMedia = [...document.querySelectorAll(".home-works-media")];
      const state = Flip.getState(".hero-visual");
      document
        .querySelector(".home-works-media")
        .appendChild(document.querySelector(".hero-visual"));
      Flip.from(state, {
        duration: 3,
        absolute: true,
        ease: "linear",
      });
    });
  }

  flip() {
    /*
    let state = Flip.getState(this.heroVisuals);
    this.heroVisualList.classList.toggle("flipped");
    this.heroVisuals.forEach((visual) => {
      visual.classList.toggle("flipped");
    });
    Flip.from(state, {
      duration: 2,
      stagger: 0.1,
      ease: "expo.out",
      absolute: true,
    });

     */
  }

  animateTL() {
    let tl = gsap.timeline({ paused: true });
    tl.to(".hero-text", { opacity: 0 });
    tl.to(".page-wrapper", { color: "#000" }, "<");

    const heroVisuals = this.heroVisuals;
    const heroVisualList = this.heroVisualList;
    let enter = false;

    heroVisuals.forEach((visual, index) => {
      visual.style.zIndex = index + 1;
    });

    ScrollTrigger.create({
      trigger: ".hero-grid",
      pin: ".hero-grid",
      scrub: true,
      end: `+=200%`,
      markers: true,
      onUpdate: (self) => {
        if (self.progress * 100 > 10) {
          if (enter === false) {
            flip();
            tl.play();
            enter = true;
          }
        } else if (self.progress * 100 < 5) {
          if (enter === true) {
            flip();
            tl.reverse();
            enter = false;
            gsap.to(".hero-visual-list-wrapper", {
              x: `0%`,
              y: `0%`,
              ease: "none",
              duration: 0.5,
            });
          }
        }
      },
    });

    function flip() {
      let state = Flip.getState(heroVisuals);
      heroVisualList.classList.toggle("flipped");
      const flipTL = Flip.from(state, {
        ease: "expo.out",
        simple: true,
        absolute: true,
        duration: 1,
      });
    }

    const getMousePositionPercentage = (mousePosition, maxPosition) => {
      return (mousePosition / maxPosition) * 100;
    };

    document.addEventListener("mousemove", (e) => {
      if (enter) {
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
        gsap.to(".hero-visual-list-wrapper", {
          x: `${moveX}%`,
          y: `${moveY}%`,
          ease: "none",
          duration: 0.5,
        });
      }
    });

    /*
    let mySplitText = new SplitText("[split-text]", {
      type: "chars,words,lines",
      charsClass: "chars",
    });
    let chars = mySplitText.chars; //an array of all the divs that wrap each character
    console.log(chars);

    gsap.set(chars, { yPercent: 130 });

    heroVisuals.forEach((item, index) => {
      const tl = gsap.timeline({ paused: true });
      tl.to(this.homeWorksText[index].querySelectorAll(".chars"), {
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
        .to(heroVisuals, { opacity: 0.5, duration: 0.5 }, "<")
        .to(item, { opacity: 1, outlineColor: "#000", duration: 0.5 }, "<");
      item.addEventListener("mouseenter", () => {
        tl.timeScale(1);
        if (enter) {
          tl.play();
        }
      });
      item.addEventListener("mouseleave", () => {
        tl.timeScale(3);
        tl.reverse();
      });
    });

     */
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
