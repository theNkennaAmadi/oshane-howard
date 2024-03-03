import gsap from "gsap";

class NavBar {
  constructor(container) {
    this.nav = container;
    this.navItems = [...container.querySelectorAll(".nav-menu-item")];
    this.navList = container.querySelector(".nav-menu-list");
    this.navImages = [...container.querySelector(".menu-m-images-item")];
    this.init();
  }
  init() {
    console.log("hello");
    console.log(this.navItems);
    this.navList.prepend(this.navItems.at(0));
    this.navList.append(this.navItems.at(-1));
    this.addEventListeners();
  }
}

export default NavBar;
