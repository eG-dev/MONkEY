// Shared click-prototype runtime: preferences, fictional data, formatting, dialogs, and the application shell.
(() => {
  const runtimeUrl = document.currentScript.src;
  let aboutLoader;
  const PREFS_KEY = 'pm-prototype-preferences';
  const DATA_KEY = 'pm-prototype-data';
  const TODAY = new Date('2026-10-10T12:00:00+02:00');
  const TIME_ZONE = 'Europe/Berlin';
  const CURRENCY = 'EUR';
  const ICONS = {
    menu: '<path d="M4 5h16M4 12h16M4 19h16"/>',
    overview: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    administration: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    user: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>',
    profile: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
    settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
    close: '<path d="M18 6 6 18m0-12 12 12"/>',
    signout: '<path d="m16 17 5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22"/>',
    minus: '<path d="M5 12h14"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    forward: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    error: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    success: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4M21 2l-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    calendar: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'
  };

  const shellStrings = {
    en: {
      overview: 'Overview', accounts: 'Accounts', administration: 'Administration', about: 'About', aboutUnavailable: 'About could not be opened. Please try again.', profile: 'Profile', darkMode: 'Dark mode', signOut: 'Sign out',
      Manager: 'Manager', Member: 'Member', version: 'Version 0.1.0', mainNavigation: 'Main navigation', drawer: 'Navigation', userMenu: 'User menu',
      showNavigation: 'Show navigation', hideNavigation: 'Hide navigation', close: 'Close', cancel: 'Cancel', save: 'Save', saving: 'Saving…',
      tryAgain: 'Try again', saveFailed: 'This could not be saved. Your input is kept; please try again.', required: 'This field is required.',
      notInitialized: 'Not initialized', automatic: 'Automatic'
    },
    de: {
      overview: 'Übersicht', accounts: 'Konten', administration: 'Verwaltung', about: 'Info', aboutUnavailable: 'Info konnte nicht geöffnet werden. Bitte versuche es erneut.', profile: 'Profil', darkMode: 'Dunkler Modus', signOut: 'Abmelden',
      Manager: 'Manager', Member: 'Mitglied', version: 'Version 0.1.0', mainNavigation: 'Hauptnavigation', drawer: 'Navigation', userMenu: 'Benutzermenü',
      showNavigation: 'Navigation anzeigen', hideNavigation: 'Navigation ausblenden', close: 'Schließen', cancel: 'Abbrechen', save: 'Speichern', saving: 'Wird gespeichert…',
      tryAgain: 'Erneut versuchen', saveFailed: 'Das konnte nicht gespeichert werden. Deine Eingaben bleiben erhalten; bitte versuche es erneut.', required: 'Dieses Feld ist erforderlich.',
      notInitialized: 'Nicht initialisiert', automatic: 'Automatisch'
    }
  };

  const defaults = { language: 'en', dark: matchMedia('(prefers-color-scheme: dark)').matches, layout: 'auto', user: 'mara', viewState: 'normal', failNext: false };
  let prefs = { ...defaults, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  let data = JSON.parse(localStorage.getItem(DATA_KEY) || 'null') || window.PM_SEED();
  let pageStrings = { en: {}, de: {} };
  let options = {};

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24">${ICONS[name]}</svg>`;
  const locale = () => prefs.language === 'de' ? 'de-DE' : 'en-US';

  function t(key, params = {}) {
    const text = pageStrings[prefs.language][key] ?? shellStrings[prefs.language][key] ?? pageStrings.en[key] ?? shellStrings.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
  }

  function savePrefs(changes) {
    prefs = { ...prefs, ...changes };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    applyPrefs();
  }

  function saveData() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {
      toast('Prototype storage is full; this change is kept until the page is reloaded.', 'warning');
    }
  }

  const avatar = (item, small = false) => `<span class="avatar${small ? ' avatar-small' : ''}" aria-hidden="true">${item.image ? `<img src="${item.image}" alt="">` : esc(item.name[0])}</span>`;

  function money(minor, { signed = true } = {}) {
    if (minor === null || minor === undefined) {
      return { text: t('notInitialized'), cls: 'muted' };
    }

    const number = new Intl.NumberFormat(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(minor) / 100);
    const sign = !signed || minor === 0 ? '' : minor > 0 ? '+' : '\u2212';
    return { text: `${sign}${number}\u00a0${CURRENCY}`, cls: minor > 0 ? 'amount-positive' : minor < 0 ? 'amount-negative' : 'amount-zero' };
  }

  const amountHtml = (minor, extraClass = '') => {
    const m = money(minor);
    return `<span class="${m.cls} ${extraClass}">${esc(m.text)}</span>`;
  };

  function parseAmount(text, { signed = false } = {}) {
    const value = String(text).trim();
    const pattern = signed ? /^[+\-\u2212]?\d{1,9}([.,]\d{1,2})?$/ : /^\+?\d{1,9}([.,]\d{1,2})?$/;

    if (!pattern.test(value)) {
      return null;
    }

    const negative = /^[-\u2212]/.test(value);
    const [whole, fraction = ''] = value.replace(/^[+\-\u2212]/, '').split(/[.,]/);
    const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    return negative ? -minor : minor;
  }

  const date = (iso, withTime = true) => new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}), timeZone: TIME_ZONE }).format(new Date(iso));
  function businessMonth(iso) {
    const parts = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', timeZone: TIME_ZONE }).formatToParts(new Date(iso));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}`;
  }

  const balance = account => account.history.some(item => item.type === 'opening') ? account.history.reduce((sum, item) => sum + item.amount, 0) : null;
  const currentUser = () => data.users.find(user => user.id === prefs.user) ?? data.users[0];
  const isManager = () => currentUser().role === 'Manager';
  const account = id => data.accounts.find(item => item.id === id);
  const accountsByName = () => [...data.accounts].sort((a, b) => a.name.localeCompare(b.name, locale()));

  function allowanceStatus(item) {
    if (!item.allowance.enabled || item.allowance.amount <= 0) {
      return { configured: false };
    }

    const month = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: TIME_ZONE }).format(TODAY).slice(0, 7);
    const credited = item.history.find(entry => entry.type === 'allowance' && new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: TIME_ZONE }).format(new Date(entry.at)).slice(0, 7) === month);
    const next = new Date('2026-11-01T00:00:00+01:00');
    return { configured: true, amount: item.allowance.amount, credited: credited?.at, failed: item.allowance.failedPeriod === month, next: next.toISOString() };
  }

  // Simulated backend call; "Next save fails" in the prototype settings makes exactly one call fail.
  function request(delay = 600) {
    return new Promise((resolve, reject) => setTimeout(() => {
      if (prefs.failNext) {
        prefs = { ...prefs, failNext: false };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        reject(new Error('simulated'));
      } else {
        resolve();
      }
    }, delay));
  }

  function toast(text, tone = 'success') {
    let host = document.querySelector('.toasts');

    if (!host) {
      host = document.createElement('div');
      host.className = 'toasts';
      host.setAttribute('role', 'status');
      document.body.append(host);
    }

    const item = document.createElement('div');
    item.className = `message message-${tone}`;
    item.innerHTML = `${icon(tone)}<div class="message-body">${esc(text)}</div>`;
    host.append(item);
    setTimeout(() => item.remove(), 4000);
  }

  let dialogCount = 0;

  function dialog({ title, body, footer = '', onClose, dismissible = true }) {
    const trigger = document.activeElement;
    const element = document.createElement('dialog');
    const titleId = `dialog-title-${++dialogCount}`;
    element.className = 'dialog';
    element.setAttribute('aria-labelledby', titleId);
    const closeButton = dismissible ? `<button class="icon-button" type="button" data-close aria-label="${esc(t('close'))}" title="${esc(t('close'))}">${icon('close')}</button>` : '';
    element.innerHTML = `<div class="dialog-header"><h2 id="${titleId}">${esc(title)}</h2>${closeButton}</div><div class="dialog-body">${body}</div>${footer ? `<div class="dialog-footer actions">${footer}</div>` : ''}`;

    if (!dismissible) {
      element.addEventListener('cancel', event => event.preventDefault());
    }

    // Clean up synchronously: callers often open the next dialog right after closing this one.
    const cleanup = () => {
      if (!element.isConnected) {
        return;
      }

      element.remove();
      onClose?.();

      if (trigger?.isConnected && !document.querySelector('dialog[open]')) {
        trigger.focus();
      }
    };
    const nativeClose = element.close.bind(element);
    element.close = () => {
      nativeClose();
      cleanup();
    };
    element.addEventListener('click', event => {
      if (event.target.closest('[data-close]')) {
        element.close();
      }
    });
    element.addEventListener('close', cleanup);
    document.body.append(element);
    element.showModal();
    return element;
  }

  function fieldError(input, message) {
    const field = input.closest('.field');
    field.querySelector('.field-error')?.remove();
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');

    if (message) {
      const id = `${input.id}-error`;
      field.insertAdjacentHTML('beforeend', `<div class="field-error" id="${id}">${icon('error')}${esc(message)}</div>`);
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', id);
    }

    return !message;
  }

  async function openAbout() {
    try {
      aboutLoader ??= Promise.all(['about.js', 'project-license.js'].map(file => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL(file, runtimeUrl).href;
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error('About asset unavailable'));
        };
        document.head.append(script);
      })));
      await aboutLoader;
      window.PM_ABOUT.open();
    } catch {
      aboutLoader = null;
      toast(t('aboutUnavailable'), 'error');
    }
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-about]');

    if (trigger) {
      event.preventDefault();
      trigger.focus();
      openAbout();
    }
  });

  // ---------- Shell ----------
  let shell;
  let wideViewport = matchMedia('(min-width: 1440px)');
  let pinnedNavigation = true;
  let temporaryNavigation = false;

  const isWide = () => prefs.layout === 'wide' || (prefs.layout === 'auto' && wideViewport.matches);

  function buildShell() {
    const content = document.getElementById('view');
    shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML = `
      <header class="header">
        <button class="header-button" id="navigation-toggle" type="button" aria-controls="primary-drawer">${icon('menu')}</button>
        <a href="../accounts-overview/index.html"><img class="logo" src="../../assets/images/monkey.png" alt="POCKET MONkEY"></a>
        <span class="header-spacer"></span>
        <button class="header-button" id="user-toggle" type="button" popovertarget="user-menu" aria-haspopup="menu" aria-expanded="false">${icon('user')}</button>
      </header>
      <aside class="drawer" id="primary-drawer">
        <nav class="navigation" id="main-navigation">
          <a href="../accounts-overview/index.html" data-nav="overview">${icon('overview')}<span data-t="overview"></span></a>
          <a href="../accounts/index.html" data-nav="accounts" data-manager>${icon('wallet')}<span data-t="accounts"></span></a>
          <a class="administration" href="../administration/index.html" data-nav="administration">${icon('administration')}<span data-t="administration"></span></a>
          <button class="about-navigation" type="button" data-about aria-haspopup="dialog">${icon('info')}<span data-t="about"></span></button>
        </nav>
        <div class="application-info"><span class="application-name">POCKET MONkEY</span><span class="application-version" data-t="version"></span></div>
      </aside>
      <main class="workspace" id="workspace"><div class="content"></div></main>`;
    shell.querySelector('.content').append(content);
    document.body.prepend(shell);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="backdrop" id="drawer-backdrop" hidden></div>
      <div class="popover user-menu" id="user-menu" popover role="menu">
        <div class="menu-user"><span class="menu-user-name" id="menu-user-name"></span><span class="menu-user-role" id="menu-user-role"></span></div>
        <div class="menu-divider" role="separator"></div>
        <a class="menu-item" role="menuitem" href="../administration/index.html#profile">${icon('profile')}<span data-t="profile"></span></a>
        <button class="menu-item" type="button" role="menuitemcheckbox" id="dark-mode">${icon('moon')}<span data-t="darkMode"></span><span class="switch" aria-hidden="true"></span></button>
        <a class="menu-item" role="menuitem" href="../login/index.html?signedout=1">${icon('signout')}<span data-t="signOut"></span></a>
        <div class="menu-divider" role="separator"></div>
        <div class="menu-heading">Prototype</div>
        <button class="menu-item" type="button" role="menuitem" id="prototype-toggle">${icon('settings')}Prototype settings</button>
      </div>`);

    const toggle = document.getElementById('navigation-toggle');
    const backdrop = document.getElementById('drawer-backdrop');
    const userMenu = document.getElementById('user-menu');
    const userToggle = document.getElementById('user-toggle');
    const dismissDrawer = () => {
      temporaryNavigation = false;
      renderShell();
      toggle.focus();
    };

    toggle.addEventListener('click', () => {
      if (isWide()) {
        pinnedNavigation = !pinnedNavigation;
      } else {
        temporaryNavigation = !temporaryNavigation;
      }

      renderShell();
    });
    backdrop.addEventListener('click', dismissDrawer);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !isWide() && temporaryNavigation && !userMenu.matches(':popover-open') && !document.querySelector('dialog[open]')) {
        event.preventDefault();
        dismissDrawer();
      }
    });
    userMenu.addEventListener('toggle', event => {
      const open = event.newState === 'open';
      userToggle.setAttribute('aria-expanded', String(open));

      if (open) {
        const bounds = userToggle.getBoundingClientRect();
        const width = userMenu.getBoundingClientRect().width;
        userMenu.style.left = Math.max(12, Math.min(bounds.right - width, innerWidth - width - 12)) + 'px';
        userMenu.style.top = bounds.bottom + 4 + 'px';
        userMenu.querySelector('[role^="menuitem"]').focus();
      }
    });
    userMenu.addEventListener('keydown', event => {
      const items = [...userMenu.querySelectorAll('[role^="menuitem"]')];
      const index = items.indexOf(document.activeElement);

      if (event.key === 'Escape') {
        event.preventDefault();
        userMenu.hidePopover();
        userToggle.focus();
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[target].focus();
      }
    });
    document.getElementById('dark-mode').addEventListener('click', () => savePrefs({ dark: !prefs.dark }));
    document.getElementById('prototype-toggle').addEventListener('click', () => {
      userMenu.hidePopover();
      openPrototypeSettings();
      userToggle.focus();
    });
    wideViewport.addEventListener('change', () => {
      temporaryNavigation = false;
      renderShell();
    });
  }

  function renderShell() {
    if (!shell) {
      return;
    }

    const wide = isWide();
    const open = wide ? pinnedNavigation : temporaryNavigation;
    const toggle = document.getElementById('navigation-toggle');
    const label = open ? t('hideNavigation') : t('showNavigation');
    const user = currentUser();
    shell.dataset.layout = wide ? 'wide' : 'compact';
    shell.dataset.navigation = open ? 'open' : 'closed';
    document.getElementById('primary-drawer').hidden = !open;
    document.getElementById('drawer-backdrop').hidden = wide || !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    document.querySelectorAll('[data-t]').forEach(element => element.textContent = t(element.dataset.t));
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.hidden = link.hasAttribute('data-manager') && !isManager();

      if (link.dataset.nav === options.active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    document.getElementById('main-navigation').setAttribute('aria-label', t('mainNavigation'));
    document.getElementById('primary-drawer').setAttribute('aria-label', t('drawer'));
    document.getElementById('user-menu').setAttribute('aria-label', t('userMenu'));
    document.getElementById('menu-user-name').textContent = user.displayName;
    document.getElementById('menu-user-role').textContent = t(user.role);
    document.getElementById('dark-mode').setAttribute('aria-checked', String(prefs.dark));
    const userLabel = `${user.displayName}, ${t(user.role)}`;
    document.getElementById('user-toggle').setAttribute('aria-label', userLabel);
    document.getElementById('user-toggle').title = userLabel;
  }

  function openPrototypeSettings() {
    const segment = (name, values, current) => `<div class="segments segments-block">${values.map(([value, label]) => `<label><input type="radio" name="${name}" value="${value}" ${String(current) === value ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div>`;
    const states = options.states ?? [];
    const settings = dialog({
      title: 'Prototype settings',
      body: `<form class="form" id="prototype-form">
        <fieldset class="field"><legend class="field-label">Language</legend>${segment('language', [['en', 'English'], ['de', 'Deutsch']], prefs.language)}</fieldset>
        <fieldset class="field"><legend class="field-label">Signed in as</legend>${segment('user', [['mara', 'Manager (Mara)'], ['emma', 'Member (Emma)']], prefs.user)}</fieldset>
        <fieldset class="field"><legend class="field-label">Navigation</legend>${segment('layout', [['auto', 'Auto'], ['compact', 'Compact'], ['wide', 'Wide']], prefs.layout)}</fieldset>
        ${states.length ? `<fieldset class="field"><legend class="field-label">View state</legend>${segment('viewState', states.map(state => [state, state[0].toUpperCase() + state.slice(1)]), prefs.viewState)}</fieldset>` : ''}
        <div class="switch-row"><span class="field-label" id="fail-label">Next save fails</span><button class="switch" type="button" role="switch" id="fail-next" aria-labelledby="fail-label" aria-checked="${prefs.failNext}"></button></div>
        <button class="button button-secondary" type="button" id="reset-data">Reset prototype data</button>
      </form>`
    });
    settings.querySelector('form').addEventListener('change', event => {
      const value = event.target.value;
      savePrefs({ [event.target.name]: value });

      if (event.target.name === 'layout') {
        temporaryNavigation = false;
        renderShell();
      }
    });
    settings.querySelector('#fail-next').addEventListener('click', event => {
      savePrefs({ failNext: !prefs.failNext });
      event.currentTarget.setAttribute('aria-checked', String(prefs.failNext));
    });
    settings.querySelector('#reset-data').addEventListener('click', () => {
      localStorage.removeItem(DATA_KEY);
      data = window.PM_SEED();
      settings.close();
      render();
      toast('Prototype data reset.', 'info');
    });
  }

  function applyPrefs() {
    document.documentElement.lang = prefs.language;
    document.documentElement.dataset.theme = prefs.dark ? 'dark' : 'light';
    render();
  }

  function render() {
    renderShell();

    if (options.title) {
      document.title = `${t(options.title)} – POCKET MONkEY`;
    }

    options.render?.();
  }

  function init(config) {
    options = config;
    pageStrings = { en: {}, de: {}, ...config.strings };

    if (config.shell !== false) {
      buildShell();
    }

    applyPrefs();
  }

  window.PM = {
    init, t, esc, icon, avatar, money, amountHtml, parseAmount, date, businessMonth, balance, allowanceStatus, request, toast, dialog, fieldError, openAbout,
    get prefs() { return prefs; }, savePrefs, get data() { return data; }, saveData, currentUser, isManager, account, accountsByName, render
  };
})();
