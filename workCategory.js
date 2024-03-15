import gsap from "gsap";
import "splitting/dist/splitting.css";
import Splitting from "splitting";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ColorThief from "colorthief";
import { debounce } from "./global.js";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

class WorkCategory {
  lines = [];
  tl = gsap.timeline();
  topSentinel = document.createElement("div");
  bottomSentinel = document.createElement("div");
  targetElement = null;
  prevIndex = 0;
  currIndex = 1;
  colorThief = new ColorThief();
  constructor(container) {
    this.workContainer = container.querySelector(".t-list");
    this.workItems = [...container.querySelectorAll(".t-item")];
    this.worksName = [...container.querySelectorAll(".works-name-item")];
    this.workNum = container.querySelector(".work-num");
    this.workTotal = container.querySelector(".work-total");
    this.sets = [this.workItems];
    this.debouncedShowActiveItem = debounce(
      this.showActiveItem.bind(this),
      250
    );
    this.init();
    this.initLenis();
  }

  init() {
    this.workTotal.textContent = String(this.worksName.length).padStart(2, "0");
    //this.splitText();
    //this.infiniteScroll();
    //this.getDominantColor();
  }

  initLenis() {
    const lenis = new Lenis({
      infinite: true,
    });

    function onRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(onRaf);
    }

    requestAnimationFrame(onRaf);
  }

  splitText() {
    const target = [...document.querySelectorAll("[split-target]")];
    const results = Splitting({ target: target, by: "lines" });
    //console.log(results);
    this.words = document.querySelectorAll(".word");
    gsap.set(this.words, { yPercent: 120, opacity: 0 });
    this.words.forEach((word) => {
      let wrapper = document.createElement("span");
      wrapper.classList.add("char-wrap");
      word.parentNode.insertBefore(wrapper, word);
      wrapper.appendChild(word);
    });
    this.lines = results.map((result) => result.lines);
    //console.log(this.lines);
    // console.log(results);
    gsap.to(".h2-large.work-name", { opacity: 1 });
  }

  oItems() {
    /*
    const observer = new IntersectionObserver(
      (entries, observer) => {
        // Detect the scrolling direction
        const isScrollingDown = window.scrollY > lastY;
        lastY = window.scrollY;

        // Filter entries that are currently intersecting and sort them by their top bounding client rect
        const sortedEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        // Choose the right item based on the scrolling direction
        const relevantEntry = isScrollingDown
          ? sortedEntries[0]
          : sortedEntries[sortedEntries.length - 1];

        if (relevantEntry) {
          const newIndex = Array.from(this.workItems).findIndex(
            (item) => item === relevantEntry.target
          );
          if (newIndex !== currentIndex) {
            console.log(
              `Item closest to the top at index ${newIndex} is intersecting.`
            );
            currentIndex = newIndex; // Update the current index
          }
        }
      },
      { rootMargin: "0px", threshold: [0.5] }
    ); // Threshold can be an array to report changes more frequently
    */
    this.workItems.forEach((item, index) => {
      ScrollTrigger.create({
        trigger: item,
        start: "10% 25%",
        markers: true,
        onEnter: () => {
          this.workNum.textContent = String(index + 1).padStart(2, "0");
          console.log(index);
          this.debouncedShowActiveItem(index);
        },
        onLeaveBack: () => {
          this.workNum.textContent = String(index + 1).padStart(2, "0");
          console.log(index);
          this.debouncedShowActiveItem(index);
        },
      });
    });
  }

  infiniteScroll() {
    this.workContainer.prepend(this.topSentinel);
    this.workContainer.append(this.bottomSentinel);

    // Create a new IntersectionObserver instance
    const observer = new IntersectionObserver(
      (entries) => {
        const b = entries
          .map((entry) => (entry.isIntersecting ? entry.target : null))
          .filter((entry) => entry !== null); // Filter out null values

        if (b.length > 1) {
          // If b contains more than one element, return the last target element
          this.targetElement = b[b.length - 1];
        } else if (b.length === 1) {
          // If b contains only one element, return that target element
          this.targetElement = b[0];
        }

        if (this.targetElement) {
          console.log(this.targetElement);
          this.debouncedShowActiveItem(this.targetElement);
          gsap.set(".bg-layer", {
            background: `linear-gradient(180deg, #fff 0%, rgb(${this.targetElement.dataset.color}) 90%)`,
            //backgroundColor: "black",
          });

          gsap.set(".page-wrapper", {
            background: `linear-gradient(180deg, #fff 0%, rgb(${this.targetElement.dataset.color}) 90%)`,
            //color: `rgb(${this.targetElement.dataset.color})`,
          });
        }
      },
      {
        // Set the root's margin box as the intersection rectangle, 30% from the top
        rootMargin: "-55% 0px",
      }
    );
    //`rgb(${this.targetElement.dataset.color})`
    // Observe each card
    this.workItems.forEach((card) => {
      observer.observe(card);
    });

    const observerSentinel = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === this.topSentinel) {
              // Clone cards and prepend
              const scrollHeightBefore = this.workContainer.scrollHeight;
              const newSet = this.workItems.map((card) => {
                const clonedCard = card.cloneNode(true);
                this.workContainer.insertBefore(
                  clonedCard,
                  this.topSentinel.nextSibling
                );
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              this.sets.unshift(newSet.toReversed()); // Add the new set to the beginning
              // Adjust scroll position to prevent jump
              this.workContainer.scrollTop +=
                this.workContainer.scrollHeight - scrollHeightBefore;

              // Remove last set of cards if there are more than 3 sets
              if (this.sets.length > 3) {
                const lastSet = this.sets.pop();
                lastSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            } else if (entry.target === this.bottomSentinel) {
              // Clone cards and append
              const newSet = this.workItems.map((card) => {
                const clonedCard = card.cloneNode(true);
                this.workContainer.insertBefore(
                  clonedCard,
                  this.bottomSentinel
                );
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              this.sets.push(newSet); // Add the new set to the end

              // Remove first set of cards if there are more than 3 sets
              if (this.sets.length > 3) {
                const firstSet = this.sets.shift();
                firstSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            }
          }
        });
      },
      { threshold: 1, rootMargin: "100px" }
    );

    observerSentinel.observe(this.topSentinel);
    observerSentinel.observe(this.bottomSentinel);
  }

  infinite() {
    const container = document.querySelector(".t-list");
    let cards = Array.from(document.querySelectorAll(".t-item"));
    let sets = [cards]; // Keep track of the sets of cards

    // Create sentinel elements
    const topSentinel = document.createElement("div");
    const bottomSentinel = document.createElement("div");

    container.prepend(topSentinel);
    container.append(bottomSentinel);

    // Create a new IntersectionObserver instance
    const observer = new IntersectionObserver(
      (entries) => {
        const b = entries
          .map((entry) => (entry.isIntersecting ? entry.target : null))
          .filter((entry) => entry !== null); // Filter out null values

        let targetElement = null;

        if (b.length > 1) {
          // If b contains more than one element, return the last target element
          targetElement = b[b.length - 1];
        } else if (b.length === 1) {
          // If b contains only one element, return that target element
          targetElement = b[0];
        }

        if (targetElement) {
          console.log(targetElement);
        }
      },
      {
        // Set the root's margin box as the intersection rectangle, 30% from the top
        rootMargin: "-55% 0px",
      }
    );

    // Observe each card
    cards.forEach((card) => {
      observer.observe(card);
    });

    const observerSentinel = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === topSentinel) {
              // Clone cards and prepend
              const scrollHeightBefore = container.scrollHeight;
              const newSet = cards.map((card) => {
                const clonedCard = card.cloneNode(true);
                container.insertBefore(clonedCard, topSentinel.nextSibling);
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              sets.unshift(newSet); // Add the new set to the beginning
              // Adjust scroll position to prevent jump
              container.scrollTop +=
                container.scrollHeight - scrollHeightBefore;

              // Remove last set of cards if there are more than 3 sets
              if (sets.length > 3) {
                const lastSet = sets.pop();
                lastSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            } else if (entry.target === bottomSentinel) {
              // Clone cards and append
              const newSet = cards.map((card) => {
                const clonedCard = card.cloneNode(true);
                container.insertBefore(clonedCard, bottomSentinel);
                observer.observe(clonedCard); // Observe the new card
                return clonedCard;
              });
              sets.push(newSet); // Add the new set to the end

              // Remove first set of cards if there are more than 3 sets
              if (sets.length > 3) {
                const firstSet = sets.shift();
                firstSet.forEach((card) => {
                  observer.unobserve(card); // Stop observing the removed card
                  card.remove();
                });
              }
            }
          }
        });
      },
      { threshold: 1, rootMargin: "100px" }
    );

    observerSentinel.observe(topSentinel);
    observerSentinel.observe(bottomSentinel);
  }

  showActiveItem(target) {
    this.currIndex = this.worksName.findIndex((item) => {
      return item.dataset.name === target.dataset.work;
    });

    this.workNum.textContent = String(this.currIndex + 1).padStart(2, "0");

    if (this.currIndex !== this.prevIndex) {
      this.tl.to(this.lines[this.prevIndex], {
        yPercent: 120,
        opacity: 0,
        duration: 0.2,
      });
      this.tl.to(this.lines[this.currIndex], {
        yPercent: 0,
        opacity: 1,
        duration: 0.2,
      });
    }
    this.prevIndex = this.currIndex;
  }

  getDominantColor() {
    const colorThief = new ColorThief();
    const loadPromises = this.workItems.map((item) => {
      return new Promise((resolve) => {
        const img = item.querySelector("img");
        img.crossOrigin = "Anonymous";
        let color;
        if (img.complete) {
          color = colorThief.getColor(img);
          item.setAttribute("data-color", color.join());
          resolve();
        } else {
          img.addEventListener("load", function () {
            color = colorThief.getColor(img);
            //console.log(color);
            item.setAttribute("data-color", color.join());
            resolve();
          });
        }
      });
    });

    Promise.all(loadPromises).then(() => {
      //this.getText();
      this.infiniteScroll();
    });
  }

  getText() {
    this.workItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {});
    });
  }
}

export default WorkCategory;
