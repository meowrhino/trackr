/* ================================================
 * TRACKR — App: Guía / Help
 * Acordeón anidado con secciones y sub-secciones.
 * Globales: extiende App
 * Dependencias: app.js (App base), lang.js (t())
 * ================================================ */

Object.assign(App, {

  /* ── Render principal ── */
  rGuide() {
    document.getElementById('guideTitle').textContent = t('guide.title');
    document.getElementById('guideC').innerHTML =
      this._guideStructure().map((s, i) => this._guideSection(s, i)).join('');
  },

  /* ── Renderizar una sección (con posibles sub-secciones) ── */
  _guideSection(s, i) {
    const hasSubs = s.subs && s.subs.length;
    const intro = s.intro ? `<div class="guide-intro">${t(s.intro)}</div>` : '';
    const bodyContent = hasSubs
      ? intro + s.subs.map((sub, j) => this._guideSub(sub, i, j)).join('')
      : intro + (s.body ? t(s.body) : '');

    return `<div class="guide-section">`
      + `<div class="guide-header" onclick="App._gToggle('g${i}')">`
      +   `<span class="guide-icon">${s.icon}</span>`
      +   `<div class="guide-htext">`
      +     `<div class="guide-htitle">${t(s.title)}</div>`
      +     `<div class="guide-hdesc">${t(s.desc)}</div>`
      +   `</div>`
      +   `<span class="guide-chev" id="g${i}Chev">▸</span>`
      + `</div>`
      + `<div class="guide-body" id="g${i}" style="display:none">${bodyContent}</div>`
      + `</div>`;
  },

  /* ── Renderizar una sub-sección ── */
  _guideSub(sub, i, j) {
    return `<div class="guide-sub">`
      + `<div class="guide-sub-header" onclick="App._gToggle('g${i}s${j}')">`
      +   `<span class="guide-sub-title">${t(sub.title)}</span>`
      +   `<span class="guide-chev guide-chev-sub" id="g${i}s${j}Chev">▸</span>`
      + `</div>`
      + `<div class="guide-sub-body" id="g${i}s${j}" style="display:none">${t(sub.body)}</div>`
      + `</div>`;
  },

  /* ── Toggle genérico (sección o sub-sección) ── */
  _gToggle(id) {
    const body = document.getElementById(id);
    const chev = document.getElementById(id + 'Chev');
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    if (chev) chev.textContent = open ? '▸' : '▾';
  },

  /* ══════════════════════════════════════════════
   *  Estructura de la guía
   *  Cada sección: { icon, title, desc, body | subs[] }
   *  Sub-secciones: { title, body }
   *  Todos los valores son claves de traducción.
   * ══════════════════════════════════════════════ */
  _guideStructure() {
    return [
      {
        icon: '✦', title: 'guide.about.title', desc: 'guide.about.desc',
        intro: 'guide.about.intro',
        subs: [
          { title: 'guide.about.origin.title', body: 'guide.about.origin.body' },
          { title: 'guide.about.evolution.title', body: 'guide.about.evolution.body' },
          { title: 'guide.about.howworks.title', body: 'guide.about.howworks.body' },
          { title: 'guide.about.now.title', body: 'guide.about.now.body' },
          { title: 'guide.about.contact.title', body: 'guide.about.contact.body' }
        ]
      },
      {
        icon: '▣', title: 'guide.projects.title', desc: 'guide.projects.desc',
        intro: 'guide.projects.intro',
        subs: [
          { title: 'guide.projects.states.title', body: 'guide.projects.states.body' },
          { title: 'guide.projects.clients.title', body: 'guide.projects.clients.body' },
          { title: 'guide.projects.filters.title', body: 'guide.projects.filters.body' }
        ]
      },
      {
        icon: '◔', title: 'guide.hours.title', desc: 'guide.hours.desc',
        intro: 'guide.hours.intro', body: 'guide.hours.body'
      },
      {
        icon: '€', title: 'guide.billing.title', desc: 'guide.billing.desc',
        intro: 'guide.billing.intro',
        subs: [
          { title: 'guide.billing.modes.title', body: 'guide.billing.modes.body' },
          { title: 'guide.billing.tax.title', body: 'guide.billing.tax.body' },
          { title: 'guide.billing.payments.title', body: 'guide.billing.payments.body' }
        ]
      },
      {
        icon: '▨', title: 'guide.calendar.title', desc: 'guide.calendar.desc',
        intro: 'guide.calendar.intro', body: 'guide.calendar.body'
      },
      {
        icon: '⎙', title: 'guide.invoices.title', desc: 'guide.invoices.desc',
        intro: 'guide.invoices.intro', body: 'guide.invoices.body'
      },
      {
        icon: '€', title: 'guide.money.title', desc: 'guide.money.desc',
        intro: 'guide.money.intro',
        subs: [
          { title: 'guide.money.income.title', body: 'guide.money.income.body' },
          { title: 'guide.money.expenses.title', body: 'guide.money.expenses.body' },
          { title: 'guide.money.taxes.title', body: 'guide.money.taxes.body' }
        ]
      },
      {
        icon: '⚙', title: 'guide.config.title', desc: 'guide.config.desc',
        intro: 'guide.config.intro', body: 'guide.config.body'
      },
      {
        icon: '↕', title: 'guide.data.title', desc: 'guide.data.desc',
        intro: 'guide.data.intro', body: 'guide.data.body'
      }
    ];
  }

});
