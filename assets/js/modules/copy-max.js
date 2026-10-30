// MAX не поддерживает ссылку по номеру телефона, поэтому копируем номер
import { CONTACTS } from '../config.js';
import { showToast } from './toast.js';

export function initCopyMax() {
  document.addEventListener('click', async (event) => {
    if (!event.target.closest('[data-copy-max]')) return;
    try {
      await navigator.clipboard.writeText(CONTACTS.messengerPhone);
      showToast(`Номер ${CONTACTS.messengerPhoneDisplay} скопирован — найдите контакт в MAX`);
    } catch {
      showToast(`MAX: ${CONTACTS.messengerPhoneDisplay}`, 6000);
    }
  });
}
