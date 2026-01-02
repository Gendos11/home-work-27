const slider = document.querySelector(".slider");
const track = document.querySelector("[data-slider-track]");
const viewport = document.querySelector("[data-slider-viewport]");
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const prevButton = document.querySelector("[data-action=prev]");
const nextButton = document.querySelector("[data-action=next]");
const toggleButton = document.querySelector("[data-action=toggle]");
const dots = Array.from(document.querySelectorAll(".dot"));

if (!slider || !track || slides.length === 0) {
  throw new Error("Slider markup is missing.");
}

let currentIndex = 0;
let autoPlayId = null;
let isPlaying = true;
let startX = 0;
let currentTranslate = 0;
let isDragging = false;
let dragMoved = false;

const AUTO_PLAY_DELAY = 4000;
const SWIPE_THRESHOLD = 60;

const updateButtons = () => {
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === slides.length - 1;
};

const updateDots = () => {
  dots.forEach((dot, index) => {
    const isActive = index === currentIndex;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-selected", String(isActive));
  });
};

const updateTrack = () => {
  const offset = currentIndex * -100;
  track.style.transform = `translateX(${offset}%)`;
  updateButtons();
  updateDots();
};

const goToSlide = (index) => {
  currentIndex = Math.max(0, Math.min(index, slides.length - 1));
  updateTrack();
};

const nextSlide = () => {
  if (currentIndex === slides.length - 1) {
    goToSlide(0);
    return;
  }
  goToSlide(currentIndex + 1);
};

const prevSlide = () => {
  if (currentIndex === 0) {
    goToSlide(slides.length - 1);
    return;
  }
  goToSlide(currentIndex - 1);
};

const stopAutoPlay = () => {
  if (autoPlayId) {
    window.clearInterval(autoPlayId);
    autoPlayId = null;
  }
};

const startAutoPlay = () => {
  stopAutoPlay();
  if (!isPlaying) {
    return;
  }
  autoPlayId = window.setInterval(() => {
    nextSlide();
  }, AUTO_PLAY_DELAY);
};

const toggleAutoPlay = () => {
  isPlaying = !isPlaying;
  toggleButton.setAttribute("aria-pressed", String(!isPlaying));
  toggleButton.textContent = isPlaying ? "⏸ Пауза" : "▶ Автоплей";
  if (isPlaying) {
    startAutoPlay();
  } else {
    stopAutoPlay();
  }
};

const handlePointerDown = (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }
  isDragging = true;
  dragMoved = false;
  startX = event.clientX;
  currentTranslate = -currentIndex * viewport.clientWidth;
  track.classList.add("is-dragging");
  track.setPointerCapture(event.pointerId);
};

const handlePointerMove = (event) => {
  if (!isDragging) {
    return;
  }
  const deltaX = event.clientX - startX;
  if (Math.abs(deltaX) > 4) {
    dragMoved = true;
  }
  const offset = currentTranslate + deltaX;
  track.style.transform = `translateX(${offset}px)`;
};

const handlePointerUp = (event) => {
  if (!isDragging) {
    return;
  }
  isDragging = false;
  track.classList.remove("is-dragging");
  track.releasePointerCapture(event.pointerId);

  const deltaX = event.clientX - startX;
  if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
    if (deltaX < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  } else {
    updateTrack();
  }

  if (dragMoved) {
    event.preventDefault();
  }
};

prevButton.addEventListener("click", () => {
  prevSlide();
  startAutoPlay();
});

nextButton.addEventListener("click", () => {
  nextSlide();
  startAutoPlay();
});

toggleButton.addEventListener("click", toggleAutoPlay);


const handleDotClick = (event) => {
  const target = event.target.closest("[data-slide-to]");
  if (!target) {
    return;
  }
  const index = Number(target.dataset.slideTo);
  if (!Number.isNaN(index)) {
    goToSlide(index);
    startAutoPlay();
  }
};

slider.querySelector(".slider__indicators").addEventListener("click", handleDotClick);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    nextSlide();
    startAutoPlay();
  }
  if (event.key === "ArrowLeft") {
    prevSlide();
    startAutoPlay();
  }
});

viewport.addEventListener("pointerdown", handlePointerDown);
viewport.addEventListener("pointermove", handlePointerMove);
viewport.addEventListener("pointerup", handlePointerUp);
viewport.addEventListener("pointercancel", handlePointerUp);
viewport.addEventListener("pointerleave", handlePointerUp);

window.addEventListener("blur", stopAutoPlay);
window.addEventListener("focus", startAutoPlay);

updateTrack();
startAutoPlay();
