// Маска телефона +7 (XXX) XXX-XX-XX

const MAX_DIGITS = 10;

export function extractDigits(value) {
  let digits = value.replace(/\D/g, '');
  // «8 9xx…» и «7 9xx…» приводим к национальному номеру
  if (digits.length > MAX_DIGITS && /^[78]/.test(digits)) digits = digits.slice(1);
  else if (digits.length === 11 && /^[78]/.test(digits)) digits = digits.slice(1);
  return digits.slice(0, MAX_DIGITS);
}

export function formatPhone(digits) {
  if (!digits) return '';
  let out = '+7 (' + digits.slice(0, 3);
  if (digits.length >= 3) out += ') ';
  if (digits.length > 3) out += digits.slice(3, 6);
  if (digits.length > 6) out += '-' + digits.slice(6, 8);
  if (digits.length > 8) out += '-' + digits.slice(8, 10);
  return out;
}

export function isPhoneComplete(value) {
  return extractDigits(value).length === MAX_DIGITS;
}

export function toE164(value) {
  return '+7' + extractDigits(value);
}

function normalizeTyped(raw) {
  // При вводе поверх маски убираем её префикс «+7», чтобы не принять 7 за цифру номера
  const stripped = raw.startsWith('+7') ? raw.slice(2) : raw;
  let digits = stripped.replace(/\D/g, '');
  if (!raw.startsWith('+7') && digits.length === 11 && /^[78]/.test(digits)) digits = digits.slice(1);
  if (!raw.startsWith('+7') && digits.length === 1 && /^[78]/.test(digits)) digits = '';
  return digits.slice(0, MAX_DIGITS);
}

export function attachPhoneMask(input) {
  input.addEventListener('keydown', (event) => {
    // Backspace сразу за символом маски удаляет предыдущую цифру
    if (event.key !== 'Backspace' || input.selectionStart !== input.selectionEnd) return;
    const pos = input.selectionStart;
    const prev = input.value[pos - 1];
    if (pos > 0 && prev && /\D/.test(prev)) {
      event.preventDefault();
      const head = input.value.slice(0, pos).replace(/^\+7/, '').replace(/\D/g, '').slice(0, -1);
      const tail = input.value.slice(pos).replace(/\D/g, '');
      input.value = formatPhone((head + tail).slice(0, MAX_DIGITS));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  input.addEventListener('input', () => {
    const atEnd = input.selectionStart === input.value.length;
    const digitsBeforeCaret = normalizeTyped(input.value.slice(0, input.selectionStart)).length;
    const digits = normalizeTyped(input.value);
    input.value = formatPhone(digits);
    if (atEnd) return;
    // Возвращаем курсор после той же по счёту цифры
    let seen = 0;
    let caret = input.value.length;
    for (let i = 4; i < input.value.length; i += 1) {
      if (/\d/.test(input.value[i])) seen += 1;
      if (seen === digitsBeforeCaret) { caret = i + 1; break; }
    }
    input.setSelectionRange(caret, caret);
  });

  input.addEventListener('focus', () => {
    if (!input.value) input.placeholder = '+7 (___) ___-__-__';
  });

  input.addEventListener('paste', (event) => {
    const text = event.clipboardData?.getData('text');
    if (!text) return;
    event.preventDefault();
    input.value = formatPhone(extractDigits(text));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
