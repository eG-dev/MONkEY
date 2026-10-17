(() => {
  const assetUrl = document.currentScript.src;
  const licenseUrl = new URL('../../../../LICENSE', assetUrl).href;
  const logoUrl = new URL('../../assets/images/monkey_face.png', assetUrl).href;
  const strings = {
    en: {
      overview: 'Overview', notices: 'Third-party notices', legal: 'Legal information',
      revision: 'Source revision: [review build]', repository: 'GitHub project', source: 'Source for this version',
      sourcePending: 'Repository and release-source URLs are pending.', projectLicense: 'Project license',
      licenseName: 'GNU Affero General Public License, version 3 only', licenseText: 'Full GNU AGPL version 3 license text',
      openLicense: 'Open full license file',
      inventoryDraft: 'Review placeholder: these example rows are not a verified release inventory. Versions, licenses and required notices remain to be reviewed.',
      search: 'Search components', count: 'Matching components: {count}', noResults: 'No matching components.',
      versionPending: '[shipped version]', licensePending: '[license]', runtime: '.NET runtime',
      noticeText: '[Complete applicable license, copyright attributions and required NOTICE text will appear here after review.]',
      componentSource: 'Component source (pending review)',
      legalDraft: 'Legal wording pending review. These placeholders show the structure only.',
      operator: 'Operator responsibilities', warranty: 'Warranty and liability', privacy: 'Privacy information',
      operatorText: '[Reviewed operator information: hosting, access and security, configuration, updates, backups and recovery. Distinguish the instance operator from household users and project maintainers.]',
      warrantyText: '[Reviewed warranty and liability information, subject to applicable law and consistent with AGPL rights. No service-level or maintenance promise.]',
      privacyText: '[Reviewed information about actual instance data processing and the instance operator\'s responsibilities. No private household details or cloud-policy assumptions.]'
    },
    de: {
      overview: 'Übersicht', notices: 'Drittanbieterhinweise', legal: 'Rechtliche Hinweise',
      revision: 'Quellcode-Revision: [Prüfversion]', repository: 'GitHub-Projekt', source: 'Quellcode dieser Version',
      sourcePending: 'Repository- und versionsbezogene Quellcode-URLs stehen noch nicht fest.', projectLicense: 'Projektlizenz',
      licenseName: 'GNU Affero General Public License, nur Version 3', licenseText: 'Vollständiger Lizenztext der GNU AGPL Version 3',
      openLicense: 'Vollständige Lizenzdatei öffnen',
      inventoryDraft: 'Prüfplatzhalter: Diese Beispielzeilen sind kein geprüftes Verzeichnis der Veröffentlichung. Versionen, Lizenzen und erforderliche Hinweise müssen noch geprüft werden.',
      search: 'Komponenten suchen', count: 'Passende Komponenten: {count}', noResults: 'Keine passenden Komponenten.',
      versionPending: '[ausgelieferte Version]', licensePending: '[Lizenz]', runtime: '.NET-Laufzeit',
      noticeText: '[Nach der Prüfung stehen hier die vollständige anwendbare Lizenz, Urheberrechtshinweise und erforderliche NOTICE-Texte.]',
      componentSource: 'Komponentenquellcode (Prüfung ausstehend)',
      legalDraft: 'Rechtliche Formulierungen müssen noch geprüft werden. Diese Platzhalter zeigen nur die Struktur.',
      operator: 'Verantwortlichkeiten des Betreibers', warranty: 'Gewährleistung und Haftung', privacy: 'Datenschutzhinweise',
      operatorText: '[Geprüfte Betreiberinformationen: Hosting, Zugriff und Sicherheit, Konfiguration, Updates, Sicherungen und Wiederherstellung. Instanzbetreiber, Haushaltsmitglieder und Projektverantwortliche sind zu unterscheiden.]',
      warrantyText: '[Geprüfte Gewährleistungs- und Haftungshinweise im Rahmen des geltenden Rechts und im Einklang mit den AGPL-Rechten. Kein Leistungs- oder Wartungsversprechen.]',
      privacyText: '[Geprüfte Informationen zur tatsächlichen Datenverarbeitung der Instanz und zu den Verantwortlichkeiten ihres Betreibers. Keine privaten Haushaltsdaten oder Annahmen aus Cloud-Richtlinien.]'
    }
  };
  const components = ['Angular', 'runtime', 'Roboto', 'Lucide'];
  const tabNames = ['overview', 'notices', 'legal'];
  let activeDialog;

  function text(key, params = {}) {
    return strings[PM.prefs.language][key].replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
  }

  function html(key) {
    return PM.esc(text(key));
  }

  function reviewMessage(key) {
    return `<div class="message message-info">${PM.icon('info')}<p class="message-body">${html(key)}</p></div>`;
  }

  function open() {
    if (activeDialog?.open) {
      activeDialog.querySelector('[data-close]').focus();
      return;
    }

    const opener = document.activeElement;
    const body = `<div class="about-tabs" role="tablist" aria-label="${PM.esc(PM.t('about'))}">${tabNames.map((name, index) => `<button id="about-tab-${name}" type="button" role="tab" data-tab="${name}" aria-controls="about-panel-${name}" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}">${html(name)}</button>`).join('')}</div>
      <div class="about-content">
        <div id="about-panel-overview" role="tabpanel" aria-labelledby="about-tab-overview" tabindex="0">
          <section class="about-section" aria-labelledby="about-product"><div class="about-brand"><img src="${PM.esc(logoUrl)}" alt=""><h3 id="about-product">POCKET MONkEY</h3></div>
            <p class="muted">${PM.esc(PM.t('version'))} &middot; ${html('revision')}</p>
            <div class="about-links"><span role="link" aria-disabled="true">${PM.icon('github')}${html('repository')}</span><span role="link" aria-disabled="true">${PM.icon('info')}${html('source')}</span></div><p class="hint">${html('sourcePending')}</p>
          </section>
          <section class="about-section" aria-labelledby="about-license-title"><h3 id="about-license-title">${html('projectLicense')}</h3>
            <details class="about-notice" id="about-project-license"><summary>${PM.icon('right')}<span class="about-notice-name">${html('licenseName')}</span><span class="about-notice-meta">AGPL-3.0-only</span></summary>
              <div class="about-notice-content"><a href="${PM.esc(licenseUrl)}" target="_blank" rel="noopener">${html('openLicense')}</a><pre class="about-license-text" id="about-license-text" tabindex="0" aria-label="${html('licenseText')}"></pre></div>
            </details>
          </section>
        </div>
        <div id="about-panel-notices" role="tabpanel" aria-labelledby="about-tab-notices" tabindex="0" hidden>
          <section class="about-section" aria-labelledby="about-notices-title"><h3 id="about-notices-title">${html('notices')}</h3>${reviewMessage('inventoryDraft')}
            <div class="field about-search"><label for="about-search">${html('search')}</label><input class="input" type="search" id="about-search" autocomplete="off"></div>
            <p class="hint about-results" id="about-search-status" role="status" aria-live="polite"></p><div id="about-components"></div>
          </section>
        </div>
        <div id="about-panel-legal" role="tabpanel" aria-labelledby="about-tab-legal" tabindex="0" hidden>
          ${reviewMessage('legalDraft')}
          ${['operator', 'warranty', 'privacy'].map(name => `<section class="about-section" aria-labelledby="about-${name}"><h3 id="about-${name}">${html(name)}</h3><p class="muted">${html(`${name}Text`)}</p></section>`).join('')}
        </div>
      </div>`;
    const dialog = PM.dialog({
      title: PM.t('about'),
      body,
      onClose: () => {
        activeDialog = null;
        opener?.scrollIntoView({ block: 'nearest' });
      }
    });
    activeDialog = dialog;
    dialog.classList.add('about-dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dialog.close();
      }
    });
    const tabButtons = [...dialog.querySelectorAll('[role="tab"]')];
    const expanded = new Set();

    function selectTab(name, focus = false) {
      tabButtons.forEach(button => {
        const selected = button.dataset.tab === name;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        dialog.querySelector(`#about-panel-${button.dataset.tab}`).hidden = !selected;

        if (selected && focus) {
          button.focus({ preventScroll: true });
          button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      });
      dialog.querySelector('.about-content').scrollTop = 0;
    }

    function renderComponents() {
      const query = dialog.querySelector('#about-search').value.trim().toLocaleLowerCase(PM.prefs.language);
      const filtered = components.filter(name => (name === 'runtime' ? text('runtime') : name).toLocaleLowerCase(PM.prefs.language).includes(query));
      dialog.querySelector('#about-search-status').textContent = text('count', { count: filtered.length });
      const list = dialog.querySelector('#about-components');
      list.innerHTML = filtered.length ? filtered.map(name => `<details class="about-notice" data-component="${name}" ${expanded.has(name) ? 'open' : ''}><summary>${PM.icon('right')}<span class="about-notice-name">${name === 'runtime' ? html('runtime') : PM.esc(name)}</span><span class="about-notice-meta">${html('versionPending')} &middot; ${html('licensePending')}</span></summary><div class="about-notice-content"><p>${html('noticeText')}</p><p class="muted">${html('componentSource')}</p></div></details>`).join('') : `<div class="empty"><p>${html('noResults')}</p></div>`;
      list.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () => {
        if (!details.isConnected) {
          return;
        }

        if (details.open) {
          expanded.add(details.dataset.component);
        } else {
          expanded.delete(details.dataset.component);
        }
      }));
    }

    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => selectTab(button.dataset.tab, true));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          return;
        }

        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabNames.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabNames.length) % tabNames.length;
        selectTab(tabNames[next], true);
      });
    });
    dialog.querySelector('#about-search').addEventListener('input', renderComponents);
    dialog.querySelector('#about-project-license').addEventListener('toggle', event => {
      const container = dialog.querySelector('#about-license-text');

      if (event.target.open && !container.textContent) {
        container.textContent = window.PM_PROJECT_LICENSE;
      }
    });
    renderComponents();
    dialog.querySelector('[data-close]').focus();
  }

  window.PM_ABOUT = { open };
})();