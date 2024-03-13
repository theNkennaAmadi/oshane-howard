// import Swiper JS
import Swiper from "swiper/bundle";
// import Swiper styles
import "swiper/css/bundle";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

class Info {
  constructor(container) {
    this.container = container;
    this.clients1 = container.querySelector(".clients-1");
    this.clients2 = container.querySelector(".clients-2");
    this.pressContainer = container.querySelector(".container.is-press");
    this.pressItems = [...container.querySelectorAll(".press-item")];
    this.pressLists = [...container.querySelectorAll(".press-list")];
    this.introBlock = container.querySelector(".info-intro");
    this.init();
  }

  init() {
    console.log("info");
    this.initLoad();
    this.initSwiper();
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

export default Info;
