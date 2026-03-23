/* ================================================
 * TRACKR — i18n (internacionalización)
 * Diccionarios ES/EN, función t(), setLang().
 * Globales: LANGS, _lang, _strings, t(), tp(), setLang(), currentLocale()
 * Dependencias: ninguna (se carga antes que store.js)
 * ================================================ */

let _lang = 'es';
let _strings = {};

/** Diccionarios por idioma */
const LANGS = {

  es: {

    /* ── Nav ── */
    'nav.info': 'Info',
    'nav.projects': 'Proyectos',
    'nav.calendar': 'Calendario',
    'nav.expenses': 'Dineros',
    'nav.config': 'Configuración',
    'nav.guide': 'Guía',
    'nav.export': 'Exportar',
    'nav.import': 'Importar',

    /* ── Común / Botones ── */
    'btn.save': 'Guardar',
    'btn.create': 'Crear',
    'btn.cancel': 'Cancelar',
    'btn.delete': 'Eliminar',
    'btn.edit': 'Editar',
    'btn.add': 'Añadir',
    'btn.close': 'Cerrar',
    'btn.newProject': '+ Nuevo proyecto',
    'btn.newExpense': '+ Nuevo gasto',
    'btn.newClient': '+ Nuevo cliente',
    'btn.addEntry': '+ Añadir entrada',
    'btn.addHour': '+ Añadir',
    'btn.addHourCal': '+ Añadir hora',
    'btn.loadJson': 'Cargar JSON',
    'btn.loadAnotherJson': 'Cargar otro JSON',
    'btn.newUser': 'Nuevo usuario',
    'btn.logout': 'Cerrar sesión',
    'msg.logoutTitle': 'Cerrar sesión',
    'msg.logoutBody': 'Se borrarán todos los datos de esta sesión. Recuerda exportar tu JSON antes si no quieres perder tu trabajo. TRACKR no guarda datos de nadie.',
    'btn.downloadPdf': 'Descargar PDF',
    'btn.saveCfg': 'Guardar configuración',
    'btn.createNew': '+ Crear nuevo...',
    'btn.createNewProject': '+ Crear nuevo proyecto...',
    'btn.newClientOpt': '+ Nuevo cliente...',

    /* ── Constantes: Estados ── */
    'est.potencial': 'Potencial',
    'est.activo': 'Activo',
    'est.pausado': 'Pausado',
    'est.completado': 'Completado',
    'est.abandonado': 'Abandonado',

    /* ── Constantes: Estados plural (para grupos) ── */
    'est.potenciales': 'Potenciales',
    'est.activos': 'Activos',
    'est.pausados': 'Pausados',
    'est.completados': 'Completados',
    'est.abandonados': 'Abandonados',

    /* ── Constantes: Categorías de gasto ── */
    'cat.herramientas': 'Herramientas',
    'cat.formacion': 'Formación',
    'cat.software': 'Software',
    'cat.marketing': 'Marketing',
    'cat.oficina': 'Oficina',
    'cat.otro': 'Otro',

    /* ── Constantes: Recurrencia ── */
    'rec.no': 'Puntual',
    'rec.mensual': 'Mensual',
    'rec.anual': 'Anual',

    /* ── Constantes: Meses ── */
    'month.0': 'Enero', 'month.1': 'Febrero', 'month.2': 'Marzo',
    'month.3': 'Abril', 'month.4': 'Mayo', 'month.5': 'Junio',
    'month.6': 'Julio', 'month.7': 'Agosto', 'month.8': 'Septiembre',
    'month.9': 'Octubre', 'month.10': 'Noviembre', 'month.11': 'Diciembre',

    /* ── Constantes: Días semana ── */
    'dow.0': 'Lun', 'dow.1': 'Mar', 'dow.2': 'Mié',
    'dow.3': 'Jue', 'dow.4': 'Vie', 'dow.5': 'Sáb', 'dow.6': 'Dom',

    /* ── Constantes: Temas ── */
    'theme.oscuro': 'Oscuro',
    'theme.claro': 'Claro',
    'theme.medianoche': 'Medianoche',
    'theme.sepia': 'Sepia',
    'theme.nord': 'Nord',
    'theme.monokai': 'Monokai',
    'theme.pizarra': 'Pizarra',
    'theme.ocaso': 'Ocaso',
    'theme.arena': 'Arena',
    'theme.hacker': 'Hacker',
    'theme.lavanda': 'Lavanda',
    'theme.tinta': 'Tinta',
    'theme.bosque': 'Bosque',
    'theme.cerezo': 'Cerezo',
    'theme.nube': 'Nube',
    'theme.melocoton': 'Melocotón',
    'theme.menta': 'Menta',
    'theme.sol': 'Sol',

    /* ── Idiomas ── */
    'lang.es': 'Español',
    'lang.en': 'English',
    'lang.ca': 'Català',
    'lang.label': 'Idioma',

    /* ── Campos de formulario ── */
    'field.name': 'Nombre',
    'field.client': 'Cliente',
    'field.noClient': '— Sin cliente —',
    'field.color': 'Color',
    'field.status': 'Estado',
    'field.internal': 'Interno',
    'field.recurring': 'Recurrente',
    'field.start': 'Inicio',
    'field.estEnd': 'Fin estimada',
    'field.actualEnd': 'Fin real',
    'field.notes': 'Notas',
    'field.date': 'Fecha',
    'field.note': 'Nota',
    'field.hours': 'Horas',
    'field.startTime': 'Hora inicio',
    'field.amount': 'Cobro (€)',
    'field.amountEntry': 'Cantidad (€)',
    'field.noDate': 'Sin fecha',
    'field.category': 'Categoría',
    'field.recurrence': 'Recurrencia',
    'field.nickname': 'Mote',
    'field.fullName': 'Nombre completo',
    'field.subject': 'Asunto',
    'field.invoiceNum': 'N.º factura',
    'field.paymentDate': 'Fecha pago',
    'field.project': 'Proyecto',
    'field.projectName': 'Nombre proyecto',
    'field.clientName': 'Nombre cliente',
    'field.invoiceLang': 'Idioma factura',

    /* ── Placeholders ── */
    'ph.projectName': 'Web Conor',
    'ph.newClient': 'Nombre del nuevo cliente',
    'ph.newProjectName': 'Nombre del proyecto',
    'ph.newClientName': 'Nombre del cliente',
    'ph.ivaException': 'Ej: Art. 20 LIVA',
    'ph.notes': '...',
    'ph.whatDidYouDo': '¿Qué hiciste?',
    'ph.expenseName': 'Ej: Mentoring, Dominio...',
    'ph.detail': 'Detalle',
    'ph.nameOrCompany': 'Tu nombre o empresa',
    'ph.street': 'Calle, número',
    'ph.cityZip': 'CP, Ciudad, País',
    'ph.nif': '12345678A',
    'ph.bankAccount': 'ES12 3456 7890 1234 5678 9012',
    'ph.clientNameOrCompany': 'Nombre o empresa',
    'ph.fullName': 'Nombre legal completo',
    'ph.clientCity': 'CP, Ciudad',
    'ph.hoursMonth': 'Ej: 160',
    'ph.incomeMonth': 'Ej: 3000',
    'ph.hoursWeek': 'Ej: 40',

    /* ── Facturación ── */
    'billing.title': 'Facturación',
    'billing.fromBase': 'Desde base',
    'billing.fromTotal': 'Desde total',
    'billing.hourly': 'Por hora',
    'billing.free': 'Gratis',
    'billing.eurPerHour': '€ / hora',
    'billing.baseEur': 'Base (€)',
    'billing.totalEur': 'Total (€)',
    'billing.ivaToggle': 'IVA ({0}%)',
    'billing.irpfToggle': 'IRPF ({0}%)',
    'billing.ivaException': 'Excepción IVA',
    'billing.paid': 'Pagado',
    'billing.paidOn': 'Pagado el {0}',
    'billing.payments': 'Cobros',
    'billing.addPayment': 'Registrar cobro',
    'billing.paymentAmount': 'Cobro (€)',
    'billing.remaining': 'Pendiente: {0}',
    'billing.progress': 'Cobrado {0} de {1}',
    'billing.partiallyPaid': 'Parcialmente cobrado',
    'billing.deletePayment': '¿Eliminar cobro de {0}?',
    'billing.alreadyPaid': 'Ya está totalmente cobrado',
    'billing.invoiceNo': 'Factura n.º {0} — {1}',
    'billing.base': 'Base',
    'billing.plusIva': '+ IVA {0}%',
    'billing.minusIrpf': '- IRPF {0}%',
    'billing.total': 'Total',
    'billing.net': 'Neto',
    'billing.noHoursYet': 'Sin horas aún',
    'billing.freeProject': 'Proyecto gratuito',
    'billing.taxableBase': 'Base imponible',
    'billing.plusIvaAmt': '+ IVA ({0}%)',
    'billing.minusIrpfAmt': '- IRPF ({0}%)',
    'billing.invoiceTotal': 'Total factura',
    'billing.netToReceive': 'Neto a recibir',
    'billing.profitability': 'Rentabilidad',

    /* ── Info (Dashboard) ── */
    'info.noProjects': 'No tienes proyectos todavía. Crea uno nuevo o importa tus datos desde un JSON.',
    'info.activeProjects.one': 'proyecto activo',
    'info.activeProjects.other': 'proyectos activos',
    'info.thisWeek': 'esta semana',
    'info.thisMonth': 'este mes',
    'info.pendingPayment.one': '{0} pendiente de cobro',
    'info.pendingPayment.other': '{0} pendientes de cobro',
    'info.allCollected': 'todo cobrado',
    'info.recentActivity': 'Actividad reciente',
    'info.today': 'Hoy',
    'info.yesterday': 'Ayer',
    'info.deadlines': 'Deadlines',
    'info.dOverdue': '{0}d atrasado',
    'info.tomorrow': 'Mañana',
    'info.dLeft': '{0}d',
    'info.financialSummary': 'Resumen financiero',
    'info.month': 'Mes',
    'info.quarter': 'Trim',
    'info.year': 'Año',
    'info.noActivity': 'Sin actividad en este periodo',
    'info.collected': 'Cobrado',
    'info.expensesLabel': 'Gastos',
    'info.netLabel': 'Neto',
    'info.hoursLabel': 'Horas',
    'info.realEurH': '€/hora real',
    'info.taxableBase': 'Base imponible',
    'info.outputVat': 'IVA repercutido',
    'info.irpfWithheld': 'IRPF retenido',
    'info.pendingPaymentAlert': '{0} — pendiente de pago',

    /* ── Ejemplos ── */
    'examples.title': 'Probar con datos de ejemplo',
    'examples.marina': 'Traductora freelance',
    'examples.ana': 'Música y productora',
    'examples.dani': 'Formador tech',

    /* ── Proyectos (Dash) ── */
    'dash.external': 'Externos',
    'dash.all': 'Todos',
    'dash.internal': 'Internos',
    'dash.recurring': 'Recurrentes',
    'dash.noProjects': 'Sin proyectos',
    'dash.flagInternal': 'interno',
    'dash.flagRecurring': 'recurrente',
    'dash.flagPaid': 'pagado',
    'dash.flagInvoiced': 'facturado',
    'dash.flagPartial': 'parcial',
    'dash.free': 'gratis',
    'dash.markPaid': 'Marcar pagado',

    /* ── Detalle ── */
    'det.backProjects': '← proyectos',
    'det.info': 'Info',
    'det.hours': 'Horas',
    'det.noHours': 'Sin horas',
    'det.invoice': 'Factura',
    'det.work': 'Trabajo',
    'det.meeting': 'Reunión',
    'det.editHour': 'Editar hora',
    'det.addHours': 'Añadir horas',
    'det.deleteHourConfirm': '¿Eliminar esta entrada de horas?',
    'det.deleteProjectConfirm': '¿Eliminar "{0}"?',

    /* ── Calendario ── */
    'cal.today': 'Hoy',
    'cal.month': 'Mes',
    'cal.week': 'Semana',
    'cal.monthTotal': 'Total mes:',
    'cal.weekTotal': 'Total semana:',
    'cal.noTime': 'Sin hora asignada',
    'cal.monthExpenses': 'Gastos del mes',
    'cal.monthCollections': 'Cobros del mes',
    'cal.weekExpenses': 'Gastos de la semana',
    'cal.weekCollections': 'Cobros de la semana',
    'cal.hoursMonth': 'Horas/mes',
    'cal.hoursWeek': 'Horas/semana',
    'cal.income': 'Ingresos',
    'cal.target': 'obj: {0}',
    'cal.noGoals': 'Sin objetivos.',
    'cal.configureLink': 'Configurar →',
    'cal.goals': 'Objetivos',
    'cal.projectsInPeriod': 'Proyectos en este periodo',
    'cal.monthSummary': 'Resumen del mes',
    'cal.collected': 'Cobrado',
    'cal.expensesLabel': 'Gastos',
    'cal.net': 'Neto',
    'cal.realEurH': '€/h real',
    'cal.noHoursDay': 'Sin horas este día',
    'cal.addHour': 'Añadir hora',
    'cal.expensesDay': 'Gastos',

    /* ── Configuración ── */
    'cfg.issuerTitle': 'Datos del emisor (para facturas)',
    'cfg.nameCompany': 'Nombre / Empresa',
    'cfg.address1': 'Dirección línea 1',
    'cfg.address2': 'Dirección línea 2',
    'cfg.nif': 'NIF / CIF',
    'cfg.defaults': 'Valores por defecto',
    'cfg.ivaPercent': 'IVA %',
    'cfg.irpfPercent': 'IRPF %',
    'cfg.bankAccount': 'Cuenta bancaria donde efectuar el ingreso',
    'cfg.defaultSubject': 'Concepto por defecto',
    'cfg.appendClientName': 'Añadir nombre del cliente',
    'ph.defaultSubject': 'Ej: Diseño web',
    'cfg.goals': 'Objetivos',
    'cfg.hoursMonth': 'Horas / mes',
    'cfg.incomeMonth': 'Ingresos / mes (€)',
    'cfg.hoursWeek': 'Horas / semana',
    'cfg.theme': 'Tema',
    'cfg.clients': 'Clientes',
    'cfg.noClients': 'Sin clientes. Se crearán al añadir proyectos.',
    'cfg.editClient': 'Editar cliente',
    'cfg.newClient': 'Nuevo cliente',
    'cfg.deleteClientConfirm': '¿Eliminar cliente "{0}"?',
    'cfg.saved': 'Configuración guardada',
    'cfg.importOldInvoices': 'Importar facturas antiguas',
    'cfg.importOldDesc': 'Importa JSONs del generador de facturas anterior',

    /* ── Dinero ── */
    'din.income': 'Ingresos',
    'din.expenses': 'Gastos',
    'din.net': 'Neto',
    'din.incomeTitle': 'Ingresos',
    'din.expensesTitle': 'Gastos',
    'din.noIncome': 'Sin ingresos en este periodo',
    'din.invoice': 'Factura',
    'din.hourly': 'Por hora',
    'din.taxBase': 'Base imponible',
    'din.vatCharged': 'IVA repercutido',
    'din.vatDeductible': 'IVA soportado',
    'din.irpfWithheld': 'IRPF retenido',
    'din.taxSummary': 'Resumen fiscal',
    'din.model303': 'Modelo 303 — IVA',
    'din.model130': 'Modelo 130 — IRPF',
    'din.toPay': 'A pagar',
    'din.deductibleExp': 'Gastos deducibles',
    'din.netProfit': 'Rendimiento neto',
    'din.withholdings': 'Retenciones',

    /* ── Renta ── */
    'renta.title': 'Renta (Modelo 100)',
    'renta.annualIncome': 'Ingresos anuales',
    'renta.businessExpenses': 'Gastos actividad',
    'renta.activityProfit': 'Rendimiento actividad',
    'renta.deductions': 'Deducciones adicionales',
    'renta.totalDeductions': 'Total deducciones',
    'renta.taxableIncome': 'Base imponible estimada',
    'renta.addDeduction': 'Añadir deducción',
    'renta.editDeduction': 'Editar deducción',
    'renta.deleteConfirm': '¿Eliminar deducción "{0}"?',
    'renta.noDeductions': 'Sin deducciones registradas',

    /* ── Gastos ── */
    'gas.noExpenses': 'Sin gastos registrados',
    'gas.entries': 'entr.',
    'gas.editExpense': 'Editar gasto',
    'gas.newExpense': 'Nuevo gasto',
    'gas.deleteConfirm': '¿Eliminar gasto "{0}"?',
    'gas.addEntry': 'Añadir entrada',
    'gas.deductibleBadge': 'desgravable',

    /* ── Campos desgravable ── */
    'field.deductible': 'Desgravable',
    'field.ivaRate': 'Tipo de IVA',
    'iva.21': 'General (21%)',
    'iva.10': 'Reducido (10%)',
    'iva.4': 'Superreducido (4%)',
    'iva.0': 'Exento (0%)',

    /* ── Categorías deducibles ── */
    'ded.autonomos': 'Cuota de autónomos',
    'ded.alquiler': 'Alquiler',
    'ded.suministros': 'Suministros',
    'ded.software': 'Software',
    'ded.formacion': 'Formación',
    'ded.material': 'Material y equipos',
    'ded.transporte': 'Transporte',
    'ded.seguros': 'Seguros',
    'ded.asesoria': 'Asesoría',
    'ded.amortizacion': 'Amortización',
    'ded.otro': 'Otro',

    /* ── Factura PDF ── */
    'fac.invoice': 'Factura',
    'fac.issuerLabel': 'EMISOR',
    'fac.invoiceData': 'DATOS DE FACTURA',
    'fac.clientLabel': 'CLIENTE',
    'fac.nif': 'NIF: ',
    'fac.noClient': 'Sin cliente',
    'fac.noName': 'Sin nombre',
    'fac.concept': 'CONCEPTO',
    'fac.taxableBase': 'Base imponible',
    'fac.retention': 'Retención IRPF ({0}%)',
    'fac.iva': 'IVA ({0}%)',
    'fac.ivaException': 'IVA: {0}',
    'fac.total': 'TOTAL',
    'fac.paymentMethod': 'FORMA DE PAGO',
    'fac.bankTransferText': 'Abonar mediante transferencia bancaria al número de cuenta:',

    /* ── Factura modal ── */
    'fac.generate': 'Generar factura',
    'fac.issuer': 'Emisor',
    'fac.client': 'Cliente',
    'fac.configure': '(configurar)',

    /* ── Mensajes ── */
    'msg.nameRequired': 'Nombre obligatorio',
    'msg.clientNameRequired': 'Nombre de cliente obligatorio',
    'msg.projectNameRequired': 'Nombre de proyecto obligatorio',
    'msg.fileTooLarge': 'Archivo demasiado grande ({0}MB). Máximo: 5MB',
    'msg.invalidJsonProjects': 'JSON no válido: falta "projects"',
    'msg.invalidJsonProjectId': 'JSON no válido: proyecto sin id o nombre',
    'msg.invalidJsonHoras': 'JSON no válido: "horas" no es un array',
    'msg.invalidJsonClientes': 'JSON no válido: "clientes" no es un array',
    'msg.invalidJsonGastos': 'JSON no válido: "gastos" no es un array',
    'msg.importSuccess': 'Datos importados correctamente',
    'msg.importError': 'Error al importar: ',
    'msg.resetConfirm': '¿Borrar todos los datos y empezar de cero? Esta acción no se puede deshacer.',
    'msg.exampleLoaded': 'Datos de ejemplo cargados correctamente',
    'msg.invoicesImported': '{0} facturas importadas, {1} proyectos creados',
    'msg.noValidInvoices': 'Ningún archivo contenía facturas válidas',
    'msg.invoiceImportError': 'Error al importar factura: {0}',

    /* ── Guía ── */
    'guide.title': 'Guía',
    'guide.nav': 'Guía',
    'guide.projects.title': 'Proyectos',
    'guide.projects.desc': 'Crea, organiza y sigue tus proyectos',
    'guide.projects.body': '<p>Cada proyecto tiene un <strong>nombre</strong>, un <strong>cliente</strong> (opcional), un <strong>color</strong> y un <strong>estado</strong>.</p><p><strong>Estados disponibles:</strong></p><ul><li><strong>Potencial</strong> — un lead o propuesta que aún no se ha confirmado. Puedes registrar el tiempo de llamadas y reuniones iniciales.</li><li><strong>Activo</strong> — proyecto en marcha.</li><li><strong>Pausado</strong> — esperando feedback del cliente o detenido temporalmente.</li><li><strong>Completado</strong> — trabajo terminado.</li><li><strong>Abandonado</strong> — cancelado o descartado.</li></ul><p>También puedes marcar un proyecto como <strong>interno</strong> (para ti, sin cliente) o <strong>recurrente</strong> (trabajo continuado).</p><div class="guide-tip">En la vista "Todos" los proyectos se agrupan: activos externos → internos → recurrentes → potenciales → pausados.</div>',

    'guide.hours.title': 'Registro de horas',
    'guide.hours.desc': 'Apunta tu tiempo de trabajo y reuniones',
    'guide.hours.body': '<p>Dentro de cada proyecto puedes añadir <strong>entradas de horas</strong> con:</p><ul><li><strong>Tipo</strong>: 💻 trabajo o 👥 reunión.</li><li><strong>Cantidad</strong>: horas dedicadas (ej. 2.5h).</li><li><strong>Fecha</strong> y opcionalmente <strong>hora de inicio</strong>.</li><li><strong>Nota</strong>: qué hiciste.</li><li><strong>Cobro</strong> (€): si cobras por hora, el importe de esa entrada.</li></ul><div class="guide-tip">En el calendario semanal puedes arrastrar para crear entradas directamente sobre el timeline.</div>',

    'guide.billing.title': 'Facturación',
    'guide.billing.desc': 'IVA, IRPF, modos de cobro y precios',
    'guide.billing.body': '<p>Cada proyecto tiene su propio modo de facturación:</p><ul><li><strong>Desde base</strong> — introduces la base imponible (lo que cobras antes de impuestos).</li><li><strong>Desde total</strong> — introduces el total que te pagan y se calcula la base automáticamente.</li><li><strong>Por hora</strong> — defines un €/hora y se calcula según las horas registradas.</li><li><strong>Gratis</strong> — proyecto sin facturación (internos, favores, etc.).</li></ul><p><strong>IVA e IRPF</strong> se definen por proyecto. Por defecto usan los valores de Configuración, pero puedes cambiarlos (ej. 10% para espectáculos, 0% para formación exenta).</p><div class="guide-tip">El campo "Excepción IVA" aparece en la factura cuando aplicas un IVA diferente al estándar.</div>',

    'guide.payments.title': 'Cobros parciales',
    'guide.payments.desc': 'Registra pagos fraccionados de tus clientes',
    'guide.payments.body': '<p>Cada proyecto puede tener <strong>múltiples cobros</strong>. No hace falta que el cliente pague todo de una vez.</p><ul><li>En el detalle del proyecto verás la sección <strong>Cobros</strong> con una barra de progreso.</li><li>Pulsa <strong>"Registrar cobro"</strong> para añadir un pago parcial con fecha y cantidad.</li><li>Cuando la suma de cobros alcanza el neto a recibir, el proyecto se marca como <strong>pagado</strong> automáticamente.</li></ul><p>Los cobros parciales aparecen en <strong>Dineros</strong> y en el <strong>Calendario</strong> en su fecha real — no como pago único.</p><div class="guide-tip">Los impuestos trimestrales se prorratean automáticamente según la fecha de cada cobro.</div>',

    'guide.calendar.title': 'Calendario',
    'guide.calendar.desc': 'Vista semanal, mensual y arrastrar para añadir',
    'guide.calendar.body': '<p>El calendario tiene dos vistas:</p><ul><li><strong>Semana</strong> (por defecto): timeline con las horas del día. Puedes <strong>arrastrar</strong> sobre un día para crear una entrada de horas.</li><li><strong>Mes</strong>: vista general con las entradas de cada día. Haz click en un día para ver el detalle.</li></ul><p>Debajo del calendario verás: gastos de la semana/mes, cobros, objetivos y un resumen financiero.</p>',

    'guide.invoices.title': 'Facturas PDF',
    'guide.invoices.desc': 'Genera facturas profesionales en PDF',
    'guide.invoices.body': '<p>Desde el detalle de un proyecto con facturación, pulsa <strong>"Factura"</strong> para generar un PDF.</p><ul><li>Se asigna un <strong>número de factura</strong> automático (o puedes editarlo).</li><li>El PDF incluye tus datos (de Configuración), los del cliente, el desglose de importes y la cuenta bancaria.</li><li>Puedes elegir el <strong>idioma de la factura</strong> (español o inglés) por proyecto.</li></ul><div class="guide-tip">Rellena tus datos del emisor en Configuración para que aparezcan en las facturas.</div>',

    'guide.money.title': 'Dineros',
    'guide.money.desc': 'Ingresos, gastos, impuestos y renta',
    'guide.money.body': '<p>La sección <strong>Dineros</strong> te da una visión financiera completa:</p><ul><li><strong>Resumen</strong>: barras de ingresos vs gastos por mes, trimestre o año.</li><li><strong>Ingresos</strong>: lista de cobros recibidos en el periodo.</li><li><strong>Gastos</strong>: categorías de gasto recurrentes y puntuales. Marca los desgravables.</li><li><strong>Modelo 303</strong>: estimación de IVA repercutido vs soportado por trimestre.</li><li><strong>Modelo 130</strong>: estimación de pago fraccionado IRPF.</li><li><strong>Renta</strong>: resumen anual con ingresos, gastos deducibles y base imponible.</li></ul>',

    'guide.config.title': 'Configuración',
    'guide.config.desc': 'Idioma, tema, datos del emisor y objetivos',
    'guide.config.body': '<p>En Configuración puedes ajustar:</p><ul><li><strong>Idioma</strong>: español, inglés o catalán.</li><li><strong>Tema</strong>: 8 paletas de colores para elegir.</li><li><strong>Datos del emisor</strong>: nombre, dirección, NIF — aparecen en las facturas.</li><li><strong>IVA/IRPF por defecto</strong>: los valores que se rellenan al crear un proyecto nuevo.</li><li><strong>Objetivos</strong>: horas/semana, horas/mes, ingresos/mes — para las barras de progreso del calendario.</li></ul>',

    'guide.data.title': 'Tus datos',
    'guide.data.desc': 'Exportar, importar y privacidad',
    'guide.data.body': '<p>Trackr guarda todos los datos en tu navegador (<strong>localStorage</strong>). No hay servidor, no hay cuenta, no hay cloud.</p><ul><li><strong>Exportar</strong>: descarga un archivo .json con todos tus proyectos, horas, gastos y configuración.</li><li><strong>Importar</strong>: carga un .json para restaurar o mover tus datos a otro navegador.</li></ul><div class="guide-tip">Haz backups regulares exportando tu archivo. Si cambias de navegador o borras datos, necesitarás el .json para recuperar todo.</div>'
  },

  en: {

    /* ── Nav ── */
    'nav.info': 'Info',
    'nav.projects': 'Projects',
    'nav.calendar': 'Calendar',
    'nav.expenses': 'Money',
    'nav.config': 'Settings',
    'nav.guide': 'Guide',
    'nav.export': 'Export',
    'nav.import': 'Import',

    /* ── Común / Botones ── */
    'btn.save': 'Save',
    'btn.create': 'Create',
    'btn.cancel': 'Cancel',
    'btn.delete': 'Delete',
    'btn.edit': 'Edit',
    'btn.add': 'Add',
    'btn.close': 'Close',
    'btn.newProject': '+ New project',
    'btn.newExpense': '+ New expense',
    'btn.newClient': '+ New client',
    'btn.addEntry': '+ Add entry',
    'btn.addHour': '+ Add',
    'btn.addHourCal': '+ Add hour',
    'btn.loadJson': 'Load JSON',
    'btn.loadAnotherJson': 'Load another JSON',
    'btn.newUser': 'New user',
    'btn.logout': 'Log out',
    'msg.logoutTitle': 'Log out',
    'msg.logoutBody': 'All session data will be deleted. Remember to export your JSON first if you don\'t want to lose your work. TRACKR does not store anyone\'s data.',
    'btn.downloadPdf': 'Download PDF',
    'btn.saveCfg': 'Save settings',
    'btn.createNew': '+ Create new...',
    'btn.createNewProject': '+ Create new project...',
    'btn.newClientOpt': '+ New client...',

    /* ── Constantes: Estados ── */
    'est.potencial': 'Potential',
    'est.activo': 'Active',
    'est.pausado': 'Paused',
    'est.completado': 'Completed',
    'est.abandonado': 'Archived',

    /* ── Constantes: Estados plural (para grupos) ── */
    'est.potenciales': 'Potential',
    'est.activos': 'Active',
    'est.pausados': 'Paused',
    'est.completados': 'Completed',
    'est.abandonados': 'Archived',

    /* ── Constantes: Categorías de gasto ── */
    'cat.herramientas': 'Tools',
    'cat.formacion': 'Training',
    'cat.software': 'Software',
    'cat.marketing': 'Marketing',
    'cat.oficina': 'Office',
    'cat.otro': 'Other',

    /* ── Constantes: Recurrencia ── */
    'rec.no': 'One-time',
    'rec.mensual': 'Monthly',
    'rec.anual': 'Annual',

    /* ── Constantes: Meses ── */
    'month.0': 'January', 'month.1': 'February', 'month.2': 'March',
    'month.3': 'April', 'month.4': 'May', 'month.5': 'June',
    'month.6': 'July', 'month.7': 'August', 'month.8': 'September',
    'month.9': 'October', 'month.10': 'November', 'month.11': 'December',

    /* ── Constantes: Días semana ── */
    'dow.0': 'Mon', 'dow.1': 'Tue', 'dow.2': 'Wed',
    'dow.3': 'Thu', 'dow.4': 'Fri', 'dow.5': 'Sat', 'dow.6': 'Sun',

    /* ── Constantes: Temas ── */
    'theme.oscuro': 'Dark',
    'theme.claro': 'Light',
    'theme.medianoche': 'Midnight',
    'theme.sepia': 'Sepia',
    'theme.nord': 'Nord',
    'theme.monokai': 'Monokai',
    'theme.pizarra': 'Slate',
    'theme.ocaso': 'Dusk',
    'theme.arena': 'Sand',
    'theme.hacker': 'Hacker',
    'theme.lavanda': 'Lavender',
    'theme.tinta': 'Ink',
    'theme.bosque': 'Forest',
    'theme.cerezo': 'Cherry',
    'theme.nube': 'Cloud',
    'theme.melocoton': 'Peach',
    'theme.menta': 'Mint',
    'theme.sol': 'Sun',

    /* ── Idiomas ── */
    'lang.es': 'Español',
    'lang.en': 'English',
    'lang.ca': 'Català',
    'lang.label': 'Language',

    /* ── Campos de formulario ── */
    'field.name': 'Name',
    'field.client': 'Client',
    'field.noClient': '— No client —',
    'field.color': 'Color',
    'field.status': 'Status',
    'field.internal': 'Internal',
    'field.recurring': 'Recurring',
    'field.start': 'Start',
    'field.estEnd': 'Est. end',
    'field.actualEnd': 'Actual end',
    'field.notes': 'Notes',
    'field.date': 'Date',
    'field.note': 'Note',
    'field.hours': 'Hours',
    'field.startTime': 'Start time',
    'field.amount': 'Amount (€)',
    'field.amountEntry': 'Amount (€)',
    'field.noDate': 'No date',
    'field.category': 'Category',
    'field.recurrence': 'Recurrence',
    'field.nickname': 'Nickname',
    'field.fullName': 'Full name',
    'field.subject': 'Subject',
    'field.invoiceNum': 'Invoice no.',
    'field.paymentDate': 'Payment date',
    'field.project': 'Project',
    'field.projectName': 'Project name',
    'field.clientName': 'Client name',
    'field.invoiceLang': 'Invoice language',

    /* ── Placeholders ── */
    'ph.projectName': 'Conor\'s Website',
    'ph.newClient': 'New client name',
    'ph.newProjectName': 'Project name',
    'ph.newClientName': 'Client name',
    'ph.ivaException': 'E.g.: Intra-EU supply',
    'ph.notes': '...',
    'ph.whatDidYouDo': 'What did you work on?',
    'ph.expenseName': 'E.g.: Mentoring, Domain...',
    'ph.detail': 'Detail',
    'ph.nameOrCompany': 'Your name or company',
    'ph.street': 'Street, number',
    'ph.cityZip': 'Zip, City, Country',
    'ph.nif': '12345678A',
    'ph.bankAccount': 'ES12 3456 7890 1234 5678 9012',
    'ph.clientNameOrCompany': 'Name or company',
    'ph.fullName': 'Full legal name',
    'ph.clientCity': 'Zip, City',
    'ph.hoursMonth': 'E.g.: 160',
    'ph.incomeMonth': 'E.g.: 3000',
    'ph.hoursWeek': 'E.g.: 40',

    /* ── Facturación ── */
    'billing.title': 'Billing',
    'billing.fromBase': 'From base',
    'billing.fromTotal': 'From total',
    'billing.hourly': 'Hourly',
    'billing.free': 'Free',
    'billing.eurPerHour': '€ / hour',
    'billing.baseEur': 'Base (€)',
    'billing.totalEur': 'Total (€)',
    'billing.ivaToggle': 'VAT ({0}%)',
    'billing.irpfToggle': 'IRPF ({0}%)',
    'billing.ivaException': 'VAT exception',
    'billing.paid': 'Paid',
    'billing.paidOn': 'Paid on {0}',
    'billing.payments': 'Payments',
    'billing.addPayment': 'Add payment',
    'billing.paymentAmount': 'Amount (€)',
    'billing.remaining': 'Remaining: {0}',
    'billing.progress': 'Collected {0} of {1}',
    'billing.partiallyPaid': 'Partially paid',
    'billing.deletePayment': 'Delete payment of {0}?',
    'billing.alreadyPaid': 'Already fully paid',
    'billing.invoiceNo': 'Invoice no. {0} — {1}',
    'billing.base': 'Base',
    'billing.plusIva': '+ VAT {0}%',
    'billing.minusIrpf': '- IRPF {0}%',
    'billing.total': 'Total',
    'billing.net': 'Net',
    'billing.noHoursYet': 'No hours yet',
    'billing.freeProject': 'Free project',
    'billing.taxableBase': 'Taxable base',
    'billing.plusIvaAmt': '+ VAT ({0}%)',
    'billing.minusIrpfAmt': '- IRPF ({0}%)',
    'billing.invoiceTotal': 'Invoice total',
    'billing.netToReceive': 'Net to receive',
    'billing.profitability': 'Profitability',

    /* ── Info (Dashboard) ── */
    'info.noProjects': 'You don\'t have any projects yet. Create a new one or import your data from a JSON file.',
    'info.activeProjects.one': 'active project',
    'info.activeProjects.other': 'active projects',
    'info.thisWeek': 'this week',
    'info.thisMonth': 'this month',
    'info.pendingPayment.one': '{0} pending payment',
    'info.pendingPayment.other': '{0} pending payments',
    'info.allCollected': 'all collected',
    'info.recentActivity': 'Recent activity',
    'info.today': 'Today',
    'info.yesterday': 'Yesterday',
    'info.deadlines': 'Deadlines',
    'info.dOverdue': '{0}d overdue',
    'info.tomorrow': 'Tomorrow',
    'info.dLeft': '{0}d',
    'info.financialSummary': 'Financial summary',
    'info.month': 'Month',
    'info.quarter': 'Quarter',
    'info.year': 'Year',
    'info.noActivity': 'No activity in this period',
    'info.collected': 'Collected',
    'info.expensesLabel': 'Expenses',
    'info.netLabel': 'Net',
    'info.hoursLabel': 'Hours',
    'info.realEurH': 'Real €/h',
    'info.taxableBase': 'Taxable base',
    'info.outputVat': 'Output VAT',
    'info.irpfWithheld': 'IRPF withheld',
    'info.pendingPaymentAlert': '{0} — pending payment',

    /* ── Ejemplos ── */
    'examples.title': 'Try with sample data',
    'examples.marina': 'Freelance translator',
    'examples.ana': 'Musician & producer',
    'examples.dani': 'Tech trainer',

    /* ── Proyectos (Dash) ── */
    'dash.external': 'External',
    'dash.all': 'All',
    'dash.internal': 'Internal',
    'dash.recurring': 'Recurring',
    'dash.noProjects': 'No projects',
    'dash.flagInternal': 'internal',
    'dash.flagRecurring': 'recurring',
    'dash.flagPaid': 'paid',
    'dash.flagInvoiced': 'invoiced',
    'dash.flagPartial': 'partial',
    'dash.free': 'free',
    'dash.markPaid': 'Mark paid',

    /* ── Detalle ── */
    'det.backProjects': '← projects',
    'det.info': 'Info',
    'det.hours': 'Hours',
    'det.noHours': 'No hours',
    'det.invoice': 'Invoice',
    'det.work': 'Work',
    'det.meeting': 'Meeting',
    'det.editHour': 'Edit hour',
    'det.addHours': 'Add hours',
    'det.deleteHourConfirm': 'Delete this time entry?',
    'det.deleteProjectConfirm': 'Delete "{0}"?',

    /* ── Calendario ── */
    'cal.today': 'Today',
    'cal.month': 'Month',
    'cal.week': 'Week',
    'cal.monthTotal': 'Month total:',
    'cal.weekTotal': 'Week total:',
    'cal.noTime': 'Unassigned time',
    'cal.monthExpenses': 'Month expenses',
    'cal.monthCollections': 'Month collections',
    'cal.weekExpenses': 'Week expenses',
    'cal.weekCollections': 'Week collections',
    'cal.hoursMonth': 'Hours/month',
    'cal.hoursWeek': 'Hours/week',
    'cal.income': 'Income',
    'cal.target': 'target: {0}',
    'cal.noGoals': 'No goals set.',
    'cal.configureLink': 'Configure →',
    'cal.goals': 'Goals',
    'cal.projectsInPeriod': 'Projects in this period',
    'cal.monthSummary': 'Month summary',
    'cal.collected': 'Collected',
    'cal.expensesLabel': 'Expenses',
    'cal.net': 'Net',
    'cal.realEurH': 'Real €/h',
    'cal.noHoursDay': 'No hours this day',
    'cal.addHour': 'Add hour',
    'cal.expensesDay': 'Expenses',

    /* ── Configuración ── */
    'cfg.issuerTitle': 'Issuer data (for invoices)',
    'cfg.nameCompany': 'Name / Company',
    'cfg.address1': 'Address line 1',
    'cfg.address2': 'Address line 2',
    'cfg.nif': 'Tax ID',
    'cfg.defaults': 'Defaults',
    'cfg.ivaPercent': 'VAT %',
    'cfg.irpfPercent': 'IRPF %',
    'cfg.bankAccount': 'Bank account for payment',
    'cfg.defaultSubject': 'Default subject',
    'cfg.appendClientName': 'Append client name',
    'ph.defaultSubject': 'E.g.: Web design',
    'cfg.goals': 'Goals',
    'cfg.hoursMonth': 'Hours / month',
    'cfg.incomeMonth': 'Income / month (€)',
    'cfg.hoursWeek': 'Hours / week',
    'cfg.theme': 'Theme',
    'cfg.clients': 'Clients',
    'cfg.noClients': 'No clients yet. They\'ll be created when you add projects.',
    'cfg.editClient': 'Edit client',
    'cfg.newClient': 'New client',
    'cfg.deleteClientConfirm': 'Delete client "{0}"?',
    'cfg.saved': 'Settings saved',
    'cfg.importOldInvoices': 'Import old invoices',
    'cfg.importOldDesc': 'Import JSONs from the old invoice generator',

    /* ── Dinero ── */
    'din.income': 'Income',
    'din.expenses': 'Expenses',
    'din.net': 'Net',
    'din.incomeTitle': 'Income',
    'din.expensesTitle': 'Expenses',
    'din.noIncome': 'No income in this period',
    'din.invoice': 'Invoice',
    'din.hourly': 'Hourly',
    'din.taxBase': 'Tax base',
    'din.vatCharged': 'Output VAT',
    'din.vatDeductible': 'Input VAT',
    'din.irpfWithheld': 'IRPF withheld',
    'din.taxSummary': 'Tax summary',
    'din.model303': 'Model 303 — VAT',
    'din.model130': 'Model 130 — Income tax',
    'din.toPay': 'To pay',
    'din.deductibleExp': 'Deductible expenses',
    'din.netProfit': 'Net profit',
    'din.withholdings': 'Withholdings',

    /* ── Renta ── */
    'renta.title': 'Tax return (Modelo 100)',
    'renta.annualIncome': 'Annual income',
    'renta.businessExpenses': 'Business expenses',
    'renta.activityProfit': 'Activity profit',
    'renta.deductions': 'Additional deductions',
    'renta.totalDeductions': 'Total deductions',
    'renta.taxableIncome': 'Estimated taxable income',
    'renta.addDeduction': 'Add deduction',
    'renta.editDeduction': 'Edit deduction',
    'renta.deleteConfirm': 'Delete deduction "{0}"?',
    'renta.noDeductions': 'No deductions recorded',

    /* ── Gastos ── */
    'gas.noExpenses': 'No expenses recorded',
    'gas.entries': 'entries',
    'gas.editExpense': 'Edit expense',
    'gas.newExpense': 'New expense',
    'gas.deleteConfirm': 'Delete expense "{0}"?',
    'gas.addEntry': 'Add entry',
    'gas.deductibleBadge': 'deductible',

    /* ── Campos desgravable ── */
    'field.deductible': 'Tax deductible',
    'field.ivaRate': 'VAT rate',
    'iva.21': 'Standard (21%)',
    'iva.10': 'Reduced (10%)',
    'iva.4': 'Super-reduced (4%)',
    'iva.0': 'Exempt (0%)',

    /* ── Deductible categories ── */
    'ded.autonomos': 'Self-employed fee',
    'ded.alquiler': 'Rent',
    'ded.suministros': 'Utilities',
    'ded.software': 'Software',
    'ded.formacion': 'Training',
    'ded.material': 'Equipment & supplies',
    'ded.transporte': 'Transport',
    'ded.seguros': 'Insurance',
    'ded.asesoria': 'Consulting',
    'ded.amortizacion': 'Depreciation',
    'ded.otro': 'Other',

    /* ── Factura PDF ── */
    'fac.invoice': 'Invoice',
    'fac.issuerLabel': 'ISSUER',
    'fac.invoiceData': 'INVOICE DETAILS',
    'fac.clientLabel': 'CLIENT',
    'fac.nif': 'Tax ID: ',
    'fac.noClient': 'No client',
    'fac.noName': 'No name',
    'fac.concept': 'DESCRIPTION',
    'fac.taxableBase': 'Taxable base',
    'fac.retention': 'IRPF Withholding ({0}%)',
    'fac.iva': 'VAT ({0}%)',
    'fac.ivaException': 'VAT: {0}',
    'fac.total': 'TOTAL',
    'fac.paymentMethod': 'PAYMENT METHOD',
    'fac.bankTransferText': 'Pay by bank transfer to account number:',

    /* ── Factura modal ── */
    'fac.generate': 'Generate invoice',
    'fac.issuer': 'Issuer',
    'fac.client': 'Client',
    'fac.configure': '(configure)',

    /* ── Mensajes ── */
    'msg.nameRequired': 'Name is required',
    'msg.clientNameRequired': 'Client name is required',
    'msg.projectNameRequired': 'Project name is required',
    'msg.fileTooLarge': 'File too large ({0}MB). Maximum: 5MB',
    'msg.invalidJsonProjects': 'Invalid JSON: "projects" is missing',
    'msg.invalidJsonProjectId': 'Invalid JSON: project without id or name',
    'msg.invalidJsonHoras': 'Invalid JSON: "horas" is not an array',
    'msg.invalidJsonClientes': 'Invalid JSON: "clientes" is not an array',
    'msg.invalidJsonGastos': 'Invalid JSON: "gastos" is not an array',
    'msg.importSuccess': 'Data imported successfully',
    'msg.importError': 'Import error: ',
    'msg.resetConfirm': 'Delete all data and start over? This action cannot be undone.',
    'msg.exampleLoaded': 'Sample data loaded successfully',
    'msg.invoicesImported': '{0} invoices imported, {1} projects created',
    'msg.noValidInvoices': 'No files contained valid invoices',
    'msg.invoiceImportError': 'Error importing invoice: {0}',

    /* ── Guide ── */
    'guide.title': 'Guide',
    'guide.nav': 'Guide',
    'guide.projects.title': 'Projects',
    'guide.projects.desc': 'Create, organize and track your projects',
    'guide.projects.body': '<p>Each project has a <strong>name</strong>, a <strong>client</strong> (optional), a <strong>color</strong> and a <strong>status</strong>.</p><p><strong>Available statuses:</strong></p><ul><li><strong>Potential</strong> — a lead or proposal not yet confirmed. You can log time for initial calls and meetings.</li><li><strong>Active</strong> — ongoing project.</li><li><strong>Paused</strong> — waiting for client feedback or temporarily stopped.</li><li><strong>Completed</strong> — work finished.</li><li><strong>Archived</strong> — cancelled or discarded.</li></ul><p>You can also mark a project as <strong>internal</strong> (for yourself, no client) or <strong>recurring</strong> (ongoing work).</p><div class="guide-tip">In the "All" view, projects are grouped: active external → internal → recurring → potential → paused.</div>',

    'guide.hours.title': 'Time tracking',
    'guide.hours.desc': 'Log your work and meeting hours',
    'guide.hours.body': '<p>Inside each project you can add <strong>hour entries</strong> with:</p><ul><li><strong>Type</strong>: 💻 work or 👥 meeting.</li><li><strong>Amount</strong>: hours spent (e.g. 2.5h).</li><li><strong>Date</strong> and optionally <strong>start time</strong>.</li><li><strong>Note</strong>: what you did.</li><li><strong>Amount (€)</strong>: if you bill per hour, the amount for that entry.</li></ul><div class="guide-tip">In the weekly calendar you can drag to create entries directly on the timeline.</div>',

    'guide.billing.title': 'Billing',
    'guide.billing.desc': 'VAT, income tax, billing modes and prices',
    'guide.billing.body': '<p>Each project has its own billing mode:</p><ul><li><strong>From base</strong> — enter the taxable base (what you charge before taxes).</li><li><strong>From total</strong> — enter the total and the base is calculated automatically.</li><li><strong>Hourly</strong> — set a €/hour rate, calculated from logged hours.</li><li><strong>Free</strong> — no billing (internal projects, favors, etc.).</li></ul><p><strong>VAT and income tax</strong> are set per project. They default to the values in Settings, but you can change them (e.g. 10% for live performances, 0% for exempt education).</p><div class="guide-tip">The "VAT exception" field appears on the invoice when you apply a non-standard VAT rate.</div>',

    'guide.payments.title': 'Partial payments',
    'guide.payments.desc': 'Record installment payments from your clients',
    'guide.payments.body': '<p>Each project can have <strong>multiple payments</strong>. Clients don\'t have to pay everything at once.</p><ul><li>In the project detail you\'ll see the <strong>Payments</strong> section with a progress bar.</li><li>Click <strong>"Add payment"</strong> to record a partial payment with date and amount.</li><li>When payments reach the net receivable, the project is marked as <strong>paid</strong> automatically.</li></ul><p>Partial payments appear in <strong>Money</strong> and <strong>Calendar</strong> on their actual date — not as a single lump sum.</p><div class="guide-tip">Quarterly taxes are automatically prorated based on each payment\'s date.</div>',

    'guide.calendar.title': 'Calendar',
    'guide.calendar.desc': 'Weekly, monthly view and drag to add',
    'guide.calendar.body': '<p>The calendar has two views:</p><ul><li><strong>Week</strong> (default): timeline with hours of the day. You can <strong>drag</strong> on a day to create an hour entry.</li><li><strong>Month</strong>: overview with entries for each day. Click a day for details.</li></ul><p>Below the calendar you\'ll find: weekly/monthly expenses, payments, goals and a financial summary.</p>',

    'guide.invoices.title': 'PDF Invoices',
    'guide.invoices.desc': 'Generate professional PDF invoices',
    'guide.invoices.body': '<p>From a project detail with billing, click <strong>"Invoice"</strong> to generate a PDF.</p><ul><li>An <strong>invoice number</strong> is assigned automatically (or you can edit it).</li><li>The PDF includes your details (from Settings), client info, amount breakdown and bank account.</li><li>You can choose the <strong>invoice language</strong> (Spanish or English) per project.</li></ul><div class="guide-tip">Fill in your issuer details in Settings so they appear on invoices.</div>',

    'guide.money.title': 'Money',
    'guide.money.desc': 'Income, expenses, taxes and annual summary',
    'guide.money.body': '<p>The <strong>Money</strong> section gives you a complete financial overview:</p><ul><li><strong>Summary</strong>: income vs expenses bars by month, quarter or year.</li><li><strong>Income</strong>: list of payments received in the period.</li><li><strong>Expenses</strong>: recurring and one-off expense categories. Mark deductible ones.</li><li><strong>Model 303</strong>: estimated output VAT vs input VAT per quarter.</li><li><strong>Model 130</strong>: estimated quarterly income tax payment.</li><li><strong>Tax return</strong>: annual summary with income, deductible expenses and taxable base.</li></ul>',

    'guide.config.title': 'Settings',
    'guide.config.desc': 'Language, theme, issuer details and goals',
    'guide.config.body': '<p>In Settings you can adjust:</p><ul><li><strong>Language</strong>: Spanish, English or Catalan.</li><li><strong>Theme</strong>: 8 color palettes to choose from.</li><li><strong>Issuer details</strong>: name, address, tax ID — shown on invoices.</li><li><strong>Default VAT/tax</strong>: values pre-filled when creating a new project.</li><li><strong>Goals</strong>: hours/week, hours/month, income/month — for the calendar progress bars.</li></ul>',

    'guide.data.title': 'Your data',
    'guide.data.desc': 'Export, import and privacy',
    'guide.data.body': '<p>Trackr stores all data in your browser (<strong>localStorage</strong>). No server, no account, no cloud.</p><ul><li><strong>Export</strong>: download a .json file with all your projects, hours, expenses and settings.</li><li><strong>Import</strong>: load a .json to restore or move your data to another browser.</li></ul><div class="guide-tip">Make regular backups by exporting your file. If you switch browsers or clear data, you\'ll need the .json to recover everything.</div>'
  },

  ca: {

    /* ── Nav ── */
    'nav.info': 'Info',
    'nav.projects': 'Projectes',
    'nav.calendar': 'Calendari',
    'nav.expenses': 'Diners',
    'nav.config': 'Configuració',
    'nav.guide': 'Guia',
    'nav.export': 'Exportar',
    'nav.import': 'Importar',

    /* ── Comú / Botons ── */
    'btn.save': 'Desar',
    'btn.create': 'Crear',
    'btn.cancel': 'Cancel·lar',
    'btn.delete': 'Eliminar',
    'btn.edit': 'Editar',
    'btn.add': 'Afegir',
    'btn.close': 'Tancar',
    'btn.newProject': '+ Nou projecte',
    'btn.newExpense': '+ Nova despesa',
    'btn.newClient': '+ Nou client',
    'btn.addEntry': '+ Afegir entrada',
    'btn.addHour': '+ Afegir',
    'btn.addHourCal': '+ Afegir hora',
    'btn.loadJson': 'Carregar JSON',
    'btn.loadAnotherJson': 'Carregar un altre JSON',
    'btn.newUser': 'Nou usuari',
    'btn.logout': 'Tancar sessió',
    'msg.logoutTitle': 'Tancar sessió',
    'msg.logoutBody': 'S\'esborraran totes les dades d\'aquesta sessió. Recorda exportar el teu JSON abans si no vols perdre la teva feina. TRACKR no guarda dades de ningú.',
    'btn.downloadPdf': 'Descarregar PDF',
    'btn.saveCfg': 'Desar configuració',
    'btn.createNew': '+ Crear nou...',
    'btn.createNewProject': '+ Crear nou projecte...',
    'btn.newClientOpt': '+ Nou client...',

    /* ── Constants: Estats ── */
    'est.potencial': 'Potencial',
    'est.activo': 'Actiu',
    'est.pausado': 'Pausat',
    'est.completado': 'Completat',
    'est.abandonado': 'Abandonat',

    /* ── Constants: Estats plural ── */
    'est.potenciales': 'Potencials',
    'est.activos': 'Actius',
    'est.pausados': 'Pausats',
    'est.completados': 'Completats',
    'est.abandonados': 'Abandonats',

    /* ── Constants: Categories de despesa ── */
    'cat.herramientas': 'Eines',
    'cat.formacion': 'Formació',
    'cat.software': 'Programari',
    'cat.marketing': 'Màrqueting',
    'cat.oficina': 'Oficina',
    'cat.otro': 'Altre',

    /* ── Constants: Recurrència ── */
    'rec.no': 'Puntual',
    'rec.mensual': 'Mensual',
    'rec.anual': 'Anual',

    /* ── Constants: Mesos ── */
    'month.0': 'Gener', 'month.1': 'Febrer', 'month.2': 'Març',
    'month.3': 'Abril', 'month.4': 'Maig', 'month.5': 'Juny',
    'month.6': 'Juliol', 'month.7': 'Agost', 'month.8': 'Setembre',
    'month.9': 'Octubre', 'month.10': 'Novembre', 'month.11': 'Desembre',

    /* ── Constants: Dies setmana ── */
    'dow.0': 'Dll', 'dow.1': 'Dm', 'dow.2': 'Dc',
    'dow.3': 'Dj', 'dow.4': 'Dv', 'dow.5': 'Ds', 'dow.6': 'Dg',

    /* ── Constants: Temes ── */
    'theme.oscuro': 'Fosc',
    'theme.claro': 'Clar',
    'theme.medianoche': 'Mitjanit',
    'theme.sepia': 'Sèpia',
    'theme.nord': 'Nord',
    'theme.monokai': 'Monokai',
    'theme.pizarra': 'Pissarra',
    'theme.ocaso': 'Capvespre',
    'theme.arena': 'Sorra',
    'theme.hacker': 'Hacker',
    'theme.lavanda': 'Lavanda',
    'theme.tinta': 'Tinta',
    'theme.bosque': 'Bosc',
    'theme.cerezo': 'Cirerer',
    'theme.nube': 'Núvol',
    'theme.melocoton': 'Préssec',
    'theme.menta': 'Menta',
    'theme.sol': 'Sol',

    /* ── Idiomes ── */
    'lang.es': 'Español',
    'lang.en': 'English',
    'lang.ca': 'Català',
    'lang.label': 'Idioma',

    /* ── Camps de formulari ── */
    'field.name': 'Nom',
    'field.client': 'Client',
    'field.noClient': '— Sense client —',
    'field.color': 'Color',
    'field.status': 'Estat',
    'field.internal': 'Intern',
    'field.recurring': 'Recurrent',
    'field.start': 'Inici',
    'field.estEnd': 'Fi estimada',
    'field.actualEnd': 'Fi real',
    'field.notes': 'Notes',
    'field.date': 'Data',
    'field.note': 'Nota',
    'field.hours': 'Hores',
    'field.startTime': 'Hora d\'inici',
    'field.amount': 'Cobrament (€)',
    'field.amountEntry': 'Quantitat (€)',
    'field.noDate': 'Sense data',
    'field.category': 'Categoria',
    'field.recurrence': 'Recurrència',
    'field.nickname': 'Sobrenom',
    'field.fullName': 'Nom complet',
    'field.subject': 'Assumpte',
    'field.invoiceNum': 'N. factura',
    'field.paymentDate': 'Data de pagament',
    'field.project': 'Projecte',
    'field.projectName': 'Nom del projecte',
    'field.clientName': 'Nom del client',
    'field.invoiceLang': 'Idioma de la factura',

    /* ── Placeholders ── */
    'ph.projectName': 'Web Conor',
    'ph.newClient': 'Nom del nou client',
    'ph.newProjectName': 'Nom del projecte',
    'ph.newClientName': 'Nom del client',
    'ph.ivaException': 'Ex: Art. 20 LIVA',
    'ph.notes': '...',
    'ph.whatDidYouDo': 'Què has fet?',
    'ph.expenseName': 'Ex: Mentoring, Domini...',
    'ph.detail': 'Detall',
    'ph.nameOrCompany': 'El teu nom o empresa',
    'ph.street': 'Carrer, número',
    'ph.cityZip': 'CP, Ciutat, País',
    'ph.nif': '12345678A',
    'ph.bankAccount': 'ES12 3456 7890 1234 5678 9012',
    'ph.clientNameOrCompany': 'Nom o empresa',
    'ph.fullName': 'Nom legal complet',
    'ph.clientCity': 'CP, Ciutat',
    'ph.hoursMonth': 'Ex: 160',
    'ph.incomeMonth': 'Ex: 3000',
    'ph.hoursWeek': 'Ex: 40',

    /* ── Facturació ── */
    'billing.title': 'Facturació',
    'billing.fromBase': 'Des de base',
    'billing.fromTotal': 'Des de total',
    'billing.hourly': 'Per hora',
    'billing.free': 'Gratuït',
    'billing.eurPerHour': '€ / hora',
    'billing.baseEur': 'Base (€)',
    'billing.totalEur': 'Total (€)',
    'billing.ivaToggle': 'IVA ({0}%)',
    'billing.irpfToggle': 'IRPF ({0}%)',
    'billing.ivaException': 'Excepció IVA',
    'billing.paid': 'Pagat',
    'billing.paidOn': 'Pagat el {0}',
    'billing.payments': 'Cobraments',
    'billing.addPayment': 'Registrar cobrament',
    'billing.paymentAmount': 'Cobrament (€)',
    'billing.remaining': 'Pendent: {0}',
    'billing.progress': 'Cobrat {0} de {1}',
    'billing.partiallyPaid': 'Parcialment cobrat',
    'billing.deletePayment': 'Eliminar cobrament de {0}?',
    'billing.alreadyPaid': 'Ja està totalment cobrat',
    'billing.invoiceNo': 'Factura n. {0} — {1}',
    'billing.base': 'Base',
    'billing.plusIva': '+ IVA {0}%',
    'billing.minusIrpf': '- IRPF {0}%',
    'billing.total': 'Total',
    'billing.net': 'Net',
    'billing.noHoursYet': 'Sense hores encara',
    'billing.freeProject': 'Projecte gratuït',
    'billing.taxableBase': 'Base imposable',
    'billing.plusIvaAmt': '+ IVA ({0}%)',
    'billing.minusIrpfAmt': '- IRPF ({0}%)',
    'billing.invoiceTotal': 'Total factura',
    'billing.netToReceive': 'Net a rebre',
    'billing.profitability': 'Rendibilitat',

    /* ── Info (Dashboard) ── */
    'info.noProjects': 'No tens projectes encara. Crea\'n un de nou o importa les teves dades des d\'un JSON.',
    'info.activeProjects.one': 'projecte actiu',
    'info.activeProjects.other': 'projectes actius',
    'info.thisWeek': 'aquesta setmana',
    'info.thisMonth': 'aquest mes',
    'info.pendingPayment.one': '{0} pendent de cobrament',
    'info.pendingPayment.other': '{0} pendents de cobrament',
    'info.allCollected': 'tot cobrat',
    'info.recentActivity': 'Activitat recent',
    'info.today': 'Avui',
    'info.yesterday': 'Ahir',
    'info.deadlines': 'Terminis',
    'info.dOverdue': '{0}d de retard',
    'info.tomorrow': 'Demà',
    'info.dLeft': '{0}d',
    'info.financialSummary': 'Resum financer',
    'info.month': 'Mes',
    'info.quarter': 'Trim',
    'info.year': 'Any',
    'info.noActivity': 'Sense activitat en aquest període',
    'info.collected': 'Cobrat',
    'info.expensesLabel': 'Despeses',
    'info.netLabel': 'Net',
    'info.hoursLabel': 'Hores',
    'info.realEurH': '€/hora real',
    'info.taxableBase': 'Base imposable',
    'info.outputVat': 'IVA repercutit',
    'info.irpfWithheld': 'IRPF retingut',
    'info.pendingPaymentAlert': '{0} — pendent de pagament',

    /* ── Exemples ── */
    'examples.title': 'Provar amb dades d\'exemple',
    'examples.marina': 'Traductora freelance',
    'examples.ana': 'Música i productora',
    'examples.dani': 'Formador tech',

    /* ── Projectes (Dash) ── */
    'dash.external': 'Externs',
    'dash.all': 'Tots',
    'dash.internal': 'Interns',
    'dash.recurring': 'Recurrents',
    'dash.noProjects': 'Sense projectes',
    'dash.flagInternal': 'intern',
    'dash.flagRecurring': 'recurrent',
    'dash.flagPaid': 'pagat',
    'dash.flagInvoiced': 'facturat',
    'dash.flagPartial': 'parcial',
    'dash.free': 'gratuït',
    'dash.markPaid': 'Marcar pagat',

    /* ── Detall ── */
    'det.backProjects': '← projectes',
    'det.info': 'Info',
    'det.hours': 'Hores',
    'det.noHours': 'Sense hores',
    'det.invoice': 'Factura',
    'det.work': 'Treball',
    'det.meeting': 'Reunió',
    'det.editHour': 'Editar hora',
    'det.addHours': 'Afegir hores',
    'det.deleteHourConfirm': 'Eliminar aquesta entrada d\'hores?',
    'det.deleteProjectConfirm': 'Eliminar "{0}"?',

    /* ── Calendari ── */
    'cal.today': 'Avui',
    'cal.month': 'Mes',
    'cal.week': 'Setmana',
    'cal.monthTotal': 'Total mes:',
    'cal.weekTotal': 'Total setmana:',
    'cal.noTime': 'Sense hora assignada',
    'cal.monthExpenses': 'Despeses del mes',
    'cal.monthCollections': 'Cobraments del mes',
    'cal.weekExpenses': 'Despeses de la setmana',
    'cal.weekCollections': 'Cobraments de la setmana',
    'cal.hoursMonth': 'Hores/mes',
    'cal.hoursWeek': 'Hores/setmana',
    'cal.income': 'Ingressos',
    'cal.target': 'obj: {0}',
    'cal.noGoals': 'Sense objectius.',
    'cal.configureLink': 'Configurar →',
    'cal.goals': 'Objectius',
    'cal.projectsInPeriod': 'Projectes en aquest període',
    'cal.monthSummary': 'Resum del mes',
    'cal.collected': 'Cobrat',
    'cal.expensesLabel': 'Despeses',
    'cal.net': 'Net',
    'cal.realEurH': '€/h real',
    'cal.noHoursDay': 'Sense hores aquest dia',
    'cal.addHour': 'Afegir hora',
    'cal.expensesDay': 'Despeses',

    /* ── Configuració ── */
    'cfg.issuerTitle': 'Dades de l\'emissor (per a factures)',
    'cfg.nameCompany': 'Nom / Empresa',
    'cfg.address1': 'Adreça línia 1',
    'cfg.address2': 'Adreça línia 2',
    'cfg.nif': 'NIF / CIF',
    'cfg.defaults': 'Valors per defecte',
    'cfg.ivaPercent': 'IVA %',
    'cfg.irpfPercent': 'IRPF %',
    'cfg.bankAccount': 'Compte bancari on fer l\'ingrés',
    'cfg.defaultSubject': 'Concepte per defecte',
    'cfg.appendClientName': 'Afegir nom del client',
    'ph.defaultSubject': 'Ex: Disseny web',
    'cfg.goals': 'Objectius',
    'cfg.hoursMonth': 'Hores / mes',
    'cfg.incomeMonth': 'Ingressos / mes (€)',
    'cfg.hoursWeek': 'Hores / setmana',
    'cfg.theme': 'Tema',
    'cfg.clients': 'Clients',
    'cfg.noClients': 'Sense clients. Es crearan en afegir projectes.',
    'cfg.editClient': 'Editar client',
    'cfg.newClient': 'Nou client',
    'cfg.deleteClientConfirm': 'Eliminar client "{0}"?',
    'cfg.saved': 'Configuració desada',
    'cfg.importOldInvoices': 'Importar factures antigues',
    'cfg.importOldDesc': 'Importa JSONs del generador de factures anterior',

    /* ── Diners ── */
    'din.income': 'Ingressos',
    'din.expenses': 'Despeses',
    'din.net': 'Net',
    'din.incomeTitle': 'Ingressos',
    'din.expensesTitle': 'Despeses',
    'din.noIncome': 'Sense ingressos en aquest període',
    'din.invoice': 'Factura',
    'din.hourly': 'Per hora',
    'din.taxBase': 'Base imposable',
    'din.vatCharged': 'IVA repercutit',
    'din.vatDeductible': 'IVA suportat',
    'din.irpfWithheld': 'IRPF retingut',
    'din.taxSummary': 'Resum fiscal',
    'din.model303': 'Model 303 — IVA',
    'din.model130': 'Model 130 — IRPF',
    'din.toPay': 'A pagar',
    'din.deductibleExp': 'Despeses deduïbles',
    'din.netProfit': 'Rendiment net',
    'din.withholdings': 'Retencions',

    /* ── Renda ── */
    'renta.title': 'Renda (Model 100)',
    'renta.annualIncome': 'Ingressos anuals',
    'renta.businessExpenses': 'Despeses d\'activitat',
    'renta.activityProfit': 'Rendiment d\'activitat',
    'renta.deductions': 'Deduccions addicionals',
    'renta.totalDeductions': 'Total deduccions',
    'renta.taxableIncome': 'Base imposable estimada',
    'renta.addDeduction': 'Afegir deducció',
    'renta.editDeduction': 'Editar deducció',
    'renta.deleteConfirm': 'Eliminar deducció "{0}"?',
    'renta.noDeductions': 'Sense deduccions registrades',

    /* ── Despeses ── */
    'gas.noExpenses': 'Sense despeses registrades',
    'gas.entries': 'entr.',
    'gas.editExpense': 'Editar despesa',
    'gas.newExpense': 'Nova despesa',
    'gas.deleteConfirm': 'Eliminar despesa "{0}"?',
    'gas.addEntry': 'Afegir entrada',
    'gas.deductibleBadge': 'desgravable',

    /* ── Camps desgravable ── */
    'field.deductible': 'Desgravable',
    'field.ivaRate': 'Tipus d\'IVA',
    'iva.21': 'General (21%)',
    'iva.10': 'Reduït (10%)',
    'iva.4': 'Superreduït (4%)',
    'iva.0': 'Exempt (0%)',

    /* ── Categories deduïbles ── */
    'ded.autonomos': 'Quota d\'autònoms',
    'ded.alquiler': 'Lloguer',
    'ded.suministros': 'Subministraments',
    'ded.software': 'Programari',
    'ded.formacion': 'Formació',
    'ded.material': 'Material i equips',
    'ded.transporte': 'Transport',
    'ded.seguros': 'Assegurances',
    'ded.asesoria': 'Assessoria',
    'ded.amortizacion': 'Amortització',
    'ded.otro': 'Altre',

    /* ── Factura PDF ── */
    'fac.invoice': 'Factura',
    'fac.issuerLabel': 'EMISSOR',
    'fac.invoiceData': 'DADES DE FACTURA',
    'fac.clientLabel': 'CLIENT',
    'fac.nif': 'NIF: ',
    'fac.noClient': 'Sense client',
    'fac.noName': 'Sense nom',
    'fac.concept': 'CONCEPTE',
    'fac.taxableBase': 'Base imposable',
    'fac.retention': 'Retenció IRPF ({0}%)',
    'fac.iva': 'IVA ({0}%)',
    'fac.ivaException': 'IVA: {0}',
    'fac.total': 'TOTAL',
    'fac.paymentMethod': 'FORMA DE PAGAMENT',
    'fac.bankTransferText': 'Cal abonar mitjançant transferència bancària al nombre de compte:',

    /* ── Factura modal ── */
    'fac.generate': 'Generar factura',
    'fac.issuer': 'Emissor',
    'fac.client': 'Client',
    'fac.configure': '(configurar)',

    /* ── Missatges ── */
    'msg.nameRequired': 'Nom obligatori',
    'msg.clientNameRequired': 'Nom de client obligatori',
    'msg.projectNameRequired': 'Nom de projecte obligatori',
    'msg.fileTooLarge': 'Fitxer massa gran ({0}MB). Màxim: 5MB',
    'msg.invalidJsonProjects': 'JSON no vàlid: falta "projects"',
    'msg.invalidJsonProjectId': 'JSON no vàlid: projecte sense id o nom',
    'msg.invalidJsonHoras': 'JSON no vàlid: "horas" no és un array',
    'msg.invalidJsonClientes': 'JSON no vàlid: "clientes" no és un array',
    'msg.invalidJsonGastos': 'JSON no vàlid: "gastos" no és un array',
    'msg.importSuccess': 'Dades importades correctament',
    'msg.importError': 'Error en importar: ',
    'msg.resetConfirm': 'Vols esborrar totes les dades i començar de zero? Aquesta acció no es pot desfer.',
    'msg.exampleLoaded': 'Dades d\'exemple carregades correctament',
    'msg.invoicesImported': '{0} factures importades, {1} projectes creats',
    'msg.noValidInvoices': 'Cap fitxer contenia factures vàlides',
    'msg.invoiceImportError': 'Error en importar factura: {0}',

    /* ── Guia ── */
    'guide.title': 'Guia',
    'guide.nav': 'Guia',
    'guide.projects.title': 'Projectes',
    'guide.projects.desc': 'Crea, organitza i segueix els teus projectes',
    'guide.projects.body': '<p>Cada projecte té un <strong>nom</strong>, un <strong>client</strong> (opcional), un <strong>color</strong> i un <strong>estat</strong>.</p><p><strong>Estats disponibles:</strong></p><ul><li><strong>Potencial</strong> — un lead o proposta que encara no s\'ha confirmat. Pots registrar el temps de trucades i reunions inicials.</li><li><strong>Actiu</strong> — projecte en marxa.</li><li><strong>Pausat</strong> — esperant feedback del client o aturat temporalment.</li><li><strong>Completat</strong> — feina acabada.</li><li><strong>Abandonat</strong> — cancel·lat o descartat.</li></ul><p>També pots marcar un projecte com a <strong>intern</strong> (per a tu, sense client) o <strong>recurrent</strong> (feina continuada).</p><div class="guide-tip">A la vista "Tots" els projectes s\'agrupen: actius externs → interns → recurrents → potencials → pausats.</div>',

    'guide.hours.title': 'Registre d\'hores',
    'guide.hours.desc': 'Apunta el teu temps de treball i reunions',
    'guide.hours.body': '<p>Dins de cada projecte pots afegir <strong>entrades d\'hores</strong> amb:</p><ul><li><strong>Tipus</strong>: 💻 treball o 👥 reunió.</li><li><strong>Quantitat</strong>: hores dedicades (ex. 2.5h).</li><li><strong>Data</strong> i opcionalment <strong>hora d\'inici</strong>.</li><li><strong>Nota</strong>: què has fet.</li><li><strong>Cobrament (€)</strong>: si cobres per hora, l\'import d\'aquesta entrada.</li></ul><div class="guide-tip">Al calendari setmanal pots arrossegar per crear entrades directament sobre el timeline.</div>',

    'guide.billing.title': 'Facturació',
    'guide.billing.desc': 'IVA, IRPF, modes de cobrament i preus',
    'guide.billing.body': '<p>Cada projecte té el seu propi mode de facturació:</p><ul><li><strong>Des de base</strong> — introdueixes la base imposable (el que cobres abans d\'impostos).</li><li><strong>Des de total</strong> — introdueixes el total i es calcula la base automàticament.</li><li><strong>Per hora</strong> — defineixes un €/hora i es calcula segons les hores registrades.</li><li><strong>Gratuït</strong> — projecte sense facturació (interns, favors, etc.).</li></ul><p><strong>IVA i IRPF</strong> es defineixen per projecte. Per defecte usen els valors de Configuració, però pots canviar-los (ex. 10% per espectacles, 0% per formació exempta).</p><div class="guide-tip">El camp "Excepció IVA" apareix a la factura quan apliques un IVA diferent de l\'estàndard.</div>',

    'guide.payments.title': 'Cobraments parcials',
    'guide.payments.desc': 'Registra pagaments fraccionats dels teus clients',
    'guide.payments.body': '<p>Cada projecte pot tenir <strong>múltiples cobraments</strong>. No cal que el client pagui tot de cop.</p><ul><li>Al detall del projecte veuràs la secció <strong>Cobraments</strong> amb una barra de progrés.</li><li>Prem <strong>"Registrar cobrament"</strong> per afegir un pagament parcial amb data i quantitat.</li><li>Quan la suma de cobraments arriba al net a rebre, el projecte es marca com a <strong>pagat</strong> automàticament.</li></ul><p>Els cobraments parcials apareixen a <strong>Diners</strong> i al <strong>Calendari</strong> a la seva data real.</p><div class="guide-tip">Els impostos trimestrals es prorrategen automàticament segons la data de cada cobrament.</div>',

    'guide.calendar.title': 'Calendari',
    'guide.calendar.desc': 'Vista setmanal, mensual i arrossegar per afegir',
    'guide.calendar.body': '<p>El calendari té dues vistes:</p><ul><li><strong>Setmana</strong> (per defecte): timeline amb les hores del dia. Pots <strong>arrossegar</strong> sobre un dia per crear una entrada d\'hores.</li><li><strong>Mes</strong>: vista general amb les entrades de cada dia. Fes clic en un dia per veure el detall.</li></ul><p>Sota el calendari trobaràs: despeses de la setmana/mes, cobraments, objectius i un resum financer.</p>',

    'guide.invoices.title': 'Factures PDF',
    'guide.invoices.desc': 'Genera factures professionals en PDF',
    'guide.invoices.body': '<p>Des del detall d\'un projecte amb facturació, prem <strong>"Factura"</strong> per generar un PDF.</p><ul><li>S\'assigna un <strong>número de factura</strong> automàtic (o pots editar-lo).</li><li>El PDF inclou les teves dades (de Configuració), les del client, el desglossament d\'imports i el compte bancari.</li><li>Pots triar l\'<strong>idioma de la factura</strong> (castellà o anglès) per projecte.</li></ul><div class="guide-tip">Omple les teves dades d\'emissor a Configuració perquè apareguin a les factures.</div>',

    'guide.money.title': 'Diners',
    'guide.money.desc': 'Ingressos, despeses, impostos i renda',
    'guide.money.body': '<p>La secció <strong>Diners</strong> et dona una visió financera completa:</p><ul><li><strong>Resum</strong>: barres d\'ingressos vs despeses per mes, trimestre o any.</li><li><strong>Ingressos</strong>: llista de cobraments rebuts en el període.</li><li><strong>Despeses</strong>: categories de despesa recurrents i puntuals. Marca les desgravables.</li><li><strong>Model 303</strong>: estimació d\'IVA repercutit vs suportat per trimestre.</li><li><strong>Model 130</strong>: estimació de pagament fraccionat IRPF.</li><li><strong>Renda</strong>: resum anual amb ingressos, despeses deduïbles i base imposable.</li></ul>',

    'guide.config.title': 'Configuració',
    'guide.config.desc': 'Idioma, tema, dades de l\'emissor i objectius',
    'guide.config.body': '<p>A Configuració pots ajustar:</p><ul><li><strong>Idioma</strong>: castellà, anglès o català.</li><li><strong>Tema</strong>: 8 paletes de colors per triar.</li><li><strong>Dades de l\'emissor</strong>: nom, adreça, NIF — apareixen a les factures.</li><li><strong>IVA/IRPF per defecte</strong>: els valors que s\'omplen en crear un projecte nou.</li><li><strong>Objectius</strong>: hores/setmana, hores/mes, ingressos/mes — per les barres de progrés del calendari.</li></ul>',

    'guide.data.title': 'Les teves dades',
    'guide.data.desc': 'Exportar, importar i privacitat',
    'guide.data.body': '<p>Trackr guarda totes les dades al teu navegador (<strong>localStorage</strong>). No hi ha servidor, no hi ha compte, no hi ha cloud.</p><ul><li><strong>Exportar</strong>: descarrega un fitxer .json amb tots els teus projectes, hores, despeses i configuració.</li><li><strong>Importar</strong>: carrega un .json per restaurar o moure les teves dades a un altre navegador.</li></ul><div class="guide-tip">Fes backups regulars exportant el teu fitxer. Si canvies de navegador o esborres dades, necessitaràs el .json per recuperar-ho tot.</div>'
  }

};

/**
 * Devuelve la traducción de una clave.
 * Soporta interpolación posicional: t('key', val0, val1) → reemplaza {0}, {1}
 */
function t(key) {
  let s = _strings[key] || LANGS.es[key] || key;
  for (let i = 1; i < arguments.length; i++) {
    s = s.replace('{' + (i - 1) + '}', arguments[i]);
  }
  return s;
}

/**
 * Pluralización simple.
 * tp('info.activeProjects', 3) → busca 'info.activeProjects.one' o '.other'
 */
function tp(key, n) {
  const suffix = n === 1 ? '.one' : '.other';
  return _strings[key + suffix] || LANGS.es[key + suffix] || key;
}

/**
 * Devuelve el locale para toLocaleString según el idioma activo.
 */
function currentLocale() {
  return _lang === 'en' ? 'en-GB' : _lang === 'ca' ? 'ca-ES' : 'es-ES';
}

/**
 * Obtiene la traducción para facturas usando un idioma específico (no el global).
 * Para facturas por proyecto.
 */
function tf(key, lang) {
  const dict = LANGS[lang] || LANGS.es;
  let s = dict[key] || LANGS.es[key] || key;
  for (let i = 2; i < arguments.length; i++) {
    s = s.replace('{' + (i - 2) + '}', arguments[i]);
  }
  return s;
}

/**
 * Cambia el idioma activo.
 * Actualiza diccionario, reasigna constants, persiste y re-renderiza.
 */
function setLang(code) {
  if (!LANGS[code]) return;
  _lang = code;
  _strings = LANGS[code];

  /* Reasignar constants globales */
  EST = {
    potencial: t('est.potencial'), activo: t('est.activo'), pausado: t('est.pausado'),
    completado: t('est.completado'), abandonado: t('est.abandonado')
  };

  GASTO_CAT = {
    herramientas: t('cat.herramientas'), formacion: t('cat.formacion'),
    software: t('cat.software'), marketing: t('cat.marketing'),
    oficina: t('cat.oficina'), otro: t('cat.otro')
  };

  RECURRENCIA = {
    no: t('rec.no'), mensual: t('rec.mensual'), anual: t('rec.anual')
  };

  TIPOS_IVA = {
    21: t('iva.21'), 10: t('iva.10'), 4: t('iva.4'), 0: t('iva.0')
  };

  DEDUCIBLE_CAT = {
    autonomos: t('ded.autonomos'), alquiler: t('ded.alquiler'),
    suministros: t('ded.suministros'), software: t('ded.software'),
    formacion: t('ded.formacion'), material: t('ded.material'),
    transporte: t('ded.transporte'), seguros: t('ded.seguros'),
    asesoria: t('ded.asesoria'), amortizacion: t('ded.amortizacion'),
    otro: t('ded.otro')
  };

  MESES = [];
  for (let i = 0; i < 12; i++) MESES.push(t('month.' + i));

  DIAS_SEM = [];
  for (let i = 0; i < 7; i++) DIAS_SEM.push(t('dow.' + i));

  /* Actualizar nav */
  _updateNav();

  /* Actualizar HTML lang */
  document.documentElement.lang = code === 'en' ? 'en' : code === 'ca' ? 'ca' : 'es';
}

/** Actualiza los textos de navegación en el HTML */
function _updateNav() {
  const map = {
    info: 'nav.info', dash: 'nav.projects', cal: 'nav.calendar',
    gas: 'nav.expenses', cfg: 'nav.config'
  };
  document.querySelectorAll('.ni[data-v]').forEach(el => {
    const v = el.dataset.v;
    if (map[v]) el.querySelector('.nt').textContent = t(map[v]);
  });

  /* Nav items sin data-v (export/import) */
  const navItems = document.querySelectorAll('.ni:not([data-v])');
  navItems.forEach(el => {
    const nt = el.querySelector('.nt');
    if (!nt) return;
    if (el.querySelector('.ic')?.textContent === '↓') nt.textContent = t('nav.export');
    else if (el.querySelector('.ic')?.textContent === '↑') nt.textContent = t('nav.import');
  });

  /* Títulos de vistas en HTML */
  const dashTitle = document.querySelector('#vDash .pt');
  if (dashTitle) dashTitle.textContent = t('nav.projects');
  const dashBtn = document.querySelector('#vDash .bt-p');
  if (dashBtn) dashBtn.textContent = t('btn.newProject');

  const calTitle = document.querySelector('#vCal .pt');
  if (calTitle) calTitle.textContent = t('nav.calendar');

  const gasTitle = document.querySelector('#vGas .pt');
  if (gasTitle) gasTitle.textContent = t('nav.expenses');
  const gasBtn = document.querySelector('#vGas .bt-p');
  if (gasBtn) gasBtn.textContent = t('btn.newExpense');

  const cfgTitle = document.querySelector('#vCfg .pt');
  if (cfgTitle) cfgTitle.textContent = t('nav.config');
}
