# Self-Hosted Legal Information

Revision: R2, 2026-10-24. Status: **bilingual wording and prototype presentation
approved by the user**.

R1 approval recorded on 2026-10-23: "sounds good, lets keep it". This accepts the
general wording, not legal enforceability, deployment-specific publication
readiness or an unreviewed prototype/Angular revision.

R2 replaces the SPDX identifier in explanatory prose with the full license name,
as requested on 2026-10-24. The license remains version 3 only, not version 3 or
later; metadata, license notices and technical identifiers retain `AGPL-3.0-only`.
The user approved the current R2 prototype on 2026-10-24 with "approved";
Angular now uses the same revised wording.

## Review Notes

This document records the accepted German and English copy for the three sections of the
About dialog's Legal information tab. It is not legal advice, a final
deployment-specific privacy notice, or an assertion of enforceability. The two
language versions are intended to convey the same meaning; no governing-language
rule is proposed.

The wording follows [ADR-0018](../ADR/ADR-0018-project-license.md) and the
[self-hosted legal-content scope](../../plans/migration/03h-lifecycle.md#self-hosted-legal-content-and-license).
It does not modify the standard [project license](../../LICENSE), third-party
terms, or the existing Azure application's terms/privacy declaration. It adds no
acceptance checkbox, consent record, registration gate or new backend contract.
The [shared About prototype](../design/prototypes/about/index.html) presents
R2 in the existing three sections, approved on 2026-10-24. After R1 presentation verification,
the user requested "implement" on 2026-10-23. Angular now presents the same
accepted R2 wording and deployment-specific caveat; this does not close the
publication-review questions below.

Before publication, review:

- The intended deployment and applicable jurisdiction, including whether
  household, organisational or other privacy obligations apply.
- The warranty/liability wording against mandatory law and the standard license;
  this information does not establish a blanket exclusion of liability.
- The installation's actual operator identity/contact, purposes, legal basis
  where required, recipients/service providers, hosting location, transfers,
  retention and applicable data-subject rights. Supply deployment-specific
  information where required; do not insert a household's private details into
  the public project repository.
- Actual logging, integrations and backup practices. The data description below
  is a baseline, not a promise that every operator has the same configuration.
- Semantic agreement between the final German and English wording. Neither
  translation replaces the unmodified authoritative software-license text.

Technical basis: the [application guide](../../revamp/README.md),
[configuration contract](../../plans/migration/configuration.md) and
[operations plan](../../plans/migration/04-operations-cutover.md). In particular,
`MONKEY_TRANSACTION_RETENTION_MONTHS` defaults to `24`; eligible transaction
details are pruned using UTC calendar-month boundaries. This is not general
personal-data erasure. The operational procedures remain subject to their own
acceptance gates; this document does not claim they have been rehearsed.

## English

### Operator Responsibilities

POCKET MONkEY is self-hosted software, not a hosting or managed service provided
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
is governed by its own agreement, not implied by use of POCKET MONkEY.

### Warranty and Liability

To the extent permitted by applicable law, the software is provided "as is" and
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

The project software is licensed under the GNU Affero General Public License, version 3; third-party components
retain their own terms. This information does not change those licenses, remove
recipients' rights, or add a commercial-use restriction. The full unmodified
project license is available in the Project license tab; accompanying third-party
material is available under Third-party notices. A notice listing alone does not
establish completeness or compliance with every license obligation.

### Privacy Information

This installation processes information needed to manage access and shared
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
retention obligation needs deployment-specific assessment by the operator.

## Deutsch

### Verantwortlichkeiten des Betreibers

POCKET MONkEY ist selbst betriebene Software, kein vom Projekt bereitgestellter
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
der Nutzung von POCKET MONkEY.

### Gewährleistung und Haftung

Soweit das anwendbare Recht dies zulässt, wird die Software im vorhandenen und
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

Die Projektsoftware steht unter der GNU Affero General Public License, Version 3; für Drittanbieterkomponenten
gelten deren eigene Bedingungen. Diese Informationen ändern die Lizenzen nicht,
entziehen Empfängern keine Rechte und fügen kein Verbot kommerzieller Nutzung
hinzu. Der vollständige unveränderte Projektlizenztext steht im Reiter
Projektlizenz; begleitende Drittanbieterdokumente stehen unter
Drittanbieterhinweise. Ein Hinweisverzeichnis allein belegt weder Vollständigkeit
noch die Erfüllung sämtlicher Lizenzpflichten.

### Datenschutzhinweise

Diese Installation verarbeitet Informationen zur Verwaltung von Zugriffen und
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
bewerten.