import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Splitting from "splitting";
import ColorThief from "colorthief";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger, Flip);

let currIndex = 0;
let firstrun = true;

const heroVisuals = document.querySelectorAll(".hero-visual-item");
heroVisuals.forEach((visual, index) => {
  visual.style.zIndex = index + 5;
  visual.addEventListener("mouseover", () => {
    if (currIndex !== index || firstrun) {
      showActive(currIndex, index);
      currIndex = index;
    }
    firstrun = false;
  });
});

//Flip the hero visual items from fullscreen to grid
let state = Flip.getState(".hero-visual-list, .hero-visual-item");
document.querySelector(".hero-visual-list").classList.toggle("flip");
Flip.from(state, {
  duration: 2,
  ease: "expo.inOut",
  scrollTrigger: {
    trigger: ".hero-grid",
    start: "top top",
    end: () => "+=200%",
    onEnterBack: () => {
      gsap.to(".hero-visual-item", { pointerEvents: "none" });
      gsap.to(".char", { yPercent: 120, opacity: 0 });
      firstrun = true;
    },
    onLeave: () => {
      gsap.to(".hero-visual-item", { pointerEvents: "auto" });
      gsap.to(".home-works-name-wrapper", { opacity: 1 });
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

/**
 * Text Splitting
 */

function groupItems(array) {
  return Array.from({ length: Math.ceil(array.length / 2) }, (_, i) => {
    return array.slice(i * 2, i * 2 + 2);
  });
}

//Initialize Splitting, split the text into characters and get the results
const targets = [...document.querySelectorAll("[split-text]")];
const results = Splitting({ target: targets, by: "chars" });

//Get all the words and wrap each word in a span
let words = document.querySelectorAll(".word");
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
const charGroups = groupItems(chars);

//Initialize timeline to Show the active names and hide the inactive ones
let tlShowActive = gsap.timeline();
const showActive = (currIndex, index) => {
  tlShowActive.to([...charGroups[currIndex][0]], {
    yPercent: 120,
    opacity: 0.5,
    stagger: {
      amount: 0.1,
      from: "center",
      grid: "auto",
      ease: "linear",
    },
  });
  tlShowActive.to(
    [...charGroups[currIndex][1]],
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
  tlShowActive.to([...charGroups[index][0]], {
    yPercent: 0,
    opacity: 1,
    stagger: {
      amount: 0.1,
      from: "center",
      grid: "auto",
      ease: "linear",
    },
  });
  tlShowActive.to(
    [...charGroups[index][1]],
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
};

class WorkCategory {
  lines = [];
  tl = gsap.timeline();
  topSentinel = document.createElement("div");
  bottomSentinel = document.createElement("div");
  targetElement = null;
  prevIndex = 0;
  currIndex = 1;
  colorThief = new ColorThief();
  tlChangeBG = gsap.timeline();
  constructor(container) {
    this.workContainer = container.querySelector(".t-list");
    //this.workItems = [...this.workContainer.querySelectorAll(".t-item")];
    this.workItems = [...container.querySelectorAll(".work-cc-item")];
    this.worksName = [...container.querySelectorAll(".works-name-item")];
    this.workNum = container.querySelector(".work-num");
    this.workTotal = container.querySelector(".work-total");
    this.sets = [this.workItems];
    this.init();
    /*
    this.getDominantColor();
    this.debouncedShowActiveItem = debounce(
      this.showActiveItem.bind(this),
      200
    );
    this.debouncedChangeBGcolor = debounce(this.changeBGcolor.bind(this), 100);
    this.init();
    this.initLenis();

     */
  }

  init() {
    /*
    this.workTotal.textContent = String(this.worksName.length).padStart(2, "0");
    this.splitText();
    this.getActiveItem();
    gsap.from(".t-item-link", {
      scale: 0,
      opacity: 0.4,
      y: "100%",
      duration: 2,
      ease: "expo.out",
      delay: 0.5,
    });

     */
    this.images = this.workItems.map((item) => ({
      name: item.dataset.name,
      slug: `${window.location.origin}/work/${item.dataset.slug}`,
      image: item.querySelector("img").src,
    }));
    console.log(this.images);
  }

  initLenis() {
    const lenis = new Lenis({
      infinite: true,
    });

    function onRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(onRaf);
    }

    requestAnimationFrame(onRaf);
  }

  splitText() {
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

  getActiveItem() {
    this.workItems.forEach((item, index) => {
      ScrollTrigger.create({
        trigger: item,
        start: "0% 21%",
        end: () => `+=${item.offsetHeight * 0.8}`,
        markers: true,
        onEnter: () => {
          //this.workNum.textContent = String(index + 1).padStart(2, "0");
          console.log(index);
          let newColor = `rgb(${item.dataset.color})`;
          this.debouncedChangeBGcolor(newColor);
          this.debouncedShowActiveItem(item);
        },
        onEnterBack: () => {
          //this.workNum.textContent = String(index + 1).padStart(2, "0");
          console.log(index);
          let newColor = `rgb(${item.dataset.color})`;
          this.debouncedChangeBGcolor(newColor);
          this.debouncedShowActiveItem(item);
        },
      });

      gsap.to(item.querySelector(".t-item-link"), {
        yPercent: -15,
        ease: "linear",
        scrollTrigger: {
          trigger: item,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
  }

  showActiveItem(target) {
    this.currIndex = this.worksName.findIndex((item) => {
      return item.dataset.name === target.dataset.work;
    });

    this.workNum.textContent = String(this.currIndex + 1).padStart(2, "0");

    if (this.currIndex !== this.prevIndex) {
      this.tl.to(this.lines[this.prevIndex], {
        yPercent: 120,
        opacity: 0,
        duration: 0.2,
        /*
        stagger: {
          amount: 0.01,
          from: "start",
          ease: "expo.out",
        },

         */
      });
      this.tl.to(this.lines[this.currIndex], {
        yPercent: 0,
        opacity: 1,
        duration: 0.2,
        /*
        stagger: {
          amount: 0.01,
          from: "start",
          ease: "expo.out",
        },

         */
      });
    }

    this.prevIndex = this.currIndex;
  }

  getDominantColor() {
    const colorThief = new ColorThief();
    const loadPromises = this.workItems.map((item) => {
      return new Promise((resolve) => {
        const img = item.querySelector("img");
        img.crossOrigin = "Anonymous";
        let color;
        if (img.complete) {
          color = colorThief.getColor(img);
          item.setAttribute("data-color", color.join());
          resolve();
        } else {
          img.addEventListener("load", function () {
            color = colorThief.getColor(img);
            //console.log(color);
            item.setAttribute("data-color", color.join());
            resolve();
          });
        }
      });
    });

    Promise.allSettled(loadPromises).then(() => {
      //this.getText();
      //this.infiniteScroll();
      console.log("All images loaded");
    });
  }

  changeBGcolor(newColor) {
    this.tlChangeBG.set(".bg-layer-cover", {
      background: () => `linear-gradient(180deg, #fff 0%, ${newColor} 90%)`,
    });
    this.tlChangeBG.to(".bg-layer-cover", { opacity: 1, duration: 0.2 });
    this.tlChangeBG.to(
      ".works-name-list-wrapper",
      { color: "white", duration: 0.2 },
      "<"
    );
    this.tlChangeBG.set(".bg-layer", {
      background: () => `linear-gradient(180deg, #fff 0%, ${newColor} 90%)`,
    });
    this.tlChangeBG.set(".bg-layer-cover", { opacity: 0 });
  }
}
