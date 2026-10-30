// Короткие уведомления
let timer;

export function showToast(message, duration = 4000) {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('is-visible'), duration);
}
