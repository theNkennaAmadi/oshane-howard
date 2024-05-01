import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import InertiaPlugin from "gsap/InertiaPlugin";


export class Nav {
  navClosed = true;
  navOpenTl = gsap.timeline({ paused: true });
  navSocialsTl = gsap.timeline({ paused: true });
  constructor(container) {
    this.navItems = [...container.querySelectorAll(".nav-menu-item")];
    this.navList = container.querySelector(".nav-menu-list");
    this.navImages = [...container.querySelectorAll(".menu-m-images-item")];
    this.navButton = container.querySelector(".nav-menu-button");
    this.navMenu = container.querySelector(".nav-menu");
    this.navWrapper = container.querySelector(".nav-wrapper");
    this.navState = container.querySelector(".nav-wrapper").dataset.navColor;
    this.navSocialLinksWrapper = container.querySelector(
        ".menu-socials-link-wrapper"
    );
    this.navSocialLinks = [...container.querySelectorAll(".menu-socials-link")];
    this.navOpenText = container.querySelector(".nav-open");
    this.navClosedText = container.querySelector(".nav-close");
    this.init();
    this.navOpenTimeline();
  }

  addEventListeners() {
    this.navList.addEventListener("mouseover", (e) => {
      const target = e.target;
      if (
          target.closest(".nav-menu-item")?.classList.contains("nav-menu-item")
      ) {
        const index = this.navItems.indexOf(target.closest(".nav-menu-item"));
        let inactiveTitles = this.navItems.filter(
            (item) => item !== this.navItems[index]
        );
        let activeTitle = this.navItems[index];
        let inactiveImages = this.navImages.filter(
            (item) => item !== this.navImages[index]
        );
        let activeImages = this.navImages[index];

        this.navTimelines(
            inactiveTitles,
            activeTitle,
            inactiveImages,
            activeImages
        );
      }
    });
    this.navList.addEventListener("mouseout", () => {
      this.navTimelines([], this.navItems);
    });
    this.navButton.addEventListener("click", () => {
      this.navClosed ? this.navOpenTl.play() : this.navOpenTl.reverse();
      this.navClosed = !this.navClosed;
    });
    this.navItems.forEach((item) => {
      item.addEventListener("click", () => {
        this.navOpenTl.reverse();
        //this.navClosed = true;
      });
    });

    this.navSocialLinksWrapper.addEventListener("mouseover", (e) => {
      const target = e.target;
      if (
          target
              .closest(".menu-socials-link")
              ?.classList.contains("menu-socials-link")
      ) {
        const index = this.navSocialLinks.indexOf(
            target.closest(".menu-socials-link")
        );
        let active = this.navSocialLinks[index];
        let inactive = this.navSocialLinks.filter(
            (item) => item !== this.navSocialLinks[index]
        );
        gsap.to(inactive, {
          opacity: 0.6,
          duration: 0.5,
        });
        gsap.to(active, {
          opacity: 1,
          duration: 0.5,
        });
      }
    });
    this.navSocialLinksWrapper.addEventListener("mouseout", (e) => {
      gsap.to(".menu-socials-link", {
        opacity: 1,
        duration: 0.3,
      });
    });
  }

  navOpenTimeline() {
    this.navOpenTl.fromTo(
        this.navMenu,
        { display: "none", clipPath: "inset(0% 0% 100% 100%)", duration: 0 },
        {
          display: "block",
          clipPath: "inset(0% 0% 0% 0%)",
          backgroundColor: "black !important",
          color: "#fded05 !important",
          duration: 1,
          ease: "expo.inOut",
        }
    );
    this.navOpenTl.fromTo(
        this.navOpenText,
        { y: "0%", ease: "expo.in" },
        { y: "-120%", duration: 0.5, ease: "expo.out" },
        "<"
    );
    this.navOpenTl.to(
        this.navClosedText,
        { y: "0%", duration: 0.5, ease: "expo.out" },
        "<"
    );
    this.navOpenTl.to(
        this.navWrapper,
        {
          //color: () => (this.navState === "yellow" ? "#FDED05" : "black"),
          color: "#FDED05",
          mixBlendMode: "normal",
          duration: 0.5,
        },
        "<0.3"
    );
  }

  navTimelines(inactiveTitle, activeTitle, inactiveImages, activeImages) {
    let navTl = gsap.timeline();
    navTl.to(inactiveTitle, {
      opacity: 0.3,
      duration: 0.5,
      zIndex: 1,
    });
    navTl.to(activeTitle, { opacity: 1, zIndex: 2, duration: 0.5 }, "<");
    navTl.to(
        inactiveImages,
        {
          zIndex: 1,
          clipPath: "inset(0% 0% 100% 0%)",
          ease: "expo.inOut",
          duration: 1,
        },
        "<"
    );
    navTl.fromTo(
        activeImages,
        {
          clipPath: "inset(100% 0% 0% 0%)",
          zIndex: 1,
        },
        {
          zIndex: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "expo.inOut",
          duration: 1,
        },
        "<"
    );
  }

  init() {
    this.navList.prepend(this.navItems.at(0));
    this.navList.append(this.navItems.at(-1));
    this.addEventListeners();
    this.navTimelines([], [], [], this.navImages[0]);
  }
}

export const backgroundColorReset = (container) => {
  let bgColor = getComputedStyle(container).backgroundColor;
  let txtColor = getComputedStyle(container).color;
  gsap.to([container, "body"], {
    backgroundColor: bgColor,
    color: txtColor,
    duration: 1,
  });
};

const findDifference = (array1, array2) => {
  // Filter array1 to find elements not in array2
  return array1.filter((element) => !array2.includes(element));
};

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

let clampSkew = gsap.utils.clamp(-20, 20);

export class DraggableImg {
  constructor(container) {
    let proxy = document.createElement("div"),
        tracker = InertiaPlugin.track(proxy, "x")[0],
        skewTo = gsap.quickTo(container, "skewX"),
        updateSkew = () => {
          let vx = tracker.get("x");
          skewTo(clampSkew(vx / -50));
          !vx && !this.drag.isPressed && gsap.ticker.remove(updateSkew);
        },
        align = () => gsap.set(proxy, {x: gsap.getProperty(container, "x"), y: gsap.getProperty(container, "y"), width: container.offsetWidth, height: container.offsetHeight, position: "absolute", pointerEvents: "none", top: container.offsetTop, left: container.offsetLeft, border: "none"}),
        xTo = gsap.quickTo(container, "x", {duration: 0.5}),
        yTo = gsap.quickTo(container, "y", {duration: 0.5});

    // make the proxy sit right on top and add it to the DOM so that bounds work
    align();
    container.parentNode.append(proxy);
    gsap.set(proxy, {scale:2})

    gsap.to('.hero-visual-text', {opacity: 1, display: "block", duration: 0.3, ease: "expo.out"})
    gsap.to('.mb-info, .mb-logo', {opacity: 1, display: "block", duration: 0.3, ease: "expo.out"})
    gsap.to(".hero-visual-item", { pointerEvents: "auto !important" });
    document.querySelectorAll(".hero-visual-item").forEach((item) => {
      item.classList.add("active")
    })


    this.drag = Draggable.create(proxy, {
      type: "x,y",
      trigger: container,
      bounds: ".hero-grid",
      edgeResistance: 0.75,
      allowEventDefault: isAndroid(), //fixes an issue with Android touch devices: https://gsap.com/community/forums/topic/15027-draggable-android-issue-clicking-links-with-dragclickablestrue/
      onPressInit() {
        align();
        xTo.tween.pause();
        yTo.tween.pause();
        //gsap.ticker.add(updateSkew);
      },
      onPress() {
        container.style.zIndex = proxy.style.zIndex;
      },
      onDrag() {
        gsap.to(container.querySelectorAll("img"), {scale: 1.25});
        xTo(this.x);
        yTo(this.y);
        gsap.to(container.querySelectorAll("img"), {x: this.x*0.05, y: this.y * 0.05, duration: 0.7, ease: "expo.out"});
      },
      onThrowUpdate() {
        xTo(this.x);
        yTo(this.y);
      },
      inertia: true
    })[0];
  }
}
