/* ================================================
 * TRACKR — App: Guía / Help
 * Acordeón con secciones explicativas
 * Globales: extiende App
 * Dependencias: app.js (App base), lang.js (t())
 * ================================================ */

Object.assign(App, {

  rGuide() {
    document.getElementById('guideTitle').textContent = t('guide.title');
    const sections = this._guideSections();
    document.getElementById('guideC').innerHTML = sections.map((s, i) =>
      `<div class="guide-section">`
      + `<div class="guide-header" onclick="App._toggleGuide(${i})">`
      +   `<span class="guide-icon">${s.icon}</span>`
      +   `<div class="guide-htext"><div class="guide-htitle">${s.title}</div><div class="guide-hdesc">${s.desc}</div></div>`
      +   `<span class="guide-chev" id="gChev${i}">▸</span>`
      + `</div>`
      + `<div class="guide-body" id="gBody${i}" style="display:none">${s.body}</div>`
      + `</div>`
    ).join('');
  },

  _toggleGuide(i) {
    const body = document.getElementById('gBody' + i);
    const chev = document.getElementById('gChev' + i);
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    chev.textContent = open ? '▸' : '▾';
  },

  _guideSections() {
    return [
      {
        icon: '◩', title: t('guide.projects.title'), desc: t('guide.projects.desc'),
        body: t('guide.projects.body')
      },
      {
        icon: '◔', title: t('guide.hours.title'), desc: t('guide.hours.desc'),
        body: t('guide.hours.body')
      },
      {
        icon: '€', title: t('guide.billing.title'), desc: t('guide.billing.desc'),
        body: t('guide.billing.body')
      },
      {
        icon: '¤', title: t('guide.payments.title'), desc: t('guide.payments.desc'),
        body: t('guide.payments.body')
      },
      {
        icon: '▣', title: t('guide.calendar.title'), desc: t('guide.calendar.desc'),
        body: t('guide.calendar.body')
      },
      {
        icon: '⎙', title: t('guide.invoices.title'), desc: t('guide.invoices.desc'),
        body: t('guide.invoices.body')
      },
      {
        icon: '≡', title: t('guide.money.title'), desc: t('guide.money.desc'),
        body: t('guide.money.body')
      },
      {
        icon: '⚙', title: t('guide.config.title'), desc: t('guide.config.desc'),
        body: t('guide.config.body')
      },
      {
        icon: '↕', title: t('guide.data.title'), desc: t('guide.data.desc'),
        body: t('guide.data.body')
      }
    ];
  }

});
