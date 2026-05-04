/* ============================================
   LIBRA LEGAL CONSULTANCY - SHARED JS
   ============================================ */

const logoImage = '<img src="/assets/libralegalLOGO.png" alt="Libra Legal Consultancy logo" class="brand-logo-image" />';

const NAV_PAGES = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'blogs', label: 'Blogs', href: '/blogs' },
  { id: 'about', label: 'About Us', href: '/about' },
  { id: 'contact', label: 'Contact Us', href: '/contact' }
];

const FOOTER_AREAS_1 = [
  ['Arbitration & Award Enforcement', '/services/arbitration_enforcement.html'],
  ['Aviation & Air Transport Law', '/services/aviation_air_transport.html'],
  ['Banking & Financial Law', '/services/banking_financial.html'],
  ['Business Strategy & Legal Advisory', '/services/business_strategy.html'],
  ['Commercial & Trade Law', '/services/commercial_trade.html'],
  ['Construction & Project Law', '/services/construction_project.html'],
  ['Contract Drafting & Legal Review', '/services/contract_drafting.html'],
  ['Corporate Governance & Oversight', '/services/corporate_governance.html'],
  ['Corporate Restructuring & Reorganization', '/services/corporate_restructuring.html'],
  ['Debt Recovery & Legal Enforcement', '/services/debt_recovery.html'],
  ['Employment & Workplace Law', '/services/employment_workplace.html'],
  ['Family & Personal Status Law', '/services/family_personal_status.html'],
  ['Healthcare & Medical Law', '/services/healthcare_medical.html']
];

const FOOTER_AREAS_2 = [
  ['Insurance & Risk Law', '/services/insurance_risk.html'],
  ['International Dispute Resolution', '/services/international_dispute.html'],
  ['Investment Funds & Asset Structuring', '/services/investment_funds.html'],
  ['Last Wills & Succession Planning', '/services/last_wills.html'],
  ['Maritime & Shipping Law', '/services/maritime_shipping.html'],
  ['Mediation & Alternative Dispute Resolution', '/services/mediation_adr.html'],
  ['Mergers, Acquisitions & Corporate Deals', '/services/mergers_acquisitions.html'],
  ['Private Wealth & Family Office Services', '/services/private_wealth.html'],
  ['Project Finance & Infrastructure Law', '/services/project_finance.html'],
  ['Real Estate & Property Law', '/services/real_estate.html'],
  ['Regulatory & Compliance Law', '/services/regulatory_compliance.html'],
  ['Startups & Emerging Business Advisory', '/services/startups_advisory.html'],
  ['UAE Company Formation', '/services/uae_company_formation.html']
];

const LANGUAGE_OPTIONS = [
  { code: 'en', shortLabel: 'EN', label: 'English', flag: 'GB' },
  { code: 'ar', shortLabel: 'AR', label: 'Arabic', flag: 'AE' },
  { code: 'ru', shortLabel: 'RU', label: 'Russian', flag: 'RU' }
];

const LANGUAGE_STORAGE_KEY = 'libra-language';
const TRANSLATABLE_ATTRIBUTE_NAMES = ['placeholder', 'title', 'aria-label', 'alt'];
const TRANSLATION_EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME']);
const WHATSAPP_NUMBER = '971581216686';
const WHATSAPP_MESSAGE = 'Hello, I would like to inquire about your legal services.';
let currentTranslationToken = 0;

function getSavedLanguage() {
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return LANGUAGE_OPTIONS.some((option) => option.code === saved) ? saved : 'en';
}

function getLanguageByCode(code) {
  return LANGUAGE_OPTIONS.find((option) => option.code === code) || LANGUAGE_OPTIONS[0];
}

function setDocumentLanguage(languageCode) {
  const language = getLanguageByCode(languageCode).code;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl-language', language === 'ar');
}

function getFlagEmoji(countryCode) {
  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
}

function getLanguageSwitcherHTML() {
  const active = getLanguageByCode(getSavedLanguage());

  return `
    <div class="lang-switcher" id="langSwitcher">
      <button class="lang-toggle" type="button" id="langToggle" aria-expanded="false" aria-haspopup="true" aria-controls="langMenu">
        <span class="lang-flag">${getFlagEmoji(active.flag)}</span>
        <span class="lang-code">${active.shortLabel}</span>
        <span class="lang-caret">▼</span>
      </button>
      <div class="lang-menu" id="langMenu" role="menu">
        ${LANGUAGE_OPTIONS.map((option) => `
          <button
            class="lang-option${option.code === active.code ? ' active' : ''}"
            type="button"
            data-language="${option.code}"
            role="menuitem"
          >
            <span class="lang-flag">${getFlagEmoji(option.flag)}</span>
            <span>${option.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function getNavHTML(activePage = 'home', transparent = false) {
  const links = NAV_PAGES.map((page) => (
    `<a href="${page.href}" class="${page.id === activePage ? 'active' : ''}">${page.label}</a>`
  )).join('');

  return `
    <nav class="navbar ${transparent ? 'transparent' : 'light'}" id="navbar">
      <div class="nav-inner">
        <a href="/" class="nav-logo">
          <div class="nav-logo-icon">${logoImage}</div>
          <div class="nav-logo-text">
            <span class="nav-logo-name">LIBRA</span>
            <span class="nav-logo-sub">Legal Consultancy FZE</span>
          </div>
        </a>
        <div class="nav-links">${links}</div>
        <div class="nav-right">
          ${getLanguageSwitcherHTML()}
          <a href="/contact" class="btn-consultation">FREE CONSULTATION</a>
        </div>
        <div class="hamburger" id="hamburger" onclick="toggleMobileMenu()">
          <span></span><span></span><span></span>
        </div>
      </div>
    </nav>
    <div class="mobile-menu" id="mobileMenu">
      ${NAV_PAGES.map((page) => `<a href="${page.href}">${page.label}</a>`).join('')}
      <div class="mobile-lang-list">
        ${LANGUAGE_OPTIONS.map((option) => `
          <button class="mobile-lang-option${option.code === getSavedLanguage() ? ' active' : ''}" type="button" data-language="${option.code}">
            <span class="lang-flag">${getFlagEmoji(option.flag)}</span>
            <span>${option.label}</span>
          </button>
        `).join('')}
      </div>
      <a href="/contact" class="btn-consultation">FREE CONSULTATION</a>
    </div>
  `;
}

function getFooterHTML() {
  return `
    <footer>
      <div class="footer-main">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div class="footer-logo">
                <div class="footer-logo-img">${logoImage}</div>
                <span class="footer-logo-name">Libra Legal Consultancy</span>
              </div>
              <p class="footer-tagline">Strategic legal advisory across regulatory, commercial, and dispute-related matters in the UAE.</p>
              <div class="footer-contact">
                <a href="mailto:info@libralegalconsultancy.com"><span class="icon">✉</span> info@libralegalconsultancy.com</a>
                <a href="tel:+971581216686"><span class="icon">📞</span> +971 58 121 6686</a>
                <a href="#"><span class="icon">📍</span> Dubai, United Arab Emirates</a>
              </div>
              <div class="footer-social">
                <a href="#" class="social-icon" title="LinkedIn">in</a>
                <a href="#" class="social-icon" title="Facebook">f</a>
                <a href="#" class="social-icon" title="Instagram">IG</a>
                <a href="#" class="social-icon" title="X">X</a>
                <a href="#" class="social-icon" title="YouTube">▶</a>
                <a href="#" class="social-icon" title="TikTok">TK</a>
              </div>
            </div>
            <div class="footer-col">
              <h4>Practice Areas (1-13)</h4>
              <ul>${FOOTER_AREAS_1.map(([name, href]) => `<li><a href="${href}">${name}</a></li>`).join('')}</ul>
            </div>
            <div class="footer-col">
              <h4>Practice Areas (14-26)</h4>
              <ul>${FOOTER_AREAS_2.map(([name, href]) => `<li><a href="${href}">${name}</a></li>`).join('')}</ul>
            </div>
            <div class="footer-col">
              <h4>The Firm</h4>
              <ul class="footer-firm-links">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About Us</a></li>
                <li><a href="/services">Services</a></li>
                <li><a href="/blogs">Blogs</a></li>
                <li><a href="/contact">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="footer-bottom">
          <p>© 2026 Libra Legal Consultancy. All rights reserved.</p>
          <p>UAE - Legal Advisory & Regulatory Counsel</p>
        </div>
      </div>
    </footer>
  `;
}

function getWhatsAppButtonHTML() {
  const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  return `
    <a
      href="${whatsappUrl}"
      class="whatsapp-float"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M19.11 17.46c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.18-1.34-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.48-.84-2.03-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.98 2.63 1.11 2.82c.14.18 1.92 2.93 4.66 4.11.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.6-.65 1.83-1.27.23-.61.23-1.14.16-1.25-.07-.11-.25-.18-.52-.32Z"/>
        <path fill="currentColor" d="M16.03 3.2c-7.06 0-12.8 5.71-12.8 12.73 0 2.24.59 4.43 1.71 6.36L3.12 28.8l6.7-1.76a12.86 12.86 0 0 0 6.2 1.58h.01c7.05 0 12.78-5.71 12.78-12.74 0-3.4-1.33-6.59-3.76-9-2.42-2.41-5.64-3.74-9.02-3.74Zm0 23.26h-.01a10.7 10.7 0 0 1-5.46-1.5l-.39-.23-3.97 1.04 1.06-3.87-.26-.4a10.52 10.52 0 0 1-1.65-5.63c0-5.83 4.78-10.58 10.68-10.58 2.84 0 5.5 1.1 7.5 3.1a10.46 10.46 0 0 1 3.13 7.48c0 5.83-4.79 10.59-10.63 10.59Z"/>
      </svg>
    </a>
  `;
}

function renderLayout(activePage, transparentNav = false) {
  const navContainer = document.getElementById('nav-placeholder');
  const footerContainer = document.getElementById('footer-placeholder');

  if (navContainer) {
    navContainer.innerHTML = getNavHTML(activePage, transparentNav);
  }

  if (footerContainer) {
    footerContainer.innerHTML = getFooterHTML();
  }

  if (!document.querySelector('.whatsapp-float')) {
    document.body.insertAdjacentHTML('beforeend', getWhatsAppButtonHTML());
  }

  bindLayoutInteractions();
  initNavbar(transparentNav);
  initTranslationSystem();
}

function bindLayoutInteractions() {
  const toggle = document.getElementById('langToggle');
  const switcher = document.getElementById('langSwitcher');
  const menu = document.getElementById('langMenu');

  if (toggle && switcher && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = switcher.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
      if (!switcher.contains(event.target)) {
        switcher.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', async () => {
      const targetLanguage = button.dataset.language || 'en';
      await applyLanguage(targetLanguage);

      if (switcher && toggle) {
        switcher.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  updateLanguageUI(getSavedLanguage());
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

function initNavbar(isTransparent = false) {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
      if (isTransparent) navbar.classList.remove('transparent');
    } else {
      navbar.classList.remove('scrolled');
      if (isTransparent) navbar.classList.add('transparent');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initFadeIn() {
  const elements = document.querySelectorAll('[class*="fade-in"], [class*="scale-up"]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach((element) => observer.observe(element));
}

function staggerChildren(selector, baseDelay = 0, step = 100) {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.dataset.delay = baseDelay + index * step;
  });
}

function updateLanguageUI(languageCode) {
  const language = getLanguageByCode(languageCode);
  const toggle = document.getElementById('langToggle');

  if (toggle) {
    const flagElement = toggle.querySelector('.lang-flag');
    const codeElement = toggle.querySelector('.lang-code');

    if (flagElement) flagElement.textContent = getFlagEmoji(language.flag);
    if (codeElement) codeElement.textContent = language.shortLabel;
  }

  document.querySelectorAll('.lang-option, .mobile-lang-option').forEach((button) => {
    button.classList.toggle('active', button.dataset.language === languageCode);
  });

  setDocumentLanguage(languageCode);
}

function getTextNodes() {
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || TRANSLATION_EXCLUDED_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!node.textContent || !node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  return textNodes;
}

function getAttributeEntries() {
  const entries = [];

  document.querySelectorAll('*').forEach((element) => {
    if (TRANSLATION_EXCLUDED_TAGS.has(element.tagName)) {
      return;
    }

    TRANSLATABLE_ATTRIBUTE_NAMES.forEach((attributeName) => {
      const currentValue = element.getAttribute(attributeName);
      if (!currentValue || !currentValue.trim()) {
        return;
      }

      entries.push({ element, attributeName });
    });
  });

  return entries;
}

function getDocumentMetaEntries() {
  const entries = [];
  const metaDescription = document.querySelector('meta[name="description"]');

  entries.push({
    type: 'title',
    getOriginal() {
      if (!document.documentElement.dataset.originalTitle) {
        document.documentElement.dataset.originalTitle = document.title;
      }

      return document.documentElement.dataset.originalTitle;
    },
    apply(value) {
      document.title = value;
    }
  });

  if (metaDescription) {
    entries.push({
      type: 'meta',
      getOriginal() {
        if (!metaDescription.dataset.originalContent) {
          metaDescription.dataset.originalContent = metaDescription.getAttribute('content') || '';
        }

        return metaDescription.dataset.originalContent;
      },
      apply(value) {
        metaDescription.setAttribute('content', value);
      }
    });
  }

  return entries;
}

function collectTranslatableEntries() {
  const entries = [];

  getTextNodes().forEach((node) => {
    if (!Object.prototype.hasOwnProperty.call(node, '__libraOriginalText')) {
      node.__libraOriginalText = node.textContent;
    }

    entries.push({
      getOriginal() {
        return node.__libraOriginalText;
      },
      apply(value) {
        node.textContent = value;
      }
    });
  });

  getAttributeEntries().forEach(({ element, attributeName }) => {
    const key = `libraOriginal${attributeName.replace(/(^|-)([a-z])/g, (_, __, char) => char.toUpperCase())}`;
    if (!element.dataset[key]) {
      element.dataset[key] = element.getAttribute(attributeName) || '';
    }

    entries.push({
      getOriginal() {
        return element.dataset[key];
      },
      apply(value) {
        element.setAttribute(attributeName, value);
      }
    });
  });

  return [...entries, ...getDocumentMetaEntries()];
}

function restoreOriginalLanguage(entries) {
  entries.forEach((entry) => {
    entry.apply(entry.getOriginal());
  });
}

async function requestTranslations(texts, targetLanguage) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetLanguage,
      texts
    })
  });

  if (!response.ok) {
    throw new Error('Translation request failed.');
  }

  const payload = await response.json();
  return Array.isArray(payload.translations) ? payload.translations : texts;
}

async function applyLanguage(languageCode) {
  const selectedLanguage = getLanguageByCode(languageCode).code;
  const translationToken = ++currentTranslationToken;
  const entries = collectTranslatableEntries();

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
  updateLanguageUI(selectedLanguage);

  restoreOriginalLanguage(entries);

  if (selectedLanguage === 'en') {
    return;
  }

  const uniqueTexts = Array.from(new Set(
    entries
      .map((entry) => entry.getOriginal())
      .filter((value) => value && value.trim())
  ));

  if (!uniqueTexts.length) {
    return;
  }

  document.documentElement.classList.add('is-translating');

  try {
    const translatedTexts = await requestTranslations(uniqueTexts, selectedLanguage);
    if (translationToken !== currentTranslationToken) {
      return;
    }

    const translationMap = new Map(uniqueTexts.map((text, index) => [text, translatedTexts[index] || text]));
    entries.forEach((entry) => {
      const originalText = entry.getOriginal();
      entry.apply(translationMap.get(originalText) || originalText);
    });
  } catch (error) {
    console.error(error);
    restoreOriginalLanguage(entries);
  } finally {
    if (translationToken === currentTranslationToken) {
      document.documentElement.classList.remove('is-translating');
    }
  }
}

function initTranslationSystem() {
  const savedLanguage = getSavedLanguage();
  setDocumentLanguage(savedLanguage);
  updateLanguageUI(savedLanguage);

  if (savedLanguage !== 'en') {
    window.setTimeout(() => {
      applyLanguage(savedLanguage);
    }, 0);
  }
}
