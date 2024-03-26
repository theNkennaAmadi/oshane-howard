import { Item } from "./item.js";
import gsap from "gsap";
import Odometer from "odometer";
import "odometer/themes/odometer-theme-default.css";
import Home from "./index.js";

class LoaderAnimation {
  items = []; // Array to store instances of the Item class
  tl = null;
  animationSettings = {
    duration: 1.4, // Duration of the animation
    ease: "power3.inOut", // Type of easing to use for the animation transition
    delayFactor: 0.2, // Delay between each item's animation
  };
  constructor(container) {
    this.container = container;
    this.DOMlayers = container.querySelector(".hero-visual-list-wrapper");
    this.DOMItems = [...this.DOMlayers.querySelectorAll(".hero-link")];
    this.init();
  }

  init() {
    this.DOMItems.forEach((item, index) => {
      this.items.push(new Item(item)); // Initializing a new object for each item
      item.style.zIndex = index + 5; // Setting the z-index of each item
    });
    gsap.set(".preloader-wrapper > *", { opacity: 1 });
    this.odometer();
  }

  odometer() {
    window.odometerOptions = {
      duration: 10000, // Change how long the javascript expects the CSS animation to take
    };
    let odometer = new Odometer({
      // el tells the odometer script which element should be the odometer
      el: this.container.querySelector(".odometer"),
      // value tells the odometer script what the start value should be
      value: 0,
      // Change how digit groups are formatted, and how many digits
      // are shown after the decimal point
      // Change how long the javascript expects the CSS animation to take
    });
    odometer.render(0);
    odometer.update(100);
    const odTL = gsap.timeline();

    odTL.to(".preloader-wrapper", {
      x: "-65%",
      duration: 2.5,
      delay: 2,
      willChange: "transform",
      ease: "expo.out",
      onStart: () => this.animate(),
    });
    odTL.to(
      ".preloader-line",
      {
        width: "65%",
        duration: 2.5,
        ease: "expo.out",
      },
      "<"
    );
    odTL.to(
      ".preloader-wrapper",
      {
        x: "-120%",
        opacity: 0,
        duration: 1,
        ease: "expo.in",
      },
      "<2.5"
    );
    odTL.to(
      ".preloader-line",
      {
        width: "120%",
        opacity: 0,
        duration: 1,
        ease: "expo.in",
      },
      "<"
    );
    odTL.set(".preloader-wrapper, .preloader-line", { display: "none" });
  }

  animate() {
    // Check if the timeline is currently active (running)
    if (this.tl && this.tl.isActive()) {
      //return false; // Don't start a new animation
    }

    // Mapping each Item object to its actual DOM element for the animation
    const allItems = this.items.map((item) => item.DOM.el);

    // Isolating the last item's DOM element for a separate animation effect
    const lastItem = this.items[this.items.length - 1].DOM.el;

    // Mapping each Item object to its 'inner' property (inner image)
    const allInnerItems = this.items.map((item) => item.DOM.inner);

    const lastInner = this.items[this.items.length - 1].DOM.inner;
    gsap.set(".hero-visual-item", { opacity: 1 });

    // Creating a new GSAP timeline for managing a sequence of animations
    this.tl = gsap
      .timeline({
        paused: true, // Create the timeline in a paused state
        defaults: {
          // Default settings applied to all animations within this timeline
          duration: this.animationSettings.duration,
          ease: this.animationSettings.ease,
        },
        delay: 3,
        onComplete: () => {
          //gsap.set(this.targets(), { clearProps: "all" });
          new Home(this.container);
        },
      })
      .fromTo(
        this.DOMlayers,
        {
          scale: 0.9,
        },
        {
          duration:
            this.animationSettings.duration +
            this.animationSettings.delayFactor * (this.items.length - 1),
          ease: "linear",
          scale: 1,
        },
        0
      )
      .fromTo(
        allItems,
        {
          // Initial animation state
          opacity: 1, // Fully visible
          "clip-path": "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)", // CSS clip-path shape
        },
        {
          // Animation target state
          stagger: {
            // Settings for staggering animations for each item
            each: this.animationSettings.delayFactor, // Time between each item's animation
            onComplete: function () {
              // Callback after each item finishes animating
              const targetElement = this.targets()[0]; // The element that just finished animating
              // Determining the index of the animated element within the original DOM NodeList
              const index = this.DOMItems.indexOf(targetElement);
              if (index) {
                // If the element is not the first one (index 0)
                // Set the opacity of the previous element to 0
                gsap.set(this.items[index - 1].DOM.el, { opacity: 0 });
              }
            },
          },
          "clip-path": "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", // Target shape of the clip-path
        },
        0
      )
      .fromTo(
        allInnerItems,
        {
          // Starting state for 'inner' elements' animation
          xPercent: 0,
          //filter: "brightness(10%)", // CSS filters to adjust color
          // force3D: true, // Force 3D rendering for smoother animations
        },
        {
          // Animation target state
          stagger: this.animationSettings.delayFactor * 1.2, // Stagger settings similar to above
          //filter: "brightness(100%)", // Full brightness
          //force3D: true, // Force 3D rendering for smoother animations
        },
        0
      )
      .addLabel(
        "reveal",
        this.animationSettings.duration +
          this.animationSettings.delayFactor * (this.items.length - 1)
      )
      .from(".hero-text, .nav-wrapper", {
        opacity: 0,
        duration: 1,
        ease: "power3.inOut",
      });

    // Start the animation
    this.tl.play();
  }
}

export default LoaderAnimation;
