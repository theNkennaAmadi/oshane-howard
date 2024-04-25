import "splitting/dist/splitting.css";
import Splitting from "splitting";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {Flip} from "gsap/Flip";


gsap.registerPlugin(ScrollTrigger, Flip);
const lottie = Webflow.require("lottie").lottie;

class Projects {
  fadeOutTimeout = null;
  hasCrossedThreshold = false;
  threshold = 478;
  firstLoad = true;
  ctx
  constructor(container) {
    this.container = container;
    this.scrollContainer = window.innerWidth > 479 ? container.querySelector(".work-wrapper") : container.querySelector(".work-visuals-wrapper");
    this.invisible = [...container.querySelectorAll(".w-condition-invisible")];
    this.nextItems = [...container.querySelectorAll(".next-up-cc-item")];
    this.initNextItems();
    this.images = [...container.querySelectorAll(".work-visual-item")];
    //this.randomNumber = Math.floor(Math.random() * this.nextItems.length);
    //this.nextImage = this.nextItems[this.randomNumber].querySelector(".next-up-image");
    this.videoControls = container.querySelector(".video-controls");
    this.media = container.querySelector(".work-main-img");
    this.video = container.querySelector("video");
    this.closeButton = container.querySelector(".v-close");
    this.info = container.querySelector(".v-info");
    this.videoDuration = container.querySelector(".v-duration-inner");
    this.videoDurationWrapper = container.querySelector(".v-duration-outer-wrapper");
    this.remove();
    setTimeout(() => {
        this.init();
    }, 100)
  }

  initNextItems(){
    let currItem = this.nextItems.filter((item) => item.dataset.project_name === this.container.dataset.project_name)
    let currIndex = this.nextItems.indexOf(currItem[0]);
    let nextIndex
    currIndex === this.nextItems.length - 1 ? nextIndex = 0 : nextIndex = currIndex + 1;
    let inactiveNextItems = this.nextItems.filter((item) => item !== this.nextItems[nextIndex]);
    gsap.set(inactiveNextItems, { display: "none", visibility: "hidden" });
    this.nextImage = this.nextItems[nextIndex].querySelector(".next-up-image")
  }

  remove() {
    this.invisible.map((el) => el.remove());
  }

  getScrollAmount() {
    this.scrollContainerWidth =
      this.scrollContainer.scrollWidth - window.innerWidth;
    return -(this.scrollContainer.scrollWidth- window.innerWidth);
  }

  getinitScrollAmount() {
    const images = Array.from(this.scrollContainer.querySelectorAll("img"));
    const allImagesLoaded = images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.addEventListener("load", resolve);
          }
        })
    );

    Promise.all(allImagesLoaded).then(() => {
      this.scrollContainerWidth = -(
        this.scrollContainer.scrollWidth - window.innerWidth
      );
      this.initHorizontalScroll();
      return -(this.scrollContainer.scrollWidth- window.innerWidth);
    });

    window.addEventListener("resize", () => {
      this.scrollContainerWidth = -(
        this.scrollContainer.scrollWidth - window.innerWidth
      );
    })
  }

  init() {
    Splitting();
    this.getinitScrollAmount();
    this.splitText();
    //this.initHorizontalScroll();
    if (this.container.dataset.type === "Motion") {
      this.togglePlay();
    }
    window.addEventListener("resize", ()=>{
      this.checkWindowSize()
    })
    //let inactiveNextItems = this.nextItems.filter((item) => item !== this.nextItems[this.randomNumber]);
    //gsap.set(inactiveNextItems, { display: "none", visibility: "hidden" });
  }

  splitText() {
    const target = [...document.querySelectorAll("[split-target]")];
    const results = Splitting({ target: target, by: "lines" });
    this.words = document.querySelectorAll(".word");
    gsap.set(this.words, { yPercent: 120, opacity: 0 });
    gsap.set(".work-info", { opacity: 1 });
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
      duration: 1.2,
      ease: "expo.out",
      delay: 0.3,
    });
  }

  initHorizontalScroll() {
    let mm = gsap.matchMedia();
    this.ctx && this.ctx.revert() && mm.revert();
    this.ctx = gsap.context(() => {
      //ScrollTrigger.clearScrollMemory()
      mm.add("(max-width: 479px)", () => {
        ScrollTrigger.refresh();
        this.scrollContainer = this.container.querySelector(
            ".work-visuals-wrapper"
        );
        let getAmount = () =>{
          return (this.scrollContainer.scrollWidth - window.innerWidth)
        }
        let horScroll = gsap.to(this.scrollContainer, {
          x: () => -1 * (getAmount() - 50),
          ease: "none",
          scrollTrigger: {
            trigger: this.scrollContainer.parentElement,
            start: "top top",
            end: () => "+=" + (getAmount()),
            scrub: 1,
            pin: true,
           // markers: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        /*
        let tl = gsap.timeline();
        tl.from(this.nextImage, {
          scale: 0,
          duration: 5,
          ease: "expo.out",
          scrollTrigger: {
            containerAnimation: horScroll,
            trigger: document.querySelector(".next-up-wrapper"),
            start: "0% center",
            end: "100% end",

            //toggleActions: "play none none reverse",
            scrub: 1,
            //markers: true,
          },
        });

         */
        ScrollTrigger.create({
          containerAnimation: horScroll,
          trigger: document.querySelector(".next-up-wrapper"),
          start: "0% center",
          //end: "100% end",
          scrub: 1,
        })
      });
      mm.add("(min-width: 480px)", () => {
        ScrollTrigger.clearScrollMemory()
        ScrollTrigger.refresh();
        this.scrollContainer = this.container.querySelector(".work-wrapper");
        //console.log(window.innerWidth)
        //console.log(-1 * (this.scrollContainer.scrollWidth))
       // console.log(-1 * (this.scrollContainer.scrollWidth - window.innerWidth))
        /*
        let getAmount = () =>{
            return (this.scrollContainer.scrollWidth - window.innerWidth)
        }

         */
        let a = (this.scrollContainer.scrollWidth - window.innerWidth)
        let horScroll = gsap.to(this.scrollContainer, {
          x: () => -1 * a,
          ease: "none",
          scrollTrigger: {
            trigger: this.scrollContainer,
            start: "top top",
            end: () => "+=" + a,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        this.images.forEach((imageItem) => {
          let tlImages = gsap.timeline();
          tlImages.from(imageItem.querySelector("img"), {
            scale: 0.2,
            opacity: 0.2,
            ease: "expo.out",
            scrollTrigger:{
              containerAnimation: horScroll,
              trigger: imageItem,
              start: "0% 100%",
              end: "100% 100%",
              scrub: 1,
              once: true,
            }
          })
        })

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
    });
    window.addEventListener("orientationchange", ()=>{
        location.reload()
    })
  }

  checkWindowSize() {
    const currentWidth = window.innerWidth;

    // Check if the current width is crossing the threshold
    if ((currentWidth <= this.threshold && !this.hasCrossedThreshold) || (currentWidth > this.threshold && this.hasCrossedThreshold)) {
      if(!this.firstLoad){
        this.ctx.revert();
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        ScrollTrigger.refresh();
        setTimeout(() => {
          this.initHorizontalScroll()
        }, 1000)
        ScrollTrigger.refresh();
        location.reload()
      }
      this.firstLoad = false;

     //location.reload();
      //this.initHorizontalScroll()
      // Toggle the hasCrossedThreshold flag when the threshold is crossed
      this.hasCrossedThreshold = true
    }
  }

  togglePlayBtn(animation, direction, speed) {
    animation.setDirection(direction);
    animation.playSpeed = speed;
    animation.play();
  }
f
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
    this.videoControls.querySelector(".v-sound").addEventListener("click", () => {
        this.video.muted = !this.video.muted;
        this.video.muted ? tlMute.reverse() : tlMute.play();
    })

    let control = ()=>{
      const isPaused = this.video.paused;
      //video flip animation
      let mm = gsap.matchMedia();
      const state = Flip.getState(this.media);
      mm.add("(min-width: 480px)", () => {
        this.media.classList.toggle("active");
        Flip.from(state, {
          duration: 1.5,
          ease: "power1.inOut",
        });
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

    this.videoControls.querySelector(".v-play").addEventListener("click", () => {
      control()
    });

    this.closeButton.addEventListener("click", () => {
      control()
    });

    this.videoDurationWrapper.addEventListener("click", (e) => {
        const rect = this.videoDurationWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = this.videoDurationWrapper.offsetWidth;
        this.video.currentTime = (x / width) * this.video.duration;
        const progress = this.video.currentTime / this.video.duration;
        gsap.to(this.videoDuration, {
          width: `${progress * 100}%`,
          ease: "linear",
        });
    });

    this.video.addEventListener("timeupdate", () => {
      const progress = this.video.currentTime / this.video.duration;
      gsap.to(this.videoDuration, {
        width: `${progress * 100}%`,
        ease: "linear",
        duration: 0.3,
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
