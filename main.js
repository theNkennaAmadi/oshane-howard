import barba from "@barba/core";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";
import Swiper from "swiper";
import Lenis from "@studio-freight/lenis";
import ColorThief from "colorthief";

let col = new ColorThief();
console.log(col);

import Projects from "./projects.js";
import Info from "./info.js";
import MainNav from "./utils.js";
import WorkCategory from "./workCategory.js";
import Home from "./index.js";
import LoaderAnimation from "./Loader.js";

gsap.registerPlugin(ScrollTrigger, Observer);

let m = null;

/**
 * Lenis Initialization
 *
 */

/*
const lenis = new Lenis();

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

 */

barba.hooks.beforeLeave((data) => {
  gsap.getTweensOf("*").forEach((animation) => {
    animation.kill();
  });
  ScrollTrigger.clearScrollMemory();
  //ScrollTrigger.removeEventListener("scrollEnd", gallerySnap);
  Observer.getAll().forEach((o) => o.kill());
  ScrollTrigger.getAll().forEach((t) => t.kill());

  window.scroll(0, 0);
  if (history.scrollRestoration) {
    history.scrollRestoration = "manual";
  }
});

let firstLoad = false;

barba.init({
  preventRunning: true,
  views: [
    {
      namespace: "home",
      beforeEnter(data) {
        let nextContainer = data.next.container;
        let bgColor = getComputedStyle(nextContainer).backgroundColor;
        gsap.to("body", { backgroundColor: bgColor, duration: 1 });
        new MainNav(nextContainer);
        new Home(nextContainer);
        if (firstLoad) {
          new LoaderAnimation(nextContainer);
        } else {
          gsap.set(".preloader-wrapper, .preloader-line", {
            display: "none",
          });
          //gsap.set)
          let mTL = gsap.timeline();
          mTL.to(".hero-visual-list", {
            width: "100%",
            height: "100%",
            duration: 1,
            ease: "expo.out",
          });
          mTL.set(".hero-visual-item", { opacity: 1 });
          mTL.to(".hero-text, .nav-wrapper", {
            opacity: 1,
            duration: 1,
            ease: "power3.inOut",
          });
        }
      },
    },
    {
      namespace: "info",
      beforeEnter(data) {
        let nextContainer = data.next.container;
        let bgColor = getComputedStyle(nextContainer).backgroundColor;
        gsap.to("body", { backgroundColor: bgColor, duration: 1 });
        new Info(nextContainer);
        new MainNav(nextContainer);
      },
    },
    {
      namespace: "work-category",
      beforeEnter(data) {
        let nextContainer = data.next.container;
        let bgColor = getComputedStyle(nextContainer).backgroundColor;
        gsap.to("body", { backgroundColor: bgColor, duration: 1 });
        new MainNav(nextContainer);
        new WorkCategory(nextContainer);
      },
    },
    {
      namespace: "work",
      beforeEnter(data) {
        let nextContainer = data.next.container;
        let bgColor = getComputedStyle(nextContainer).backgroundColor;
        gsap.to("body", { backgroundColor: bgColor, duration: 1 });
        new Projects(nextContainer);
        new MainNav(nextContainer);
      },
    },
    {
      namespace: "404",
      beforeEnter() {},
    },
  ],
  transitions: [
    {
      sync: true, //keep the previous and next container on the page at the same time
      enter(data) {
        let nextContainer = data.next.container;
        let currentContainer = data.current.container;
        gsap.set(currentContainer, { opacity: 0.4, duration: 1 });
        return gsap.fromTo(
          nextContainer,
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          },
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            ease: "expo.inOut",
            duration: 2,
          }
        );
      },
    },
  ],
});

window.addEventListener("DOMContentLoaded", () => {
  gsap.from("body", { autoAlpha: 0, duration: 0.5, ease: "linear" });
  gsap.to(":root", {
    duration: 0.3,
    delay: window.location.pathname === "/" ? 5 : 0,
    ease: "power1.out",
    "--visual-hidden": 1, // Targeting the CSS variable
  });
});

/*
window.addEventListener("DOMContentLoaded", () => {
  console.log(document.querySelector("img"));
  let img = document.querySelector(".t-wrapper").querySelector("img");
  img.crossOrigin = "Anonymous";

  if (img.complete) {
    console.log("loaded");
    const a = col.getColor(img);
    console.log(a);
  } else {
    img.addEventListener("load", function () {
      console.log("loam");
      let b = col.getColor(img);
      console.log(b);
    });
  }
});
*/
