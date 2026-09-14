'use strict';

document.documentElement.classList.add('js');

// One-time entrance for content below the fold. Native scrolling stays untouched.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = [...document.querySelectorAll('.section-heading, .audience-item, .masters-media, .masters-copy, .responsibilities-copy, .responsibility-groups > div, .support-note, .contact-copy')];
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const reveal = (element, instant = false) => {
    if (instant) element.classList.add('reveal-instant');
    element.classList.remove('reveal-pending');
    observer.unobserve(element);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
  }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
  for (const element of revealItems) {
    // Never hide content already on screen or above the restored scroll position.
    if (element.getBoundingClientRect().top < innerHeight) continue;
    element.classList.add('scroll-reveal', 'reveal-pending');
    observer.observe(element);
  }
  document.addEventListener('focusin', (event) => {
    const element = event.target.closest('.scroll-reveal');
    if (element) reveal(element, true);
  });
  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    revealItems.forEach(element => reveal(element, true));
    observer.disconnect();
  });
  window.addEventListener('beforeprint', () => revealItems.forEach(element => reveal(element, true)));
}

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');
const pageHeader = document.querySelector('.site-header');
const syncHeader = () => pageHeader?.classList.toggle('is-scrolled', window.scrollY > 20);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });
window.addEventListener('pageshow', syncHeader);
if (menuButton && navigation) {
  const header = document.querySelector('.site-header');
  const mobile = window.matchMedia('(max-width: 720px)');
  let menuScrollY = 0;
  const setMenu = (open, returnFocus = false) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    navigation.classList.toggle('is-open', open);
    header.classList.toggle('is-menu-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) menuScrollY = window.scrollY;
    if (returnFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });
  document.addEventListener('focusin', (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });
  mobile.addEventListener('change', () => setMenu(false));
  window.addEventListener('scroll', () => {
    if (menuButton.getAttribute('aria-expanded') === 'true' && Math.abs(window.scrollY - menuScrollY) > 4) setMenu(false, navigation.contains(document.activeElement));
  }, { passive: true });
}

// Smooth only explicit in-page navigation; wheel and touch scrolling stay native.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || link.matches('.skip-link') || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
  const destination = new URL(link.href,location.href);
  const pagePath = (path) => path.replace(/\/index\.html$/,'/');
  if (destination.origin !== location.origin || pagePath(destination.pathname) !== pagePath(location.pathname) || !destination.hash) return;
  const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
  if (!target) return;
  event.preventDefault();
  const headerHeight = pageHeader?.getBoundingClientRect().height ?? 0;
  const top = target.id === 'top' ? 0 : Math.max(0,target.getBoundingClientRect().top + window.scrollY - headerHeight - 20);
  target.tabIndex = -1;
  target.focus({preventScroll:true});
  if (location.hash) history.replaceState(history.state,'',location.pathname + location.search);
  window.scrollTo({top,behavior:reducedMotion.matches ? 'auto' : 'smooth'});
});

const form = document.getElementById('inquiry-form');
if (form) {
  const status = document.getElementById('form-status');
  const submitButton = document.getElementById('inquiry-submit');
  const ids = ['name', 'phone', 'email', 'object-type', 'specialization', 'quantity', 'consent'];
  let attempted = false;
  const contactButtons = [...form.querySelectorAll('[data-contact-method]')];
  const setContactMethod = (method) => {
    for (const id of ['phone', 'email']) {
      const input = document.getElementById(id);
      const active = id === method;
      input.hidden = !active; input.disabled = !active; input.required = active;
      input.removeAttribute('aria-invalid');
      const error = document.getElementById(`${id}-error`);
      error.textContent = ''; error.hidden = !active;
    }
    contactButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.contactMethod === method)));
    status.textContent = '';
  };
  contactButtons.forEach(button => button.addEventListener('click', () => setContactMethod(button.dataset.contactMethod)));
  const phone = document.getElementById('phone');
  phone.addEventListener('input', () => {
    const raw = phone.value;
    const cursor = phone.selectionStart ?? raw.length;
    const atEnd = cursor === raw.length;
    let digitsBefore = raw.slice(0,cursor).replace(/\D/g,'').length;
    let digits = raw.replace(/\D/g,'');
    if (!digits) { phone.value = ''; return; }
    if (raw.trim().startsWith('+') && !digits.startsWith('7')) {
      phone.value = `+${digits.slice(0,15)}`;
      return;
    }
    if (/^[78]/.test(digits)) digits = digits.slice(1);
    else digitsBefore += 1;
    digits = digits.slice(0,10);
    phone.value = '+7' + (digits ? ` (${digits.slice(0,3)}` : '') + (digits.length >= 3 ? ')' : '') + (digits.length > 3 ? ` ${digits.slice(3,6)}` : '') + (digits.length > 6 ? `-${digits.slice(6,8)}` : '') + (digits.length > 8 ? `-${digits.slice(8,10)}` : '');
    const positions = [...phone.value.matchAll(/\d/g)].map(match => match.index + 1);
    const nextCursor = atEnd ? phone.value.length : (positions[Math.max(0,digitsBefore - 1)] ?? phone.value.length);
    phone.setSelectionRange(nextCursor,nextCursor);
  });
  // Deleting next to a bracket or dash removes a digit instead of getting stuck.
  phone.addEventListener('keydown', (event) => {
    if (!['Backspace','Delete'].includes(event.key) || phone.selectionStart !== phone.selectionEnd) return;
    const cursor = phone.selectionStart;
    if (event.key === 'Backspace' && cursor > 0 && /\D/.test(phone.value[cursor - 1])) {
      let start = cursor - 1;
      while (start > 0 && /\D/.test(phone.value[start])) start--;
      event.preventDefault(); phone.setRangeText('',start,cursor,'end');
      phone.dispatchEvent(new Event('input',{bubbles:true}));
    } else if (event.key === 'Delete' && cursor < phone.value.length && /\D/.test(phone.value[cursor])) {
      let end = cursor;
      while (end < phone.value.length && /\D/.test(phone.value[end])) end++;
      event.preventDefault(); phone.setRangeText('',cursor,end + 1,'end');
      phone.dispatchEvent(new Event('input',{bubbles:true}));
    }
  });
  const errorFor = (field) => {
    const value = field.value.trim();
    switch (field.id) {
      case 'name': return value.length >= 2 ? '' : 'Укажите имя: не меньше двух символов.';
      case 'phone': {
        const digits = value.replace(/\D/g, '');
        return /^[+\d\s()\-]+$/.test(value) && (digits.startsWith('7') ? digits.length === 11 : digits.length >= 10 && digits.length <= 15) ? '' : 'Введите номер телефона полностью.';
      }
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Укажите почту, например name@company.ru.';
      case 'object-type': return value ? '' : 'Выберите тип вашего объекта.';
      case 'specialization': return value ? '' : 'Выберите направление или обсуждение с менеджером.';
      case 'quantity': return /^(?:[1-9]|10|more)$/.test(value) ? '' : 'Выберите количество мастеров.';
      case 'consent': return field.checked ? '' : 'Для продолжения отметьте согласие.';
      default: return '';
    }
  };
  const validateField = (field) => {
    const error = errorFor(field);
    document.getElementById(`${field.id}-error`).textContent = error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  };
  const validate = () => {
    attempted = true;
    const invalid = ids.map((id) => document.getElementById(id)).filter((field) => !field.disabled && !validateField(field));
    if (invalid.length) {
      status.dataset.state = 'error';
      status.textContent = 'Проверьте выделенные поля.';
      invalid[0].focus();
    } else {
      status.dataset.state = 'notice';
      const call = document.createElement('a');
      call.href = 'tel:+79853603838';
      call.textContent = '+7 (985) 360-38-38';
      const email = document.createElement('a');
      email.href = 'mailto:info@balistaff.ru';
      email.textContent = 'info@balistaff.ru';
      status.replaceChildren('Онлайн-отправка пока недоступна. Заявка не отправлена. Позвоните ', call, ' или напишите на ', email, ' — обсудим ваш запрос.');
      status.focus({ preventScroll: true });
      status.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  };
  // Delivery is deferred by the client. Intercept before enabling the submit
  // control; keep values in the page and never report a successful submission.
  form.addEventListener('submit', (event) => { event.preventDefault(); validate(); });
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('input:not([type="checkbox"])')) { event.preventDefault(); validate(); }
  });
  submitButton.disabled = false;
  form.addEventListener('input', (event) => {
    status.textContent = '';
    if (attempted && ids.includes(event.target.id)) validateField(event.target);
  });
  form.addEventListener('change', (event) => {
    status.textContent = '';
    if (attempted && ids.includes(event.target.id)) validateField(event.target);
  });
  // Browser back navigation may retain entered values. No cookies or web storage.
}
