(() => {
  "use strict";

  // Slider configuration defaults; override per instance in new DragSlider(...).
  const defaultConfig = {
    autoPlay: true,
    autoPlayDelay: 4000,
    showControls: true,
    showIndicators: true,
    enableKeyboard: true,
    enableDrag: true,
    loop: true,
    swipeThreshold: 60,
    dragActivateThreshold: 4,
    pauseOnHover: false,
  };

  class Slider {
    constructor(root, options) {
      if (!root) {
        throw new Error("Slider root element is missing.");
      }

      this.root = root;
      this.track = root.querySelector("[data-slider-track]");
      this.viewport = root.querySelector("[data-slider-viewport]");
      this.slides = Array.from(root.querySelectorAll("[data-slide]"));
      this.controlsHost = root.querySelector("[data-slider-controls]");
      this.indicatorsHost = root.querySelector("[data-slider-indicators]");

      this.config = Object.assign({}, defaultConfig, options || {});
      this.currentIndex = 0;
      this.autoPlayId = null;
      this.isPlaying = Boolean(this.config.autoPlay);

      this.buttons = {
        prev: null,
        next: null,
        toggle: null,
      };
      this.dots = [];

      this.handleKeydown = this.handleKeydown.bind(this);
      this.handleDotClick = this.handleDotClick.bind(this);
    }

    init() {
      if (!this.track || !this.viewport || this.slides.length === 0) {
        throw new Error("Slider markup is missing.");
      }

      if (this.config.showControls) {
        this.createControls();
      }

      if (this.config.showIndicators) {
        this.createIndicators();
      }

      this.bindEvents();
      this.update();

      if (this.isPlaying) {
        this.startAutoPlay();
      }
    }

    createControls() {
      if (!this.controlsHost) {
        return;
      }

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "btn";
      prev.dataset.action = "prev";
      prev.setAttribute("aria-label", "Попередній слайд");
      prev.textContent = "← Назад";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "btn btn--primary";
      toggle.dataset.action = "toggle";

      const next = document.createElement("button");
      next.type = "button";
      next.className = "btn";
      next.dataset.action = "next";
      next.setAttribute("aria-label", "Наступний слайд");
      next.textContent = "Вперед →";

      this.controlsHost.append(prev, toggle, next);

      this.buttons.prev = prev;
      this.buttons.next = next;
      this.buttons.toggle = toggle;

      this.updateToggleButton();
    }

    createIndicators() {
      if (!this.indicatorsHost) {
        return;
      }

      this.indicatorsHost.setAttribute("role", "tablist");
      this.indicatorsHost.setAttribute("aria-label", "Слайди");
      this.indicatorsHost.innerHTML = "";
      this.dots = this.slides.map((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.dataset.slideTo = String(index);
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Слайд ${index + 1}`);
        dot.setAttribute("aria-selected", "false");
        this.indicatorsHost.appendChild(dot);
        return dot;
      });
    }

    bindEvents() {
      if (this.buttons.prev) {
        this.buttons.prev.addEventListener("click", () => {
          this.prevSlide();
          this.startAutoPlay();
        });
      }

      if (this.buttons.next) {
        this.buttons.next.addEventListener("click", () => {
          this.nextSlide();
          this.startAutoPlay();
        });
      }

      if (this.buttons.toggle) {
        this.buttons.toggle.addEventListener("click", () => this.toggleAutoPlay());
      }

      if (this.indicatorsHost) {
        this.indicatorsHost.addEventListener("click", this.handleDotClick);
      }

      if (this.config.enableKeyboard) {
        window.addEventListener("keydown", this.handleKeydown);
      }

      window.addEventListener("blur", () => this.stopAutoPlay());
      window.addEventListener("focus", () => this.startAutoPlay());

      if (this.config.pauseOnHover) {
        this.root.addEventListener("mouseenter", () => this.stopAutoPlay());
        this.root.addEventListener("mouseleave", () => this.startAutoPlay());
      }
    }

    handleKeydown(event) {
      if (event.key === "ArrowRight") {
        this.nextSlide();
        this.startAutoPlay();
      }
      if (event.key === "ArrowLeft") {
        this.prevSlide();
        this.startAutoPlay();
      }
    }

    handleDotClick(event) {
      const target = event.target.closest("[data-slide-to]");
      if (!target) {
        return;
      }
      const index = Number(target.dataset.slideTo);
      if (!Number.isNaN(index)) {
        this.goToSlide(index);
        this.startAutoPlay();
      }
    }

    updateToggleButton() {
      if (!this.buttons.toggle) {
        return;
      }
      this.buttons.toggle.setAttribute("aria-pressed", String(!this.isPlaying));
      this.buttons.toggle.textContent = this.isPlaying ? "⏸ Пауза" : "▶ Автоплей";
    }

    updateButtons() {
      if (!this.buttons.prev || !this.buttons.next) {
        return;
      }
      if (this.config.loop) {
        this.buttons.prev.disabled = false;
        this.buttons.next.disabled = false;
        return;
      }
      this.buttons.prev.disabled = this.currentIndex === 0;
      this.buttons.next.disabled = this.currentIndex === this.slides.length - 1;
    }

    updateDots() {
      if (this.dots.length === 0) {
        return;
      }
      this.dots.forEach((dot, index) => {
        const isActive = index === this.currentIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", String(isActive));
      });
    }

    update() {
      const offset = this.currentIndex * -100;
      this.track.style.transform = `translateX(${offset}%)`;
      this.updateButtons();
      this.updateDots();
    }

    goToSlide(index) {
      const maxIndex = this.slides.length - 1;
      this.currentIndex = Math.max(0, Math.min(index, maxIndex));
      this.update();
    }

    nextSlide() {
      if (this.currentIndex === this.slides.length - 1) {
        if (this.config.loop) {
          this.goToSlide(0);
        }
        return;
      }
      this.goToSlide(this.currentIndex + 1);
    }

    prevSlide() {
      if (this.currentIndex === 0) {
        if (this.config.loop) {
          this.goToSlide(this.slides.length - 1);
        }
        return;
      }
      this.goToSlide(this.currentIndex - 1);
    }

    stopAutoPlay() {
      if (this.autoPlayId) {
        window.clearInterval(this.autoPlayId);
        this.autoPlayId = null;
      }
    }

    startAutoPlay() {
      this.stopAutoPlay();
      if (!this.isPlaying) {
        return;
      }
      this.autoPlayId = window.setInterval(() => {
        this.nextSlide();
      }, this.config.autoPlayDelay);
    }

    toggleAutoPlay() {
      this.isPlaying = !this.isPlaying;
      this.updateToggleButton();
      if (this.isPlaying) {
        this.startAutoPlay();
      } else {
        this.stopAutoPlay();
      }
    }
  }

  class DragSlider extends Slider {
    constructor(root, options) {
      super(root, options);
      this.isDragging = false;
      this.dragMoved = false;
      this.startX = 0;
      this.currentTranslate = 0;

      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
    }

    init() {
      super.init();
      if (this.config.enableDrag) {
        this.bindPointer();
      }
    }

    bindPointer() {
      this.viewport.addEventListener("pointerdown", this.handlePointerDown);
      this.viewport.addEventListener("pointermove", this.handlePointerMove);
      this.viewport.addEventListener("pointerup", this.handlePointerUp);
      this.viewport.addEventListener("pointercancel", this.handlePointerUp);
      this.viewport.addEventListener("pointerleave", this.handlePointerUp);
    }

    handlePointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      this.isDragging = true;
      this.dragMoved = false;
      this.startX = event.clientX;
      this.currentTranslate = -this.currentIndex * this.viewport.clientWidth;
      this.track.classList.add("is-dragging");
      this.track.setPointerCapture(event.pointerId);
      this.stopAutoPlay();
    }

    handlePointerMove(event) {
      if (!this.isDragging) {
        return;
      }
      const deltaX = event.clientX - this.startX;
      if (Math.abs(deltaX) > this.config.dragActivateThreshold) {
        this.dragMoved = true;
      }
      const offset = this.currentTranslate + deltaX;
      this.track.style.transform = `translateX(${offset}px)`;
    }

    handlePointerUp(event) {
      if (!this.isDragging) {
        return;
      }
      this.isDragging = false;
      this.track.classList.remove("is-dragging");
      this.track.releasePointerCapture(event.pointerId);

      const deltaX = event.clientX - this.startX;
      if (Math.abs(deltaX) > this.config.swipeThreshold) {
        if (deltaX < 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      } else {
        this.update();
      }

      if (this.dragMoved) {
        event.preventDefault();
      }

      this.startAutoPlay();
    }
  }

  const sliderRoot = document.querySelector(".slider");

  const slider = new DragSlider(sliderRoot, {
    autoPlay: true,
    autoPlayDelay: 4000,
    showControls: true,
    showIndicators: true,
    enableKeyboard: true,
    enableDrag: true,
    loop: true,
    pauseOnHover: true,
  });

  slider.init();
})();
