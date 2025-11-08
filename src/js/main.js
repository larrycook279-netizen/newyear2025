const SNOWFLAKE_COUNT = 36;
const CTA_DEADLINE_MONTH = 11; // December (0-indexed)
const CTA_DEADLINE_DAY = 15;

const selectors = {
  snowfall: '.snowfall',
  reveal: '.reveal',
  countdownDays: '[data-countdown="days"]',
  countdownHours: '[data-countdown="hours"]',
  countdownMinutes: '[data-countdown="minutes"]',
  countdownSeconds: '[data-countdown="seconds"]',
  form: '#order-form',
  formMessage: '[data-form-message]'
};

function createSnowfall(container) {
  if (!container) return;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < SNOWFLAKE_COUNT; i += 1) {
    const flake = document.createElement('span');
    flake.className = 'snowfall__flake';
    const delay = Math.random() * 10;
    const duration = 12 + Math.random() * 10;
    const left = Math.random() * 100;
    const size = Math.random() * 4 + 4;

    flake.style.left = `${left}%`;
    flake.style.animationDelay = `${delay}s`;
    flake.style.animationDuration = `${duration}s`;
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;

    fragment.appendChild(flake);
  }

  container.appendChild(fragment);
}

function getDeadlineDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const deadline = new Date(currentYear, CTA_DEADLINE_MONTH, CTA_DEADLINE_DAY, 23, 59, 59);

  if (deadline < now) {
    return new Date(currentYear + 1, CTA_DEADLINE_MONTH, CTA_DEADLINE_DAY, 23, 59, 59);
  }

  return deadline;
}

function updateCountdown(deadline) {
  const now = new Date();
  const diff = deadline - now;
  const elements = {
    days: document.querySelector(selectors.countdownDays),
    hours: document.querySelector(selectors.countdownHours),
    minutes: document.querySelector(selectors.countdownMinutes),
    seconds: document.querySelector(selectors.countdownSeconds)
  };

  if (diff <= 0) {
    Object.values(elements).forEach((el) => {
      if (el) el.textContent = '00';
    });
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (elements.days) elements.days.textContent = String(days).padStart(2, '0');
  if (elements.hours) elements.hours.textContent = String(hours).padStart(2, '0');
  if (elements.minutes) elements.minutes.textContent = String(minutes).padStart(2, '0');
  if (elements.seconds) elements.seconds.textContent = String(seconds).padStart(2, '0');
}

function initCountdown() {
  const deadline = getDeadlineDate();
  updateCountdown(deadline);
  setInterval(() => updateCountdown(deadline), 1000);
}

function initRevealAnimations() {
  const revealItems = document.querySelectorAll(selectors.reveal);
  if (!('IntersectionObserver' in window) || !revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function validateField(field) {
  if (!field) return true;
  const value = field.value.trim();
  const isEmail = field.type === 'email';
  const required = field.hasAttribute('required');

  if (!required && !value) {
    field.classList.remove('input-error');
    return true;
  }

  if (!value) {
    field.classList.add('input-error');
    return false;
  }

  if (isEmail) {
    const emailPattern = /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
    const valid = emailPattern.test(value.toLowerCase());
    field.classList.toggle('input-error', !valid);
    return valid;
  }

  field.classList.remove('input-error');
  return true;
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.target;
  const message = form.querySelector(selectors.formMessage);

  const fields = Array.from(form.elements).filter((element) =>
    element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT'
  );

  const isValid = fields.every((field) => validateField(field));

  if (!isValid) {
    if (message) {
      message.textContent = 'Пожалуйста, заполните обязательные поля.';
    }
    return;
  }

  const endpoint = form.getAttribute('data-endpoint');
  const payload = Object.fromEntries(new FormData(form).entries());

  if (message) {
    message.textContent = 'Отправляем пожелания Деду Морозу...';
  }

  if (!endpoint) {
    if (message) {
      message.textContent = 'Заявка сохранена. Подключите Telegram или Email в настройках.';
    }
    form.reset();
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    if (message) {
      message.textContent = 'Спасибо! Мы уже передали заявку Деду Морозу.';
    }
    form.reset();
  } catch (error) {
    if (message) {
      message.textContent = 'Не удалось отправить заявку. Попробуйте позже или напишите нам.';
    }
    console.error(error);
  }
}

function initForm() {
  const form = document.querySelector(selectors.form);
  if (!form) return;

  form.addEventListener('submit', submitForm);

  Array.from(form.elements).forEach((element) => {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      element.addEventListener('blur', () => validateField(element));
    }
  });
}

function initSmoothAnchor() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      event.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  createSnowfall(document.querySelector(selectors.snowfall));
  initCountdown();
  initRevealAnimations();
  initForm();
  initSmoothAnchor();
});
