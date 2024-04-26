import barba from "@barba/core";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.config({
  nullTargetWarn: false,
});

import Projects from "./projects.js";
import Info from "./info.js";
import { Nav, backgroundColorReset } from "./global.js";
import WorkCategory from "./workCategory.js";
import Home from "./index.js";
import LoaderAnimation from "./loader.js";

gsap.registerPlugin(ScrollTrigger);

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
  /*
  if (data.current.container.dataset.barbaNamespace === "home") {
    document.querySelectorAll(".hero-visual-item").forEach((item) => {
      item.removeAttribute("data-flip-id");
      console.log(item);
    });
  }

   */

  Flip.killFlipsOf(data.current.container);
  gsap.getTweensOf("*").forEach((animation) => {
    animation.revert();
    animation.kill();
  });
  ScrollTrigger.clearScrollMemory();


  //ScrollTrigger.removeEventListener("scrollEnd", gallerySnap);
  //Observer.getAll().forEach((o) => o.kill());
  //ScrollTrigger.killAll();

  ScrollTrigger.getAll().forEach((t) => t.kill());
  ScrollTrigger.refresh();
  window.dispatchEvent(new Event("resize"));
  Draggable.get(".hero-visual-list-wrapper").kill();



  window.scroll(0, 0);
  if (history.scrollRestoration) {
    history.scrollRestoration = "manual";
  }
  //lenis.destroy();
});

let firstLoad = true;

barba.init({
  preventRunning: true,
  views: [
    {
      namespace: "home",
      afterEnter(data) {
        ScrollTrigger.clearScrollMemory();
        let nextContainer = data.next.container;
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        //new Home(nextContainer);
        if (firstLoad && !sessionStorage.getItem("firstLoad")) {
          new LoaderAnimation(nextContainer);
          firstLoad = false;
          sessionStorage.setItem("firstLoad", "false");
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
            duration: 0.75,
            ease: "expo.out",
          });
          mTL.set(".hero-visual-item", { opacity: 1 });
          mTL.from(".hero-text, .nav-wrapper", {
            opacity: 0,
            duration: 0.75,
            ease: "power3.inOut",
          })
        .to(".scroll-indicator", {clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", margin: "0 0", duration: 1, ease: "expo.out"}, "<0.5" )
          //sessionStorage.setItem("firstLoad", "false");
        }
      },
    },
    {
      namespace: "info",
      afterEnter(data) {
        ScrollTrigger.clearScrollMemory();
        let nextContainer = data.next.container;
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        new Info(nextContainer);
      },
    },
    {
      namespace: "work-category",
      afterEnter(data) {
        ScrollTrigger.clearScrollMemory();
        let nextContainer = data.next.container;
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        new WorkCategory(nextContainer);
      },
    },
    {
      namespace: "work",
      afterEnter(data) {
        ScrollTrigger.clearScrollMemory();
        let nextContainer = data.next.container;
        backgroundColorReset(nextContainer);
        navInstance = new Nav(nextContainer);
        new Projects(nextContainer);
        window.Webflow && window.Webflow.ready();
        window.Webflow && window.Webflow.require("ix2").init();
      },
    },
    {
      namespace: "404",
      beforeEnter() {},
    }
  ],
  transitions: [
    {
      sync: true, //keep the previous and next container on the page at the same time
      enter(data) {
        let nextContainer = data.next.container;
        //let currentContainer = data.current.container;
        nextContainer.classList.add('fixed')
        window.scroll(0, 0);
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

        /*
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
        */
      },
      afterEnter(data) {
        let nextContainer = data.next.container;
        nextContainer.classList.remove('fixed')
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