import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";
gsap.registerPlugin(ScrollTrigger, Observer);

class Info {
  constructor(container) {
    this.container = container;
    this.clients1 = container.querySelector(".clients-1");
    this.clients2 = container.querySelector(".clients-2");
    this.pressContainer = container.querySelector(".container.is-press");
    //this.pressItems = [...container.querySelectorAll(".press-item")];
    this.pressLists = [...container.querySelectorAll("[marquee-content]")];
    this.introBlock = container.querySelector(".info-intro");
    this.init();
  }

  init() {
    console.log("info");
    this.initLoad();
    this.initSwiper();
    this.initMarquee();
    this.addEventListeners();
    this.addPressScrollTrigger();
  }

  initLoad() {
    let tl = gsap.timeline({ delay: 1 });
    tl.from(
      this.container.querySelectorAll("[info-span]"),
      {
        x: gsap.utils.wrap(["-10%", "20%"]),
        opacity: 0,
        ease: "expo.out",
        duration: 1.5,
      },
      "<"
    );
    tl.fromTo(
      this.container.querySelector(".info-img"),
      {
        clipPath: "inset(100% 0% 0% 0%)",
        display: "none",
      },
      {
        zIndex: 2,
        clipPath: "inset(0% 0% 0% 0%)",
        display: "block",
        ease: "expo.inOut",
        duration: 1.5,
      },
      "<"
    );
    tl.from(
      this.container.querySelector(".info-img").querySelector("img"),
      {
        scale: 1.2,
        ease: "expo.inOut",
        duration: 2,
        onComplete: () => {
          newRun();
        },
      },
      "<"
    );
    const newRun = () => {
      gsap.to(this.container.querySelector(".info-img").querySelector("img"), {
        y: "40%",
        ease: "ease",
        scrollTrigger: {
          trigger: this.container.querySelector(".info-img"),
          start: "top 10%",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(this.container.querySelectorAll("[info-span]"), {
        x: gsap.utils.wrap(["0.5%", "-0.3%"]),
        ease: "expo.out",
        duration: 1.5,
        scrollTrigger: {
          trigger: this.introBlock,
          start: "top top",
          end: "bottom 30%",
          scrub: true,
        },
      });
    };
  }

  /*
  initSwiper() {
    const clients1 = this.clients1;
    const clients2 = this.clients2;
    const pressSwiper1 = new Swiper(clients1, {
      speed: 3000,
      loop: true,
      autoHeight: false,
      autoplay: {
        delay: 1,
        disableOnInteraction: false,
      },
      centeredSlides: false,
      followFinger: true,
      mousewheelControl: true,
      freeMode: true,
      slideToClickedSlide: false,
      slidesPerView: 8,
      spaceBetween: "4.5%",
      rewind: false,
      mousewheel: {
        forceToAxis: true,
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
    });
    const pressSwiper2 = new Swiper(clients2, {
      speed: 3000,
      loop: true,
      autoHeight: false,
      autoplay: {
        delay: 1,
        disableOnInteraction: false,
        reverseDirection: true,
      },
      centeredSlides: false,
      followFinger: true,
      mousewheelControl: true,
      freeMode: true,
      slideToClickedSlide: false,
      slidesPerView: 8.5,
      spaceBetween: "4.5%",
      rewind: false,
      mousewheel: {
        forceToAxis: true,
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
    });
  }

   */

  initMarquee() {
    this.pressLists.forEach((content) => {
      let direction = content.dataset.direction;
      if (direction !== "forward" && direction !== "backward") {
        direction = "forward";
      }
      let speed = Number(content.dataset.speed) || 1;
      new Marquee(content.querySelectorAll("[marquee-item]"), direction, speed);
    });
  }

  addEventListeners() {
    this.pressItems.forEach((item) => {
      const tlHover = gsap.timeline({ paused: true });
      tlHover.to(item, {
        color: "#FDED05",
        duration: 0.5,
        ease: "expo.out",
      });
      tlHover.to(
        item.querySelector(".press-bg"),
        {
          height: "100%",
          duration: 0.5,
          ease: "expo.out",
        },
        "<"
      );
      item.addEventListener("mouseenter", () => {
        tlHover.timeScale(1);
        tlHover.play();
      });
      item.addEventListener("mouseleave", () => {
        tlHover.timeScale(2);
        tlHover.reverse();
      });
    });
  }

  addPressScrollTrigger() {
    this.pressLists.forEach((list) => {
      gsap.from(list.querySelectorAll(".press-line"), {
        scrollTrigger: {
          trigger: list,
          start: "top 80%",
          end: "top 60%",
          toggleActions: "play none none none",
        },
        width: "0%",
        stagger: {
          amount: list.querySelectorAll(".press-line").length * 0.25,
        },
        ease: "expo.out",
      });
    });
  }
}

class Marquee {
  constructor(element, direction = "forward", speed = 1) {
    this.element = gsap.utils.toArray(element);
    this.direction = direction;
    this.speed = speed;
    this.tl = null; // Reference to the timeline for later manipulation
    this.init();
  }

  init() {
    gsap.registerPlugin(Observer);

    // Configure the initial direction of the animation.
    const config = {
      repeat: -1,
      reversed: this.direction === "backward",
      speed: this.speed,
    };

    this.tl = this.horizontalLoop(this.element, config);

    Observer.create({
      onChangeY: (self) => {
        // Determine the direction of the scroll.
        const scrollingUp = self.deltaY < 0;
        // Reverse the timeline based on scroll direction and the initial direction.
        if (
          (scrollingUp && this.direction === "forward") ||
          (!scrollingUp && this.direction === "backward")
        ) {
          if (!this.tl.reversed()) {
            this.tl.reverse();
          }
        } else {
          if (this.tl.reversed()) {
            this.tl.play();
          }
        }
      },
    });
  }

  /*
This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.

Features:
 - Uses xPercent so that even if the widths change (like if the window gets resized), it should still work in most cases.
 - When each item animates to the left or right enough, it will loop back to the other side
 - Optionally pass in a config object with values like "speed" (default: 1, which travels at roughly 100 pixels per second), paused (boolean),  repeat, reversed, and paddingRight.
 - The returned timeline will have the following methods added to it:
   - next() - animates to the next element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
   - previous() - animates to the previous element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
   - toIndex() - pass in a zero-based index value of the element that it should animate to, and optionally pass in a vars object to control duration, easing, etc. Always goes in the shortest direction
   - current() - returns the current index (if an animation is in-progress, it reflects the final index)
   - times - an Array of the times on the timeline where each element hits the "starting" spot. There's also a label added accordingly, so "label1" is when the 2nd element reaches the start.
 */

  horizontalLoop(items, config) {
    items = gsap.utils.toArray(items);
    config = config || {};
    let tl = gsap.timeline({
        repeat: config.repeat,
        paused: config.paused,
        defaults: { ease: "none" },
        onReverseComplete: () =>
          tl.totalTime(tl.rawTime() + tl.duration() * 100),
      }),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      xPercents = [],
      curIndex = 0,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
      totalWidth,
      curX,
      distanceToStart,
      distanceToLoop,
      item,
      i;
    gsap.set(items, {
      // convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents Arrays to make lookups faster.
      xPercent: (i, el) => {
        let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
        xPercents[i] = snap(
          (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
            gsap.getProperty(el, "xPercent")
        );
        return xPercents[i];
      },
    });
    gsap.set(items, { x: 0 });
    totalWidth =
      items[length - 1].offsetLeft +
      (xPercents[length - 1] / 100) * widths[length - 1] -
      startX +
      items[length - 1].offsetWidth *
        gsap.getProperty(items[length - 1], "scaleX") +
      (parseFloat(config.paddingRight) || 0);
    for (i = 0; i < length; i++) {
      item = items[i];
      curX = (xPercents[i] / 100) * widths[i];
      distanceToStart = item.offsetLeft + curX - startX;
      distanceToLoop =
        distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
      tl.to(
        item,
        {
          xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
          duration: distanceToLoop / pixelsPerSecond,
        },
        0
      )
        .fromTo(
          item,
          {
            xPercent: snap(
              ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
            ),
          },
          {
            xPercent: xPercents[i],
            duration:
              (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
            immediateRender: false,
          },
          distanceToLoop / pixelsPerSecond
        )
        .add("label" + i, distanceToStart / pixelsPerSecond);
      times[i] = distanceToStart / pixelsPerSecond;
    }
    function toIndex(index, vars) {
      vars = vars || {};
      Math.abs(index - curIndex) > length / 2 &&
        (index += index > curIndex ? -length : length); // always go in the shortest direction
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
      if (time > tl.time() !== index > curIndex) {
        // if we're wrapping the timeline's playhead, make the proper adjustments
        vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      curIndex = newIndex;
      vars.overwrite = true;
      return tl.tweenTo(time, vars);
    }
    tl.next = (vars) => toIndex(curIndex + 1, vars);
    tl.previous = (vars) => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true); // pre-render for performance
    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }
    return tl;
  }
}

export default Info;
