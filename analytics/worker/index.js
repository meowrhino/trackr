/* ================================================
 * TRACKR — Analytics Worker (Cloudflare)
 * Recibe eventos anónimos, agrega en KV, y commitea
 * un JSON al repo de GitHub diariamente via cron.
 *
 * KV keys:
 *   day:YYYY-MM-DD  → JSON con contadores del día
 *   sessions:YYYY-MM-DD → Set de session IDs (para contar únicos)
 *
 * Secrets necesarios (wrangler secret put):
 *   GITHUB_TOKEN  — PAT con scope contents:write
 *   GITHUB_REPO   — "usuario/repo"
 * ================================================ */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  /* ── HTTP handler: recibe eventos + dump endpoint ── */
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    /* GET /dump — devuelve todos los datos agregados (protegido con token) */
    if (request.method === 'GET' && url.pathname === '/dump') {
      const auth = request.headers.get('Authorization');
      if (!env.DUMP_TOKEN || auth !== `Bearer ${env.DUMP_TOKEN}`) {
        return new Response('Unauthorized', { status: 401 });
      }
      const result = [];
      const list = await env.ANALYTICS.list({ prefix: 'day:' });
      for (const key of list.keys) {
        const date = key.name.replace('day:', '');
        const counters = await env.ANALYTICS.get(key.name, 'json');
        const sessions = await env.ANALYTICS.get(`sessions:${date}`, 'json');
        result.push({ date, unique_sessions: sessions ? sessions.length : 0, events: counters });
      }
      result.sort((a, b) => a.date.localeCompare(b.date));
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      const { sid, events } = await request.json();
      if (!events || !Array.isArray(events) || !events.length) {
        return new Response('No events', { status: 400, headers: CORS_HEADERS });
      }

      const today = new Date().toISOString().slice(0, 10);
      const dayKey = `day:${today}`;
      const sessKey = `sessions:${today}`;

      /* Leer contadores actuales del día */
      let counters = await env.ANALYTICS.get(dayKey, 'json') || {};
      let sessions = await env.ANALYTICS.get(sessKey, 'json') || [];

      /* Contar sesión única */
      if (sid && !sessions.includes(sid)) {
        sessions.push(sid);
        /* Limitar a últimos 10000 para no explotar KV */
        if (sessions.length > 10000) sessions = sessions.slice(-10000);
      }

      /* Agregar eventos a contadores */
      for (const ev of events) {
        const key = ev.l ? `${ev.c}:${ev.a}:${ev.l}` : `${ev.c}:${ev.a}`;
        counters[key] = (counters[key] || 0) + 1;
      }

      /* Escribir de vuelta a KV */
      await env.ANALYTICS.put(dayKey, JSON.stringify(counters), { expirationTtl: 90 * 86400 });
      await env.ANALYTICS.put(sessKey, JSON.stringify(sessions), { expirationTtl: 2 * 86400 });

      return new Response('OK', { headers: CORS_HEADERS });
    } catch (e) {
      return new Response('Error: ' + e.message, { status: 500, headers: CORS_HEADERS });
    }
  },

  /* ── Cron handler: agrega datos y commitea al repo ── */
  async scheduled(event, env) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dayKey = `day:${yesterday}`;
    const sessKey = `sessions:${yesterday}`;

    const counters = await env.ANALYTICS.get(dayKey, 'json');
    const sessions = await env.ANALYTICS.get(sessKey, 'json');
    if (!counters) return; /* Nada que commitear */

    /* Construir resumen del día */
    const summary = {
      date: yesterday,
      unique_sessions: sessions ? sessions.length : 0,
      events: counters,
    };

    /* Leer archivo existente del repo (si existe) */
    const repo = env.GITHUB_REPO;
    const token = env.GITHUB_TOKEN;
    const filePath = 'analytics/data.json';
    const apiBase = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'trackr-analytics-worker',
    };

    let existing = [];
    let sha = null;

    try {
      const res = await fetch(apiBase, { headers });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
        existing = JSON.parse(atob(data.content));
      }
    } catch { /* archivo no existe aún, está OK */ }

    /* Añadir resumen del día */
    existing.push(summary);

    /* Mantener solo los últimos 90 días */
    if (existing.length > 90) {
      existing = existing.slice(-90);
    }

    /* Commitear al repo */
    const body = {
      message: `analytics: ${yesterday}`,
      content: btoa(JSON.stringify(existing, null, 2)),
      ...(sha ? { sha } : {}),
    };

    await fetch(apiBase, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
};
