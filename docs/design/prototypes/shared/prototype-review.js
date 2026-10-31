'use strict';

window.PrototypeReview = (() => {
  const embedded = new URLSearchParams(location.search).get('embedded') === '1' && window.parent !== window;
  const frameOrigin = location.protocol === 'file:' ? 'null' : location.origin;
  const targetOrigin = frameOrigin === 'null' ? '*' : frameOrigin;
  const types = ['select', 'checkbox', 'button'];
  const groups = ['Settings', 'States'];
  const dragThreshold = 24;
  const icons = {
    review: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    close: '<path d="M18 6 6 18m0-12 12 12"/>'
  };
  const icon = name => `<svg class="prototype-review-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  const limit = (value, length) => typeof value === 'string' ? value.slice(0, length) : '';
  const isShortcut = event => event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyR';
  const valid = (control, value) => control.type === 'select' ? control.options.some(option => option.value === value) : control.type === 'checkbox' ? typeof value === 'boolean' : value === true;

  function link(entry) {
    try {
      const url = new URL(entry.href, location.href);
      if (url.protocol !== location.protocol || url.host !== location.host) return null;
      return { label: limit(entry.label, 80) || url.pathname.split('/').pop(), href: url.href };
    } catch { return null; }
  }

  // Frames are untrusted inputs to the host: keep only known control shapes and plain text.
  function sanitize(config) {
    if (!config || typeof config !== 'object') return null;
    const controls = (Array.isArray(config.controls) ? config.controls : []).slice(0, 20).flatMap(control => {
      if (!control || !types.includes(control.type) || typeof control.name !== 'string' || !/^[a-z][\w-]{0,40}$/i.test(control.name)) return [];
      const options = control.type !== 'select' ? [] : (Array.isArray(control.options) ? control.options : []).slice(0, 20)
        .filter(option => option && typeof option.value === 'string')
        .map(option => ({ value: limit(option.value, 60), label: limit(option.label, 80) || limit(option.value, 80) }));
      if (control.type === 'select' && !options.length) return [];
      const value = control.type === 'checkbox' ? control.value === true
        : control.type === 'select' ? (options.some(option => option.value === control.value) ? control.value : options[0].value) : null;
      return [{ name: control.name, type: control.type, label: limit(control.label, 80) || control.name, group: groups.includes(control.group) ? control.group : 'States', options, value, disabled: control.disabled === true }];
    });
    return {
      title: limit(config.title, 100) || 'View',
      controls,
      notes: (Array.isArray(config.notes) ? config.notes : []).slice(0, 10).map(note => limit(note, 600)).filter(Boolean),
      links: (Array.isArray(config.links) ? config.links : []).slice(0, 10).map(entry => entry && link(entry)).filter(Boolean)
    };
  }

  const sources = new Map();
  let element;
  let toggle;
  let body;
  let content;
  let corner = { block: 'end', inline: 'end' };
  let frames = () => [];
  let activeFrame = () => null;

  function setOpen(open) {
    body.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) element.querySelector('.prototype-review-close').focus();
  }

  function place() {
    element.dataset.prototypeReviewBlock = corner.block;
    element.dataset.prototypeReviewInline = corner.inline;
  }

  // Corners are stored logically; physical left/right depends on the reading direction.
  function moveTo(left, top) {
    const rtl = getComputedStyle(element).direction === 'rtl';
    if (left !== null) corner.inline = left === rtl ? 'end' : 'start';
    if (top !== null) corner.block = top ? 'start' : 'end';
    place();
  }

  function enableDragging() {
    let start = null;
    let dragged = false;
    toggle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY };
      dragged = false;
      toggle.setPointerCapture(event.pointerId);
    });
    toggle.addEventListener('pointermove', event => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!dragged && Math.hypot(dx, dy) < dragThreshold) return;
      dragged = true;
      toggle.style.translate = `${dx}px ${dy}px`;
    });
    const finish = event => {
      if (!start) return;
      start = null;
      toggle.style.translate = '';
      if (dragged) moveTo(event.clientX < innerWidth / 2, event.clientY < innerHeight / 2);
    };
    toggle.addEventListener('pointerup', finish);
    toggle.addEventListener('pointercancel', finish);
    toggle.addEventListener('click', event => {
      if (dragged) { dragged = false; event.stopImmediatePropagation(); return; }
      setOpen(body.hidden);
    });
    toggle.addEventListener('keydown', event => {
      const moves = { ArrowLeft: [true, null], ArrowRight: [false, null], ArrowUp: [null, true], ArrowDown: [null, false] };
      if (!moves[event.key] || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      moveTo(...moves[event.key]);
    });
  }

  function toggleHidden() {
    if (!element) return;
    element.hidden = !element.hidden;
    if (element.hidden) setOpen(false);
  }

  function build() {
    if (element) return;
    element = document.createElement('div');
    element.className = 'prototype-review';
    element.innerHTML = `<button type="button" class="prototype-review-toggle" aria-expanded="false" aria-controls="prototype-review-body" aria-label="Prototype review" title="Prototype review: drag or use arrow keys to move it to another corner; Alt+Shift+R hides it">${icon('review')}</button>`
      + `<section class="prototype-review-body" id="prototype-review-body" aria-labelledby="prototype-review-title" hidden><header class="prototype-review-header"><h2 id="prototype-review-title">Prototype review</h2>`
      + `<button type="button" class="prototype-review-close" aria-label="Close prototype review" title="Close">${icon('close')}</button></header>`
      + '<p class="prototype-review-hint">Review tooling, not part of the design. Drag the round button, or use arrow keys on it, to move it to another corner; Alt+Shift+R hides or shows it.</p><div class="prototype-review-content"></div></section>';
    toggle = element.querySelector('.prototype-review-toggle');
    body = element.querySelector('.prototype-review-body');
    content = element.querySelector('.prototype-review-content');
    enableDragging();
    element.querySelector('.prototype-review-close').addEventListener('click', () => { setOpen(false); toggle.focus(); });
    body.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      toggle.focus();
    });
    content.addEventListener('change', event => {
      const control = event.target.closest('[data-prototype-review-control]');
      if (control && control.tagName !== 'BUTTON') emit(control, control.type === 'checkbox' ? control.checked : control.value);
    });
    content.addEventListener('click', event => {
      const control = event.target.closest('button[data-prototype-review-control]');
      if (control) emit(control, true);
    });
    document.addEventListener('keydown', event => {
      if (!isShortcut(event)) return;
      event.preventDefault();
      toggleHidden();
    });
    document.body.append(element);
    place();
  }

  function emit(control, value) {
    const source = sources.get(control.dataset.prototypeReviewSource);
    const definition = source?.config.controls.find(item => item.name === control.dataset.prototypeReviewControl);
    if (definition && !definition.disabled && valid(definition, value)) source.change(definition.name, value);
  }

  function renderSource(key, config) {
    const section = document.createElement('section');
    section.className = 'prototype-review-source';
    const heading = document.createElement('h3');
    heading.textContent = config.title;
    section.append(heading);
    for (const group of groups) {
      const controls = config.controls.filter(control => control.group === group);
      if (!controls.length) continue;
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'prototype-review-group';
      const legend = document.createElement('legend');
      legend.textContent = group;
      fieldset.append(legend);
      for (const control of controls) {
        let input;
        let wrapper;
        if (control.type === 'button') {
          input = wrapper = document.createElement('button');
          input.type = 'button';
          input.textContent = control.label;
        } else {
          wrapper = document.createElement('label');
          const caption = document.createElement('span');
          caption.textContent = control.label;
          if (control.type === 'select') {
            wrapper.className = 'prototype-review-field';
            input = document.createElement('select');
            for (const option of control.options) input.add(new Option(option.label, option.value));
            input.value = control.value;
            wrapper.append(caption, input);
          } else {
            wrapper.className = 'prototype-review-check';
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = control.value;
            wrapper.append(input, caption);
          }
        }
        input.dataset.prototypeReviewSource = key;
        input.dataset.prototypeReviewControl = control.name;
        input.disabled = control.disabled;
        fieldset.append(wrapper);
      }
      section.append(fieldset);
    }
    if (config.notes.length || config.links.length) {
      const about = document.createElement('div');
      about.className = 'prototype-review-about';
      const title = document.createElement('h4');
      title.textContent = 'About this view';
      about.append(title);
      for (const note of config.notes) {
        const paragraph = document.createElement('p');
        paragraph.textContent = note;
        about.append(paragraph);
      }
      if (config.links.length) {
        const list = document.createElement('ul');
        for (const entry of config.links) {
          const item = document.createElement('li');
          const anchor = document.createElement('a');
          anchor.href = entry.href;
          anchor.target = '_blank';
          anchor.rel = 'noopener';
          anchor.textContent = entry.label;
          item.append(anchor);
          list.append(item);
        }
        about.append(list);
      }
      section.append(about);
    }
    return section;
  }

  function render() {
    if (!content) return;
    const focused = document.activeElement?.closest?.('[data-prototype-review-control]');
    const restore = focused && content.contains(focused) ? [focused.dataset.prototypeReviewSource, focused.dataset.prototypeReviewControl] : null;
    const active = activeFrame();
    const keys = ['self', active?.id].filter(key => key && sources.has(key));
    content.replaceChildren(...keys.map(key => renderSource(key, sources.get(key).config)));
    if (restore) content.querySelector(`[data-prototype-review-source="${restore[0]}"][data-prototype-review-control="${restore[1]}"]`)?.focus();
  }

  function register(config) {
    let current = config;
    const change = (name, value) => current.onChange?.(name, value);
    if (embedded) {
      const send = () => window.parent.postMessage({ type: 'prototype-review:register', config: sanitize(current) }, targetOrigin);
      window.addEventListener('message', event => {
        if (event.source !== window.parent || event.origin !== frameOrigin) return;
        const message = event.data;
        if (!message || message.type !== 'prototype-review:change' || typeof message.name !== 'string') return;
        const control = sanitize(current).controls.find(item => item.name === message.name);
        if (control && !control.disabled && valid(control, message.value)) change(control.name, message.value);
      });
      document.addEventListener('keydown', event => {
        if (!isShortcut(event)) return;
        event.preventDefault();
        window.parent.postMessage({ type: 'prototype-review:toggle' }, targetOrigin);
      });
      send();
      return { update(next) { current = next; send(); } };
    }
    build();
    sources.set('self', { config: sanitize(current), change });
    render();
    return { update(next) { current = next; sources.set('self', { config: sanitize(current), change }); render(); } };
  }

  // The shell hosts the panel for its embedded views; registrations arrive only from the listed frames.
  function host(options) {
    frames = options.frames;
    activeFrame = options.active;
    build();
    window.addEventListener('message', event => {
      const frame = frames().find(item => item.contentWindow === event.source);
      if (!frame || event.origin !== frameOrigin) return;
      const message = event.data;
      if (message?.type === 'prototype-review:toggle') { toggleHidden(); return; }
      if (message?.type !== 'prototype-review:register') return;
      const config = sanitize(message.config);
      if (!config) return;
      sources.set(frame.id, { config, change: (name, value) => frame.contentWindow.postMessage({ type: 'prototype-review:change', name, value }, targetOrigin) });
      render();
    });
  }

  return { register, host, refresh: render };
})();
