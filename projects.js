import "splitting/dist/splitting.css";
import Splitting from "splitting";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import * as Lottie from "lottie-web";

gsap.registerPlugin(ScrollTrigger, Flip);
const lottie = Webflow.require("lottie").lottie;
class Projects {
  fadeOutTimeout = null;
  constructor(container) {
    this.container = container;
    this.scrollContainer = container.querySelector(".work-wrapper");
    this.invisible = [...container.querySelectorAll(".w-condition-invisible")];
    this.nextImage = container.querySelector(".next-up-image");
    this.videoControls = container.querySelector(".video-controls");
    this.media = container.querySelector(".work-main-img");
    this.video = container.querySelector("video");
    this.closeButton = container.querySelector(".v-close");
    this.info = container.querySelector(".v-info");
    this.videoDuration = container.querySelector(".v-duration-inner");
    this.remove();
    this.init();
  }

  remove() {
    this.invisible.map((el) => el.remove());
  }

  getScrollAmount() {
    this.scrollContainerWidth = this.scrollContainer.scrollWidth;
    console.log(this.scrollContainerWidth - window.innerWidth);
    console.log(
      document.querySelector(".work-wrapper").scrollWidth - window.innerWidth
    );
    return -(this.scrollContainerWidth - window.innerWidth);
  }

  init() {
    Splitting();
    this.splitText();
    this.getScrollAmount();
    this.initHorizontalScroll();
    if (this.scrollContainer.dataset.type === "Motion") {
      this.togglePlay();
    }
  }

  splitText() {
    const target = [...document.querySelectorAll("[split-target]")];
    const results = Splitting({ target: target, by: "lines" });
    this.words = document.querySelectorAll(".word");
    gsap.set(this.words, { yPercent: 120, opacity: 0 });
    gsap.set(this.info.querySelectorAll(".word"), { yPercent: 0, opacity: 1 });
    this.words.forEach((word) => {
      let wrapper = document.createElement("span");
      wrapper.classList.add("char-wrap");
      word.parentNode.insertBefore(wrapper, word);
      wrapper.appendChild(word);
    });
    let lines = results.map((result) => result.lines);
    gsap.to(lines, {
      yPercent: 0,
      opacity: 1,
      duration: 0.75,
      ease: "expo.out",
      delay: 0.5,
    });
    // console.log(results);
  }
  initHorizontalScroll() {
    let mm = gsap.matchMedia();

    mm.add("(min-width: 480px)", () => {
      this.scrollContainer = this.container.querySelector(".work-wrapper");
      let horScroll = gsap.to(this.scrollContainer, {
        x: this.getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: this.scrollContainer,
          start: "top top",
          end: `+=${this.getScrollAmount() * -1}`,
          scrub: 1,
          pin: true,
          markers: true,
          invalidateOnRefresh: true,
        },
      });

      let tl = gsap.timeline();
      tl.from(this.nextImage, {
        scale: 0,
        duration: 5,
        ease: "expo.out",
        scrollTrigger: {
          containerAnimation: horScroll,
          trigger: document.querySelector(".next-up-wrapper"),
          start: "0% center",
          end: "32% center",
          //toggleActions: "play none none reverse",
          scrub: 1,
          //markers: true,
        },
      });
    });
    mm.add("(max-width: 479px)", () => {
      console.log("mobile");
      this.scrollContainer = this.container.querySelector(
        ".work-visuals-wrapper"
      );
      let horScroll = gsap.to(this.scrollContainer, {
        x: this.getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: this.scrollContainer,
          start: "top top",
          end: `+=${this.getScrollAmount() * -1}`,
          scrub: 1,
          pin: true,
          markers: true,
          invalidateOnRefresh: true,
        },
      });

      let tl = gsap.timeline();
      tl.from(this.nextImage, {
        scale: 0,
        duration: 5,
        ease: "expo.out",
        scrollTrigger: {
          containerAnimation: horScroll,
          trigger: document.querySelector(".next-up-wrapper"),
          start: "0% center",
          end: "32% center",
          //toggleActions: "play none none reverse",
          scrub: 1,
          //markers: true,
        },
      });
    });
  }

  togglePlayBtn(animation, direction, speed) {
    animation.setDirection(direction);
    animation.playSpeed = speed;
    animation.play();
  }

  togglePlay() {
    const [animation] = lottie.getRegisteredAnimations();
    animation.firstFrame = 30.5;
    //video controls show
    const tl = gsap.timeline({ paused: true });
    const muteLetters = [...this.info.querySelectorAll(".char")];
    tl.to([this.closeButton, this.info], { opacity: 1, duration: 0.5 });
    //mute animation
    const tlMute = gsap.timeline();
    tlMute.to(muteLetters.slice(0, 2), {
      yPercent: 110,
      duration: 0.7,
      stagger: {
        amount: 0.2,
        from: "start",
      },
      ease: "power3.inOut",
    });
    //close button animation
    const tlClose = gsap.timeline({ paused: true });
    tlClose.to(this.closeButton.querySelector(".close-icon"), {
      rotate: 180,
      ease: "expo.out",
      duration: 1.2,
    });

    //click event
    this.videoControls.addEventListener("click", (e) => {
      const isPaused = this.video.paused;
      if (e.target.closest(".v-sound")) {
        this.video.muted = !this.video.muted;
        this.video.muted ? tlMute.reverse() : tlMute.play();
      } else {
        //video flip animation
        const state = Flip.getState(this.media);
        this.media.classList.toggle("active");
        Flip.from(state, {
          duration: 1.5,
          ease: "power1.inOut",
        });
        if (isPaused) {
          this.togglePlayBtn(animation, 1, 3);
          this.video.play();
          tl.play();
        } else {
          this.togglePlayBtn(animation, -1, 1);
          this.video.pause();
          tl.reverse();
        }
      }
    });
    this.video.addEventListener("timeupdate", () => {
      const progress = this.video.currentTime / this.video.duration;
      gsap.to(this.videoDuration, {
        width: `${progress * 100}%`,
        ease: "linear",
      });
    });
    this.closeButton.addEventListener("mouseenter", () => {
      tlClose.restart();
    });
    this.videoControls.addEventListener("mouseover", () => {
      this.showControls();
    });
  }
  showControls() {
    // Cancel any ongoing animation to prevent conflicts
    //gsap.killTweensOf(this.videoControls);
    // Immediately set opacity to 1
    if (!this.video.isPaused) {
      gsap.to(this.videoControls, { opacity: 1, duration: 0.2 });

      // Clear existing timeout to prevent multiple instances
      clearTimeout(this.fadeOutTimeout);

      // Set a timeout to fade out the controls after 10 seconds
      this.fadeOutTimeout = setTimeout(() => {
        gsap.to(this.videoControls, { opacity: 0, duration: 0.5 });
      }, 3000); // 10 seconds delay
    }
  }
}

export default Projects;
