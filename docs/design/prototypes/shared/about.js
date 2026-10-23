(() => {
  const assetUrl = document.currentScript.src;
  const licenseUrl = new URL('../../../../LICENSE', assetUrl).href;
  const logoUrl = new URL('../../assets/images/monkey_face.png', assetUrl).href;
  const strings = {
    en: {
      overview: 'Overview', license: 'Project license', notices: 'Third-party notices', legal: 'Legal information',
      revision: 'Source revision: [review build]', repository: 'GitHub project', source: 'Source for this version',
      sourcePending: 'Repository and release-source URLs are pending.', projectLicense: 'Project license',
      licenseName: 'GNU Affero General Public License, version 3 only', licenseText: 'Full GNU AGPL version 3 license text',
      openLicense: 'Open full license file',
      inventoryDraft: 'Review placeholder: these example rows are not a verified release inventory. Versions, licenses and required notices remain to be reviewed.',
      search: 'Search components', count: 'Matching components: {count}', noResults: 'No matching components.',
      versionPending: '[shipped version]', licensePending: '[license]', runtime: '.NET runtime',
      noticeText: '[Complete applicable license, copyright attributions and required NOTICE text will appear here after review.]',
      appliesTo: 'Applies to',
      componentSource: 'Component source (pending review)',
      legalContext: 'This general software description is not a complete privacy notice for every deployment.',
      operator: 'Operator responsibilities', warranty: 'Warranty and liability', privacy: 'Privacy information',
      operatorText: `POCKET MONkEY is self-hosted software, not a hosting or managed service provided
    by the project. The instance operator is the person or organisation deploying
    and controlling this installation. Project maintainers and ordinary household
    users are not automatically its operator; an application's Manager role alone
    does not determine who has legal responsibility for a deployment.

    The operator is responsible for appropriate hosting, network exposure and HTTPS,
    access control, configuration, persistent storage, confidential backups and
    tested recovery, and installation of application, dependency and host security
    updates. Restrict access to intended users. LAN or VPN access does not remove the
    need to assess these protections. Backups must include the database, account
    images and persistent authentication keys, with the configuration needed to
    restore the installation correctly.

    The project supplies software, not an availability commitment, monitoring
    service, maintenance contract or recovery service. A separately arranged service
    is governed by its own agreement, not implied by use of POCKET MONkEY.`,
      warrantyText: `To the extent permitted by applicable law, the software is provided "as is" and
    "as available", without warranties, consistently with the GNU Affero General
    Public License, version 3, including its warranty and liability provisions.
    The project makes no promise of uninterrupted availability, suitability for a
    particular purpose, error-free calculations or balances, continued maintenance,
    support, or a security-update schedule. Users and operators should verify results
    before relying on them.

    These statements do not exclude or limit liability where exclusion or limitation
    is prohibited by applicable law, or override mandatory rights or an applicable
    separate agreement. They do not reduce the project's engineering and verification
    requirements or relieve an operator of responsibilities imposed by law.

    The project software is licensed under AGPL-3.0-only; third-party components
    retain their own terms. This information does not change those licenses, remove
    recipients' rights, or add a commercial-use restriction. The full unmodified
    project license is available in the Project license tab; accompanying third-party
    material is available under Third-party notices. A notice listing alone does not
    establish completeness or compliance with every license obligation.`,
      privacyText: `This installation processes information needed to manage access and shared
    pocket-money records. This includes usernames and display names, authentication
    and session/security records, language and theme preferences, account names and
    images, balances, transaction amounts/dates/comments and recorded attribution,
    and monthly-allowance settings and execution records. Do not enter unnecessary
    personal or sensitive information into names, images or comments.

    Accounts are shared within the instance: both Members and Managers can read all
    accounts. Managers manage access and perform business writes. Accounts are not
    private spaces assigned to individual Members. Host administrators and parties
    with storage or backup access may have access outside the application's role
    controls.

    Browser cookies support authentication, request security and language selection.
    Connecting to an installation also exposes technical request information to its
    host and, where used, its reverse proxy. Application/host logs and backups may
    contain additional information depending on configuration. Hosting providers or
    other integrations are the operator's deployment choices, not a hosted service
    supplied by the project. Using the software does not automatically send household
    records to project maintainers; sharing diagnostics or bug reports can disclose
    data, so review and redact them first.

    The operator determines the installation's purposes, access, hosting and backup
    practices and must assess applicable privacy obligations. This general software
    description is not a complete privacy notice for every deployment. Ask the
    instance operator for the installation's contact details and, where applicable,
    information about legal basis, recipients, storage locations, transfers,
    retention and your rights. No particular legal basis or exemption is assumed.

    Transaction-detail retention defaults to 24 UTC calendar months and can be
    configured by the operator. Cleanup removes eligible older transaction details,
    not all associated data: balances, opening entries, audit information and durable
    processing identities remain. Disabling a user prevents access but is not data
    erasure. Backups may retain earlier copies; increasing the retention period does
    not recover details already removed. This setting is not a promise of automatic
    deletion or anonymisation of all personal information. Any applicable request or
    retention obligation needs deployment-specific assessment by the operator.`
    },
    de: {
      overview: 'Übersicht', license: 'Projektlizenz', notices: 'Drittanbieterhinweise', legal: 'Rechtliche Hinweise',
      revision: 'Quellcode-Revision: [Prüfversion]', repository: 'GitHub-Projekt', source: 'Quellcode dieser Version',
      sourcePending: 'Repository- und versionsbezogene Quellcode-URLs stehen noch nicht fest.', projectLicense: 'Projektlizenz',
      licenseName: 'GNU Affero General Public License, nur Version 3', licenseText: 'Vollständiger Lizenztext der GNU AGPL Version 3',
      openLicense: 'Vollständige Lizenzdatei öffnen',
      inventoryDraft: 'Prüfplatzhalter: Diese Beispielzeilen sind kein geprüftes Verzeichnis der Veröffentlichung. Versionen, Lizenzen und erforderliche Hinweise müssen noch geprüft werden.',
      search: 'Komponenten suchen', count: 'Passende Komponenten: {count}', noResults: 'Keine passenden Komponenten.',
      versionPending: '[ausgelieferte Version]', licensePending: '[Lizenz]', runtime: '.NET-Laufzeit',
      noticeText: '[Nach der Prüfung stehen hier die vollständige anwendbare Lizenz, Urheberrechtshinweise und erforderliche NOTICE-Texte.]',
      appliesTo: 'Gilt für',
      componentSource: 'Komponentenquellcode (Prüfung ausstehend)',
      legalContext: 'Diese allgemeine Softwarebeschreibung ist keine vollständige Datenschutzerklärung für jede Installation.',
      operator: 'Verantwortlichkeiten des Betreibers', warranty: 'Gewährleistung und Haftung', privacy: 'Datenschutzhinweise',
      operatorText: `POCKET MONkEY ist selbst betriebene Software, kein vom Projekt bereitgestellter
    Hostingdienst oder verwalteter Dienst. Betreiber einer Instanz ist die Person
    oder Organisation, die diese Installation bereitstellt und kontrolliert.
    Projektverantwortliche und gewöhnliche Haushaltsmitglieder sind nicht automatisch
    deren Betreiber; die Anwendungsrolle Manager bestimmt für sich allein nicht die
    rechtliche Verantwortung für den Betrieb.

    Der Betreiber ist für angemessenes Hosting, Netzwerkfreigaben und HTTPS,
    Zugriffsschutz, Konfiguration, dauerhafte Speicherung, vertrauliche Sicherungen
    und erprobte Wiederherstellung sowie die Installation von Sicherheitsupdates für
    Anwendung, Abhängigkeiten und Host verantwortlich. Der Zugriff sollte auf die
    vorgesehenen Nutzer beschränkt werden. Auch bei Zugriff über LAN oder VPN müssen
    diese Schutzmaßnahmen bewertet werden. Sicherungen müssen Datenbank,
    Kontobilder und dauerhafte Authentifizierungsschlüssel sowie die für eine
    korrekte Wiederherstellung erforderliche Konfiguration umfassen.

    Das Projekt stellt Software bereit, keine Verfügbarkeitszusage, Überwachung,
    Wartungsvereinbarung oder Wiederherstellungsleistung. Ein gesondert vereinbarter
    Dienst richtet sich nach seiner eigenen Vereinbarung und ergibt sich nicht aus
    der Nutzung von POCKET MONkEY.`,
      warrantyText: `Soweit das anwendbare Recht dies zulässt, wird die Software im vorhandenen und
    verfügbaren Zustand ("as is" und "as available") ohne Gewährleistungen
    bereitgestellt, im Einklang mit der GNU Affero General Public License, Version 3,
    einschließlich ihrer Gewährleistungs- und Haftungsbestimmungen. Das Projekt
    verspricht weder unterbrechungsfreie Verfügbarkeit, Eignung für einen bestimmten
    Zweck, fehlerfreie Berechnungen oder Kontostände noch fortlaufende Wartung,
    Support oder einen Zeitplan für Sicherheitsupdates. Nutzer und Betreiber sollten
    Ergebnisse prüfen, bevor sie sich darauf verlassen.

    Diese Hinweise schließen eine Haftung nicht aus und begrenzen sie nicht, soweit
    ein solcher Ausschluss oder eine solche Begrenzung nach anwendbarem Recht
    unzulässig ist. Zwingende Rechte und anwendbare gesonderte Vereinbarungen bleiben
    unberührt. Die Hinweise mindern weder die technischen Qualitäts- und
    Prüfanforderungen des Projekts noch die gesetzlichen Pflichten des Betreibers.

    Die Projektsoftware steht unter AGPL-3.0-only; für Drittanbieterkomponenten
    gelten deren eigene Bedingungen. Diese Informationen ändern die Lizenzen nicht,
    entziehen Empfängern keine Rechte und fügen kein Verbot kommerzieller Nutzung
    hinzu. Der vollständige unveränderte Projektlizenztext steht im Reiter
    Projektlizenz; begleitende Drittanbieterdokumente stehen unter
    Drittanbieterhinweise. Ein Hinweisverzeichnis allein belegt weder Vollständigkeit
    noch die Erfüllung sämtlicher Lizenzpflichten.`,
      privacyText: `Diese Installation verarbeitet Informationen zur Verwaltung von Zugriffen und
    gemeinsamen Taschengeldaufzeichnungen. Dazu gehören Nutzer- und Anzeigenamen,
    Authentifizierungs-, Sitzungs- und Sicherheitsdaten, Sprach- und
    Darstellungseinstellungen, Kontonamen und -bilder, Kontostände,
    Transaktionsbeträge, Zeitangaben, Kommentare und erfasste Zuordnungen zu Nutzern
    sowie Einstellungen und Ausführungsdaten monatlicher Taschengeldzahlungen.
    Tragen Sie keine unnötigen personenbezogenen oder sensiblen Informationen in
    Namen, Bilder oder Kommentare ein.

    Konten werden innerhalb der Instanz gemeinsam genutzt: Mitglieder und Manager
    können alle Konten lesen. Manager verwalten Zugriffe und führen fachliche
    Schreibvorgänge aus. Konten sind keine privaten, einzelnen Mitgliedern
    zugewiesenen Bereiche. Hostadministratoren und Personen mit Zugriff auf
    Speicher oder Sicherungen können außerhalb der Rollensteuerung der Anwendung
    Zugriff auf Daten haben.

    Browser-Cookies unterstützen Anmeldung, Anfragesicherheit und Sprachauswahl.
    Beim Verbindungsaufbau erhält außerdem der Host und gegebenenfalls dessen
    Reverse Proxy technische Anfrageinformationen. Anwendungs- und Hostprotokolle
    sowie Sicherungen können je nach Konfiguration weitere Informationen enthalten.
    Hostinganbieter oder andere Integrationen sind Entscheidungen des Betreibers,
    kein vom Projekt bereitgestellter Hostingdienst. Durch die Softwarenutzung
    werden Haushaltsaufzeichnungen nicht automatisch an Projektverantwortliche
    übermittelt. Diagnosematerial oder Fehlerberichte können jedoch Daten
    offenlegen; prüfen und bereinigen Sie diese vor einer Weitergabe.

    Der Betreiber bestimmt Zwecke, Zugriffe, Hosting und Sicherungsverfahren der
    Installation und muss die anwendbaren Datenschutzpflichten prüfen. Diese
    allgemeine Softwarebeschreibung ist keine vollständige Datenschutzerklärung für
    jede Installation. Erfragen Sie beim Instanzbetreiber dessen Kontaktdaten und,
    soweit erforderlich, Informationen zu Rechtsgrundlagen, Empfängern,
    Speicherorten, Übermittlungen, Aufbewahrung und Ihren Rechten. Eine bestimmte
    Rechtsgrundlage oder Ausnahme wird nicht vorausgesetzt.

    Die Aufbewahrung von Transaktionsdetails beträgt standardmäßig 24
    UTC-Kalendermonate und kann vom Betreiber konfiguriert werden. Die Bereinigung
    entfernt dafür vorgesehene ältere Transaktionsdetails, nicht sämtliche
    zugehörigen Daten: Kontostände, Eröffnungsbuchungen, Auditinformationen und
    dauerhafte Verarbeitungskennungen bleiben erhalten. Die Deaktivierung eines
    Nutzers verhindert dessen Zugriff, ist aber keine Datenlöschung. Sicherungen
    können frühere Kopien enthalten; eine spätere Verlängerung der Aufbewahrung
    stellt bereits entfernte Details nicht wieder her. Diese Einstellung ist keine
    Zusage zur automatischen Löschung oder Anonymisierung sämtlicher
    personenbezogener Informationen. Anwendbare Auskunfts- oder sonstige Anfragen
    und Aufbewahrungspflichten muss der Betreiber für die konkrete Installation
    bewerten.`
    }
  };
  const components = [
    {
      name: 'Angular',
      members: [
        '@angular/common', '@angular/compiler', '@angular/core', '@angular/forms',
        '@angular/platform-browser', '@angular/platform-server', '@angular/router', '@angular/ssr'
      ]
    },
    { name: 'runtime', members: [] },
    { name: 'Roboto', members: [] },
    { name: 'Lucide', members: [] }
  ];
  const tabNames = ['overview', 'license', 'notices', 'legal'];
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
        </div>
        <div id="about-panel-license" role="tabpanel" aria-labelledby="about-tab-license" tabindex="0" hidden>
          <section class="about-section" aria-labelledby="about-license-title"><h3 id="about-license-title">${html('projectLicense')} &middot; AGPL-3.0-only</h3>
            <a href="${PM.esc(licenseUrl)}" target="_blank" rel="noopener">${html('openLicense')}</a>
            <pre class="about-license-text" id="about-license-text" tabindex="0" aria-label="${html('licenseText')}"></pre>
          </section>
        </div>
        <div id="about-panel-notices" role="tabpanel" aria-labelledby="about-tab-notices" tabindex="0" hidden>
          <section class="about-section" aria-labelledby="about-notices-title"><h3 id="about-notices-title">${html('notices')}</h3>${reviewMessage('inventoryDraft')}
            <div class="field about-search"><label for="about-search">${html('search')}</label><input class="input" type="search" id="about-search" autocomplete="off"></div>
            <p class="hint about-results" id="about-search-status" role="status" aria-live="polite"></p><div id="about-components"></div>
          </section>
        </div>
        <div id="about-panel-legal" role="tabpanel" aria-labelledby="about-tab-legal" tabindex="0" hidden>
          ${reviewMessage('legalContext')}
          ${['operator', 'warranty', 'privacy'].map(name => `<section class="about-section" aria-labelledby="about-${name}"><h3 id="about-${name}">${html(name)}</h3>${text(`${name}Text`).split('\n\n').map(paragraph => `<p>${PM.esc(paragraph)}</p>`).join('')}</section>`).join('')}
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
      const filtered = components.filter(({ name, members }) =>
        [name === 'runtime' ? text('runtime') : name, ...members].join(' ').toLocaleLowerCase(PM.prefs.language).includes(query));
      dialog.querySelector('#about-search-status').textContent = text('count', { count: filtered.length });
      const list = dialog.querySelector('#about-components');
      list.querySelectorAll('details').forEach(details => {
        if (details.open) {
          expanded.add(details.dataset.component);
        } else {
          expanded.delete(details.dataset.component);
        }
      });
      list.innerHTML = filtered.length ? filtered.map(({ name, members }) => `<details class="about-notice" data-component="${name}" ${expanded.has(name) ? 'open' : ''}><summary>${PM.icon('right')}<span class="about-notice-name">${name === 'runtime' ? html('runtime') : PM.esc(name)}</span><span class="about-notice-meta">${html('versionPending')} &middot; ${html('licensePending')}</span></summary><div class="about-notice-content">${members.length ? `<p>${html('appliesTo')}</p><ul data-about-members>${members.map(member => `<li>${PM.esc(member)}</li>`).join('')}</ul>` : ''}<div data-about-document><p data-about-document-text>${html('noticeText')}</p><p class="muted">${html('componentSource')}</p></div></div></details>`).join('') : `<div class="empty"><p>${html('noResults')}</p></div>`;
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
    dialog.querySelector('#about-license-text').textContent = window.PM_PROJECT_LICENSE;
    renderComponents();
    dialog.querySelector('[data-close]').focus();
  }

  window.PM_ABOUT = { open };
})();