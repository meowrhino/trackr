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
    'nav.expenses': 'Gastos',
    'nav.config': 'Configuración',
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
    'btn.downloadPdf': 'Descargar PDF',
    'btn.saveCfg': 'Guardar configuración',
    'btn.createNew': '+ Crear nuevo...',
    'btn.createNewProject': '+ Crear nuevo proyecto...',
    'btn.newClientOpt': '+ Nuevo cliente...',

    /* ── Constantes: Estados ── */
    'est.activo': 'Activo',
    'est.pausado': 'Pausado',
    'est.completado': 'Completado',
    'est.abandonado': 'Abandonado',

    /* ── Constantes: Estados plural (para grupos) ── */
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

    /* ── Idiomas ── */
    'lang.es': 'Español',
    'lang.en': 'English',
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
    'examples.pablo': 'Desarrollador full-stack',
    'examples.marina': 'Traductora freelance',
    'examples.laura': 'Diseñadora gráfica',

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
    'dash.free': 'gratis',

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

    /* ── Gastos (legacy keys) ── */
    'gas.noExpenses': 'Sin gastos registrados',
    'gas.thisMonth': 'Este mes',
    'gas.thisYear': 'Este año',
    'gas.entries': 'entr.',
    'gas.editExpense': 'Editar gasto',
    'gas.newExpense': 'Nuevo gasto',
    'gas.deleteConfirm': '¿Eliminar gasto "{0}"?',
    'gas.addEntry': 'Añadir entrada',

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
    'msg.invoiceImportError': 'Error al importar factura: {0}'
  },

  en: {

    /* ── Nav ── */
    'nav.info': 'Info',
    'nav.projects': 'Projects',
    'nav.calendar': 'Calendar',
    'nav.expenses': 'Expenses',
    'nav.config': 'Settings',
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
    'btn.downloadPdf': 'Download PDF',
    'btn.saveCfg': 'Save settings',
    'btn.createNew': '+ Create new...',
    'btn.createNewProject': '+ Create new project...',
    'btn.newClientOpt': '+ New client...',

    /* ── Constantes: Estados ── */
    'est.activo': 'Active',
    'est.pausado': 'Paused',
    'est.completado': 'Completed',
    'est.abandonado': 'Archived',

    /* ── Constantes: Estados plural (para grupos) ── */
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

    /* ── Idiomas ── */
    'lang.es': 'Español',
    'lang.en': 'English',
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
    'examples.pablo': 'Full-stack developer',
    'examples.marina': 'Freelance translator',
    'examples.laura': 'Graphic designer',

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
    'dash.free': 'free',

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

    /* ── Gastos (legacy keys) ── */
    'gas.noExpenses': 'No expenses recorded',
    'gas.thisMonth': 'This month',
    'gas.thisYear': 'This year',
    'gas.entries': 'entries',
    'gas.editExpense': 'Edit expense',
    'gas.newExpense': 'New expense',
    'gas.deleteConfirm': 'Delete expense "{0}"?',
    'gas.addEntry': 'Add entry',

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
    'msg.invoiceImportError': 'Error importing invoice: {0}'
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
  return _lang === 'en' ? 'en-GB' : 'es-ES';
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
    activo: t('est.activo'), pausado: t('est.pausado'),
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

  MESES = [];
  for (let i = 0; i < 12; i++) MESES.push(t('month.' + i));

  DIAS_SEM = [];
  for (let i = 0; i < 7; i++) DIAS_SEM.push(t('dow.' + i));

  /* Actualizar nav */
  _updateNav();

  /* Actualizar HTML lang */
  document.documentElement.lang = code === 'en' ? 'en' : 'es';
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
