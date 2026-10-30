// Точка входа
import { initHeader, initMobileMenu, initActiveSection } from './modules/nav.js';
import { initModals } from './modules/modal.js';
import { initForms } from './modules/forms.js';
import { initLightbox } from './modules/lightbox.js';
import { initGallery } from './modules/gallery.js';
import { initFloors } from './modules/floors.js';
import { initTabs } from './modules/tabs.js';
import { initHeroVideo } from './modules/hero-video.js';
import { initCopyMax } from './modules/copy-max.js';
import { initAnimations } from './modules/animations.js';
import { initFloating } from './modules/floating.js';
import { initContactFab } from './modules/contact-fab.js';
import { initFooterWaves } from './modules/footer-waves.js';
import { initFooterSea } from './modules/footer-sea.js';
import { initCursorTrail } from './modules/cursor-trail.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { CURSOR_TRAIL, SMOOTH_SCROLL } from './config.js';

initAnimations();
if (SMOOTH_SCROLL.enabled) {
  const { enabled, ...scrollOptions } = SMOOTH_SCROLL;
  initSmoothScroll(scrollOptions);
}
initHeader();
initMobileMenu();
initActiveSection();
initModals();
initForms();
initLightbox();
initGallery();
initTabs();
initFloors();
initCopyMax();
initFloating();
initContactFab();
initFooterWaves();
initFooterSea();
initHeroVideo();

if (CURSOR_TRAIL.enabled) {
  const { enabled, ...trailOptions } = CURSOR_TRAIL;
  window.AlexCursorTrail = initCursorTrail(trailOptions);
}
