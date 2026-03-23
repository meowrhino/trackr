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
    'msg.invoiceImportError': 'Error al importar factura: {0}'
  },

  en: {

    /* ── Nav ── */
    'nav.info': 'Info',
    'nav.projects': 'Projects',
    'nav.calendar': 'Calendar',
    'nav.expenses': 'Money',
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
    'btn.logout': 'Log out',
    'msg.logoutTitle': 'Log out',
    'msg.logoutBody': 'All session data will be deleted. Remember to export your JSON first if you don\'t want to lose your work. TRACKR does not store anyone\'s data.',
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
    'msg.invoiceImportError': 'Error importing invoice: {0}'
  },

  ca: {

    /* ── Nav ── */
    'nav.info': 'Info',
    'nav.projects': 'Projectes',
    'nav.calendar': 'Calendari',
    'nav.expenses': 'Diners',
    'nav.config': 'Configuració',
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
    'est.activo': 'Actiu',
    'est.pausado': 'Pausat',
    'est.completado': 'Completat',
    'est.abandonado': 'Abandonat',

    /* ── Constants: Estats plural ── */
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
    'msg.invoiceImportError': 'Error en importar factura: {0}'
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
