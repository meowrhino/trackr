/* ================================================
 * TRACKR — Operaciones del gestor (TODO/21, Etapa B). Global: GOps.
 *
 * El blob lo escribe SOLO la persona. Cuando el gestor edita a un cliente, sus cambios
 * no se guardan como blob: viajan como OPERACIONES ({accion, entidad, entidadId, payload})
 * que la persona aplica encima de sus datos. De ahí salen autoría exacta, deshacer por
 * operación y cero guerra de merges.
 *
 * Dos caras, las dos aquí:
 *  - EMISOR (gestor en modo visor con edición): D._audit() desvía aquí cada mutación en vez
 *    de auditarla, se cifra con la shareKey del grant y se sube. La cola vive SOLO EN
 *    MEMORIA a propósito: el visor promete que nada del cliente toca el disco del gestor, y
 *    una cola en localStorage rompería eso (el payload es descifrable con su shareKey).
 *    El precio: cerrar la pestaña con ops sin enviar las pierde — de ahí el aviso al salir.
 *  - APLICADOR (persona): valida y aplica. ESTA ES LA FRONTERA DE SEGURIDAD. Todo lo que
 *    llega viene de una cuenta ajena, así que no se cree nada: ni la entidad, ni las claves
 *    del payload, ni quién dice ser el actor (eso sale del grant local, no de la op).
 *
 * Qué puede tocar el gestor (WRITABLE): proyectos (menos horas), clientes, gastos,
 * deducibles y settings.fiscal. Fuera quedan las horas (es el calendario de la persona),
 * las facturas (VeriFactu encadena huellas por emisor: firmar desde otra sesión rompería
 * la cadena), el journey y el resto de settings (identidad, tema, idioma, el propio grant).
 *
 * Dependencias: D (store), CA (cripto), Acc (red), uid() de utils.js.
 * ================================================ */
const GOps = (() => {

  /* Whitelist. `deny` son claves que el gestor no puede tocar ni siquiera dentro de una
     entidad que sí puede editar. Añadir una entidad aquí es ampliar lo que un gestor
     puede escribir en los datos de otra persona: pensárselo dos veces. */
  const WRITABLE = {
    /* noDelete: borrar el proyecto entero se llevaría las horas por dentro, y las horas
       están fuera del alcance del gestor (hallazgo #3 de la revisión). Puede vaciarlo o
       marcarlo, pero borrarlo es de la persona. */
    proyecto:  { list: 'projects',   deny: ['horas', 'journeyStage'], noDelete: true },
    cliente:   { list: 'clientes',   deny: [] },
    gasto:     { list: 'gastos',     deny: [] },
    deducible: { list: 'deducibles', deny: [] },
    settings:  { fiscalOnly: true },
  };
  const FISCAL_KEYS = ['eds', 'rendAnterior', 'saldoIvaInicial'];
  const ACCIONES = ['crear', 'editar', 'borrar'];

  /* Un inverso muy gordo (borrar un proyecto con años de horas) inflaría el blob de la
     persona; por encima de esto la op se aplica igual pero sin deshacer de un clic
     (quedan las copias de seguridad, que es justo su papel). */
  const UNDO_MAX = 4096;

  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

  /**
   * Recorta una op a lo permitido. La usan las DOS caras: el emisor para no mandar basura
   * y el aplicador como frontera. Devuelve {ok, payload, stripped} o {ok:false, why}.
   */
  function sanitize(accion, entidad, payload) {
    const spec = WRITABLE[entidad];
    if (!spec) return { ok: false, why: `entidad no editable por el gestor: ${entidad}` };
    if (!ACCIONES.includes(accion)) return { ok: false, why: `accion desconocida: ${accion}` };

    if (spec.fiscalOnly) {
      if (accion !== 'editar') return { ok: false, why: 'settings solo admite editar' };
      const f = payload && payload.fiscal;
      if (!f || typeof f !== 'object' || Array.isArray(f)) return { ok: false, why: 'settings: solo se edita fiscal' };
      const out = {};
      for (const k of FISCAL_KEYS) if (k in f) out[k] = f[k];
      if (!Object.keys(out).length) return { ok: false, why: 'settings: ninguna casilla fiscal conocida' };
      const stripped = Object.keys(f).length !== Object.keys(out).length || Object.keys(payload).length !== 1;
      return { ok: true, payload: { fiscal: out }, stripped };
    }

    if (accion === 'borrar') {
      if (spec.noDelete) return { ok: false, why: `el gestor no puede borrar: ${entidad}` };
      return { ok: true, payload: null, stripped: false };
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { ok: false, why: 'payload debe ser un objeto' };
    const out = {};
    let stripped = false;
    for (const k of Object.keys(payload)) {
      if (spec.deny.includes(k)) { stripped = true; continue; }  // p.ej. horas: el calendario es de la persona
      out[k] = payload[k];
    }
    // Si tras recortar no queda nada, la op no tenía más que campos prohibidos: rechazarla
    // en vez de aplicar un cambio vacío que dejaría una entrada fantasma en el historial.
    if (!Object.keys(out).length) return { ok: false, why: 'nada editable tras recortar los campos prohibidos' };
    return { ok: true, payload: out, stripped };
  }

  /* ══════════════════════════════════════════════
   *  EMISOR — lado gestor
   * ══════════════════════════════════════════════ */

  let _ctx = null;          // { grantId, shareKey } mientras se edita a un cliente
  let _queue = [];          // ops sin confirmar (SOLO memoria, ver cabecera)
  let _timer = null, _sending = false, _onChange = null, _onEmit = null;

  function startEditing(ctx) { _ctx = ctx; _queue = []; ping(); }
  function stopEditing() { _ctx = null; _queue = []; if (_timer) { clearTimeout(_timer); _timer = null; } ping(); }
  function emitting() { return !!_ctx; }
  function pending() { return _queue.length; }
  function onChange(fn) { _onChange = fn; }
  /** Resultado de cada intento de emisión (true=encolada, false=rechazada). Lo usa la UI
   *  para mantener la pantalla en la verdad: una mutación rechazada ya corrió en memoria
   *  y hay que revertirla, o el gestor vería un cambio que jamás viajará (ver App). */
  function onEmit(fn) { _onEmit = fn; }
  function ping() { if (_onChange) { try { _onChange({ pending: _queue.length, editing: !!_ctx }); } catch (e) { /* */ } } }
  function pingEmit(ok) { if (_onEmit) { try { _onEmit(ok); } catch (e) { /* */ } } }

  /** UUID v4 de verdad también sin crypto.randomUUID (contextos no seguros): el backend
   *  exige 36 chars y el antiguo fallback uid()+uid() daba 29 → 400. */
  function opId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  /** Encola una mutación como op. La llama D._audit() en modo visor con edición activa. */
  function emit(accion, entidad, entidadId, payload) {
    if (!_ctx) return;
    const c = sanitize(accion, entidad, payload);
    if (!c.ok) {
      console.warn('GOps: mutación no enviable —', c.why);
      if (typeof Toast !== 'undefined') Toast.warn(_txt('cantEdit'));
      pingEmit(false);
      return;
    }
    if (c.stripped) console.warn('GOps: se recortaron campos no editables de', entidad);
    _queue.push({
      id: opId(),
      op: { v: 1, ts: Date.now(), accion, entidad, entidadId: entidadId || null, payload: c.payload },
    });
    ping();
    pingEmit(true);
    schedule();
  }

  function schedule() {
    if (_timer || !_queue.length) return;
    _timer = setTimeout(() => { _timer = null; flush().catch(() => { /* reintenta al siguiente cambio */ }); }, 800);
  }

  /** Cifra y sube lo encolado. Best-effort con reintento; los fallos duros paran la edición. */
  async function flush() {
    if (!_ctx || _sending || !_queue.length) return { ok: true, sent: 0 };
    _sending = true;
    try {
      const batch = _queue.slice(0, 20);
      const wire = await Promise.all(batch.map(async q =>
        ({ id: q.id, payload: await CA.encryptOp(_ctx.shareKey, q.op, _ctx.grantId) })
      ));
      const r = await Acc.opsPush(_ctx.grantId, wire);
      if (r.ok) {
        _queue = _queue.slice(batch.length);
        ping();
        if (_queue.length) schedule();
        return { ok: true, sent: batch.length };
      }
      // Permiso retirado o vínculo revocado MIENTRAS editaba: no tiene sentido reintentar.
      // Se corta la edición aquí mismo (sin rebotar por la UI, que volvería a entrar en
      // flush); el ping() de stopEditing avisa a quien esté escuchando para que refresque.
      if (r.error === 'not_allowed' || r.error === 'not_found') {
        const why = r.error;
        _ctx = null; _queue = [];
        if (_timer) { clearTimeout(_timer); _timer = null; }
        ping();
        if (typeof Toast !== 'undefined') Toast.error(_txt(why === 'not_allowed' ? 'permRevoked' : 'grantGone'));
        return { ok: false, error: why };
      }
      schedule();  // red/servidor: se reintenta
      return { ok: false, error: r.error };
    } finally { _sending = false; }
  }

  /* ══════════════════════════════════════════════
   *  APLICADOR — lado persona (frontera de seguridad)
   * ══════════════════════════════════════════════ */

  /**
   * Aplica una op YA DESCIFRADA sobre D.d. No persiste ni audita: eso lo hace quien llama
   * (que es también quien sabe de qué gestoría viene, dato que NO se lee de la op).
   * @param {boolean} [trusted]  true cuando quien aplica es la PERSONA sobre sus propios
   *   datos (deshacer): ahí la whitelist del gestor no pinta nada — sin esto, deshacer un
   *   'borrar proyecto' restauraba el proyecto SIN horas porque sanitize las recortaba.
   * @returns {{ok:true, undo:object|null}|{ok:false, why:string}}
   */
  function apply(op, trusted) {
    if (!op || typeof op !== 'object' || op.v !== 1) return { ok: false, why: 'formato de op desconocido' };
    const c = trusted ? { ok: true, payload: op.payload } : sanitize(op.accion, op.entidad, op.payload);
    if (!c.ok) return { ok: false, why: c.why };
    const spec = WRITABLE[op.entidad];
    if (!spec) return { ok: false, why: 'entidad desconocida: ' + op.entidad };

    if (spec.fiscalOnly) {
      if (!D.d.settings.fiscal) D.d.settings.fiscal = {};
      const cur = D.d.settings.fiscal;
      const undoPayload = { fiscal: {} };
      for (const k of Object.keys(c.payload.fiscal)) undoPayload.fiscal[k] = cur[k] === undefined ? null : clone(cur[k]);
      Object.assign(cur, c.payload.fiscal);
      return { ok: true, undo: { accion: 'editar', entidad: 'settings', entidadId: null, payload: undoPayload } };
    }

    const id = op.entidadId;
    if (!id || typeof id !== 'string') return { ok: false, why: 'falta entidadId' };
    if (!Array.isArray(D.d[spec.list])) D.d[spec.list] = [];
    const list = D.d[spec.list];
    const i = list.findIndex(x => x && x.id === id);

    if (op.accion === 'crear') {
      // Si ya existe, la op es un reenvío: mergear en vez de duplicar la entidad.
      if (i !== -1) return applyEdit(list, i, c.payload, op);
      list.push(Object.assign({}, c.payload, { id }));
      return { ok: true, undo: { accion: 'borrar', entidad: op.entidad, entidadId: id, payload: null } };
    }
    if (op.accion === 'editar') {
      if (i === -1) return { ok: false, why: 'la entidad ya no existe' };
      return applyEdit(list, i, c.payload, op);
    }
    // borrar
    if (i === -1) return { ok: true, undo: null };   // ya no estaba: idempotente
    const old = clone(list[i]);
    list.splice(i, 1);
    return { ok: true, undo: { accion: 'crear', entidad: op.entidad, entidadId: id, payload: old } };
  }

  function applyEdit(list, i, payload, op) {
    const undoPayload = {};
    // El inverso guarda el valor ANTERIOR de cada clave tocada. Una clave que no existía
    // vuelve como null, no desaparece: deshacer restaura valores, no la forma del objeto.
    for (const k of Object.keys(payload)) undoPayload[k] = list[i][k] === undefined ? null : clone(list[i][k]);
    Object.assign(list[i], payload);
    return { ok: true, undo: { accion: 'editar', entidad: op.entidad, entidadId: op.entidadId, payload: undoPayload } };
  }

  /** ¿Cabe este inverso en el blob sin inflarlo? (ver UNDO_MAX) */
  function undoFits(undo) {
    if (!undo) return false;
    try { return JSON.stringify(undo).length <= UNDO_MAX; } catch (e) { return false; }
  }

  /**
   * Deshace una entrada del historial aplicando su inverso. El deshacer es en sí un cambio:
   * se anota como tal (actor = quien lo pulsa) y la entrada original queda marcada.
   */
  function undo(entry) {
    if (!entry || !entry.undo) return { ok: false, why: 'sin inverso' };
    const inv = entry.undo;
    const r = apply({ v: 1, ...inv }, true);   // trusted: la persona deshace sobre lo suyo
    if (!r.ok) return r;
    entry.undone = true;
    delete entry.undo;   // ya no se puede volver a deshacer, y libera sitio en el blob
    D._auditAs(D._actor(), inv.accion, inv.entidad, inv.entidadId);
    D.save();
    return { ok: true };
  }

  /* i18n mínimo del módulo (es/en/ca), como app.gestor.js */
  const TXT = {
    es: { cantEdit: 'Eso no lo puede editar la gestoría', permRevoked: 'La persona ha retirado el permiso de edición', grantGone: 'El vínculo ya no existe' },
    en: { cantEdit: 'Advisors cannot edit that', permRevoked: 'The client withdrew edit permission', grantGone: 'The link no longer exists' },
    ca: { cantEdit: 'Això no ho pot editar la gestoria', permRevoked: 'La persona ha retirat el permís d\'edició', grantGone: 'El vincle ja no existeix' },
  };
  const _txt = (k) => (TXT[typeof _lang !== 'undefined' ? _lang : 'es'] || TXT.es)[k] || k;

  return {
    WRITABLE, sanitize, apply, undo, undoFits,
    startEditing, stopEditing, emitting, pending, emit, flush, onChange, onEmit,
  };
})();
if (typeof window !== 'undefined') window.GOps = GOps;
