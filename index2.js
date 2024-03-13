import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Splitting from "splitting";

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
