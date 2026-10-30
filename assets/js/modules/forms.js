// Формы заявок: валидация, состояния ошибок, передача в lead-service
import { attachPhoneMask, isPhoneComplete, toE164 } from './phone-mask.js';
import { submitLead, LeadStatus } from './lead-service.js';
import { CONTACTS } from '../config.js';
import { openModal } from './modal.js';
import { showToast } from './toast.js';

const MESSAGES = {
  nameRequired: 'Укажите имя',
  nameShort: 'Имя должно быть не короче 2 символов',
  phoneRequired: 'Укажите телефон',
  phoneIncomplete: 'Введите номер полностью: 10 цифр после +7',
  consentRequired: 'Подтвердите согласие на обработку данных',
  failed: 'Не удалось отправить заявку. Позвоните нам: ' + CONTACTS.salesPhoneDisplay,
};

function validateField(input) {
  const value = input.value.trim();
  if (input.type === 'checkbox') return input.checked ? '' : MESSAGES.consentRequired;
  if (input.name === 'name') {
    if (!value) return MESSAGES.nameRequired;
    if (value.length < 2) return MESSAGES.nameShort;
  }
  if (input.name === 'phone') {
    if (!value) return MESSAGES.phoneRequired;
    if (!isPhoneComplete(value)) return MESSAGES.phoneIncomplete;
  }
  return '';
}

function setFieldState(input, error) {
  const field = input.closest('.field');
  if (!field) return;
  const errorEl = field.querySelector('.field__error');
  field.classList.toggle('is-invalid', Boolean(error));
  field.classList.toggle('is-valid', !error && input.type !== 'checkbox' && input.value.trim() !== '');
  input.setAttribute('aria-invalid', error ? 'true' : 'false');
  if (errorEl) {
    if (!errorEl.id) errorEl.id = `${input.id || input.name}-${Math.random().toString(36).slice(2, 7)}-error`;
    input.setAttribute('aria-describedby', errorEl.id);
    errorEl.textContent = error;
  }
}

function collect(form) {
  const data = new FormData(form);
  return {
    name: String(data.get('name') || '').trim(),
    phone: toE164(String(data.get('phone') || '')),
    message: String(data.get('message') || '').trim() || undefined,
    interest: String(data.get('interest') || '').trim() || undefined,
    source: form.dataset.source || 'site',
  };
}

function buildWhatsappText(lead) {
  const parts = [`Здравствуйте! Меня зовут ${lead.name}.`];
  if (lead.interest) parts.push(`Тема: ${lead.interest}.`);
  else parts.push('Хочу получить презентацию ALEX Resort & Spa Apartments.');
  if (lead.message) parts.push(lead.message);
  parts.push(`Мой телефон: ${lead.phone}`);
  return `${CONTACTS.whatsappUrl}?text=${encodeURIComponent(parts.join(' '))}`;
}

function showNotConnected(lead) {
  const waLink = document.querySelector('[data-notice-wa]');
  if (waLink) waLink.href = buildWhatsappText(lead);
  openModal('notice');
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const inputs = [...form.querySelectorAll('input[required], input[name="phone"]')];
  let firstInvalid = null;
  inputs.forEach((input) => {
    const error = validateField(input);
    setFieldState(input, error);
    if (error && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  const lead = collect(form);
  const result = await submitLead(lead);
  button.disabled = false;
  button.removeAttribute('aria-busy');

  if (result.status === LeadStatus.NOT_CONNECTED) {
    showNotConnected(lead);
  } else if (result.status === LeadStatus.SENT) {
    form.reset();
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-valid', 'is-invalid'));
    showToast('Заявка отправлена. Отдел продаж свяжется с вами.');
  } else {
    showToast(MESSAGES.failed, 6000);
  }
}

export function initForms() {
  document.querySelectorAll('[data-phone]').forEach(attachPhoneMask);

  document.querySelectorAll('[data-lead-form]').forEach((form) => {
    form.addEventListener('submit', handleSubmit);
    form.querySelectorAll('input:not([type="hidden"])').forEach((input) => {
      // Ошибку показываем после ухода из поля, исправление — сразу при вводе
      input.addEventListener('blur', () => {
        if (input.type === 'checkbox' || input.value.trim() === '') return;
        setFieldState(input, validateField(input));
      });
      input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
        const field = input.closest('.field');
        if (field?.classList.contains('is-invalid')) setFieldState(input, validateField(input));
      });
    });
  });
}
