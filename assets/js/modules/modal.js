// Модальные окна на <dialog>: фокус, Esc, клик по фону, анимация закрытия

const CLOSE_MS = 220;

function getDialog(name) {
  return document.querySelector(`[data-modal="${name}"]`);
}

export function closeDialog(dialog) {
  if (!dialog?.open || dialog.classList.contains('is-closing')) return;
  dialog.classList.add('is-closing');
  const finish = () => {
    dialog.classList.remove('is-closing');
    dialog.close();
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else setTimeout(finish, CLOSE_MS);
}

export function openDialog(dialog) {
  if (!dialog) return;
  // Одновременно открыто только одно окно
  document.querySelectorAll('dialog[open]').forEach((d) => d !== dialog && d.close());
  if (!dialog.open) dialog.showModal();
}

export function openModal(name, options = {}) {
  const dialog = getDialog(name);
  if (!dialog) return;
  if (options.title) {
    const title = dialog.querySelector('[data-modal-title]');
    if (title) title.textContent = options.title;
  }
  const interest = dialog.querySelector('[data-modal-interest]');
  if (interest) interest.value = options.title || '';
  const form = dialog.querySelector('[data-lead-form]');
  if (form && options.source) form.dataset.source = options.source;
  openDialog(dialog);
  // На десктопе сразу ставим курсор в первое поле; на сенсорных экранах не вызываем клавиатуру
  if (matchMedia('(pointer: fine)').matches) dialog.querySelector('.field__input')?.focus();
}

export function initModals() {
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-modal-open]');
    if (opener) {
      event.preventDefault();
      openModal(opener.dataset.modalOpen, {
        title: opener.dataset.leadTitle,
        source: opener.dataset.leadSource,
      });
      return;
    }
    const closer = event.target.closest('[data-modal-close]');
    if (closer) closeDialog(closer.closest('dialog'));
  });

  document.querySelectorAll('dialog.modal').forEach((dialog) => {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
    // Клик по подложке: событие приходит на сам dialog вне его содержимого
    dialog.addEventListener('pointerdown', (event) => {
      dialog.dataset.downOnBackdrop = String(event.target === dialog);
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && dialog.dataset.downOnBackdrop === 'true') closeDialog(dialog);
    });
  });
}
