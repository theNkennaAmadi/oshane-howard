import barba from "@barba/core";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";
import Lenis from "@studio-freight/lenis";

import Projects from "./projects.js";
import Info from "./info.js";
import { Nav, backgroundColorReset } from "./global.js";
import WorkCategory from "./workCategory.js";
import Home from "./index.js";
import LoaderAnimation from "./loader.js";

gsap.registerPlugin(ScrollTrigger, Observer);

let m = null;
let navInstance = new Nav(document.querySelector(".page-wrapper"));

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
    //animation.kill();
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
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        //new Home(nextContainer);
        if (firstLoad) {
          new LoaderAnimation(nextContainer);
        } else {
          gsap.set(".preloader-wrapper, .preloader-line", {
            display: "none",
          });
          let mTL = gsap.timeline({
            onComplete: () => {
              new Home(nextContainer);
            },
          });
          mTL.to(".hero-visual-list", {
            width: "100%",
            height: "100%",
            duration: 1,
            ease: "expo.out",
          });
          mTL.set(".hero-visual-item", { opacity: 1 });
          mTL.from(".hero-text, .nav-wrapper", {
            opacity: 0,
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
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        new Info(nextContainer);
      },
    },
    {
      namespace: "work-category",
      beforeEnter(data) {
        let nextContainer = data.next.container;
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        new WorkCategory(nextContainer);
      },
    },
    {
      namespace: "work",
      beforeEnter(data) {
        let nextContainer = data.next.container;
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        new Projects(nextContainer);
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
        console.log(nextContainer);
        backgroundColorReset(nextContainer);
        //reverse the openTL timeline of the Nav class
        //console.log(navInstance.container);
        //navInstance.navOpenTl.reverse();
        /*
        gsap.to(currentContainer.querySelector(".main"), {
          scale: 0.9,
          duration: 1,
        });

         */
        gsap.fromTo(
          nextContainer,
          { yPercent: 100 },
          { yPercent: 0, duration: 0 }
        );
        return gsap.fromTo(
          nextContainer,
          {
            opacity: 1,
          },
          {
            opacity: 1,
            duration: 1,
          }
        );
      },
    },
  ],
});

window.addEventListener("DOMContentLoaded", () => {
  gsap.set("body", { autoAlpha: 1, ease: "linear", delay: 0.5 });
  gsap.set(":root", {
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
