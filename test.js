import { Swiper } from "swiper";
import gsap from "gsap";

class Test {
  constructor() {
    console.log("hel");
    console.log("kcke, this is amazing, okay really?");
    this.init();
  }

  init() {
    var swiper = new Swiper(".swiper", {
      effect: "cards",
      grabCursor: true,
      autoplay: true,
      initialSlide: 2,
      speed: 400,
      loop: true,
      rotate: true,
      mousewheel: {
        invert: false,
      },
    });
  }
}

export default Test;
