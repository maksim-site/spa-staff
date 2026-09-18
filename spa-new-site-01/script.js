'use strict';
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const disclosures = [];
  function enhanceDisclosure(details, panel, index) {
    const trigger = details.querySelector('summary');
    let expanded = details.open;
    let finishTimer;
    panel.id ||= `disclosure-panel-${index}`;
    details.classList.add('disclosure-enhanced');
    trigger.setAttribute('aria-controls', panel.id);

    function syncState() {
      details.dataset.expanded = String(expanded);
      trigger.setAttribute('aria-expanded', String(expanded));
      panel.inert = !expanded;
      if (details.classList.contains('mobile-menu')) {
        trigger.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
        trigger.querySelector('.menu-label').textContent = expanded ? 'Закрыть' : 'Меню';
      }
    }
    function finish() {
      clearTimeout(finishTimer);
      panel.classList.add('disclosure-instant');
      details.open = expanded;
      panel.style.height = '';
      panel.style.opacity = '';
      panel.classList.remove('is-animating');
      syncState();
    }
    function setExpanded(next, { instant = false } = {}) {
      clearTimeout(finishTimer);
      const wasOpen = details.open;
      const startHeight = wasOpen ? panel.getBoundingClientRect().height : 0;
      const startOpacity = wasOpen ? getComputedStyle(panel).opacity : '0';
      expanded = next;
      details.classList.toggle('disclosure-instant', instant || reduceMotion.matches);
      syncState();
      if (instant || reduceMotion.matches) { finish(); return; }

      // Capture the current frame before retargeting, including interrupted transitions.
      panel.classList.add('disclosure-instant', 'is-animating');
      details.open = true;
      panel.style.height = `${startHeight}px`;
      panel.style.opacity = startOpacity;
      void panel.offsetHeight;
      panel.classList.remove('disclosure-instant');
      panel.style.height = `${expanded ? panel.scrollHeight : 0}px`;
      panel.style.opacity = expanded ? '1' : '0';
      finishTimer = setTimeout(finish, 280);
    }
    trigger.addEventListener('click', event => {
      event.preventDefault();
      setExpanded(!expanded, { instant: event.detail === 0 });
    });
    syncState();
    const controller = { setExpanded, finish };
    disclosures.push(controller);
    return controller;
  }
  const menu = document.querySelector('.mobile-menu');
  const summary = menu.querySelector('summary');
  const menuDisclosure = enhanceDisclosure(menu, menu.querySelector('.menu-panel'), 0);
  document.querySelectorAll('.faq details').forEach((details, index) => {
    enhanceDisclosure(details, details.querySelector('.faq-answer'), index + 1);
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menuDisclosure.setExpanded(false, { instant: true });
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menuDisclosure.setExpanded(false, { instant: true }); summary.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menuDisclosure.setExpanded(false);
  });
  const mobileQuery = window.matchMedia('(max-width: 620px)');
  mobileQuery.addEventListener('change', () => menuDisclosure.setExpanded(false, { instant: true }));
  window.addEventListener('resize', () => disclosures.forEach(item => item.finish()));
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) disclosures.forEach(item => item.finish());
  });

  const selector = document.querySelector('.format-selector');
  const tabList = selector.querySelector('.format-tabs');
  const tabs = [...selector.querySelectorAll('[data-format]')];
  const panels = [...selector.querySelectorAll('[data-panel]')];
  selector.classList.add('has-tabs');
  tabList.setAttribute('role', 'tablist');
  function selectFormat(key, focus = false) {
    tabs.forEach(tab => {
      const selected = tab.dataset.format === key;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.panel !== key; });
  }
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', `panel-${tab.dataset.format}`);
    tab.addEventListener('click', () => selectFormat(tab.dataset.format));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectFormat(tabs[next].dataset.format, true); }
    });
  });
  panels.forEach(panel => {
    panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `tab-${panel.dataset.panel}`); panel.tabIndex = 0;
  });
  selectFormat('hotel');

  const form = document.querySelector('#request-form');
  const status = document.querySelector('#form-status');
  const button = document.querySelector('#check-request');
  const fields = [...form.querySelectorAll('input, select, textarea')];
  let validated = false;
  const validPhone = value => {
    const v = value.trim();
    return /^\+?[\d\s()\-]+$/.test(v) && v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 15;
  };
  function messageFor(field) {
    const value = field.value.trim();
    if (field.id === 'name' && !value) return 'Укажите ваше имя.';
    if (field.id === 'phone' && !validPhone(value)) return 'Укажите корректный номер телефона.';
    if (field.id === 'count' && (!value || !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 100)) return 'Укажите целое число от 1 до 100.';
    return '';
  }
  function validateField(field) {
    const message = messageFor(field);
    document.querySelector(`#${field.id}-error`).textContent = message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }
  function checkRequest() {
    validated = true;
    const validity = fields.map(validateField);
    const valid = validity.every(Boolean);
    status.hidden = false;
    status.classList.toggle('is-error', !valid);
    status.textContent = valid
      ? 'Онлайн-отправка пока недоступна. Заявка не отправлена.'
      : 'Проверьте выделенные поля.';
    if (!valid) fields[validity.indexOf(false)].focus();
  }
  button.disabled = false;
  form.addEventListener('submit', event => { event.preventDefault(); checkRequest(); });
  fields.forEach(field => field.addEventListener('input', () => {
    status.hidden = true;
    if (validated) validateField(field);
  }));

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 60px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('reveal-ready'); observer.observe(el); }
    });
    reduceMotion.addEventListener('change', () => {
      if (reduceMotion.matches) {
        document.querySelectorAll('.reveal-ready').forEach(el => el.classList.add('is-visible'));
        observer.disconnect();
      }
    });
  }
})();
