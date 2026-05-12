# 17 — Cuentas + cloud (Pivot A)

## Estado: ⏳ pendiente · Q4 2026 / Q1 2027

### Contexto y filosofía

TRACKR es local-first y se mantiene gratis estructuralmente. Pero a partir de cierto número de usuarios beta activos, va a aparecer la pregunta legítima: *"¿cómo sincronizo entre dispositivos? ¿y si se me borra el navegador?"*.

La respuesta no puede ser "súbelo a la nube como Quipu/Holded" — eso traiciona el ADN. La respuesta es **Escenario A** de la investigación legal: backup cifrado client-side, donde el servidor solo guarda blobs cifrados que ni TRACKR puede leer.

### El modelo de Escenario A

1. El usuario crea una cuenta (email + contraseña).
2. Cuando guarda backup → en el navegador del usuario:
   - La contraseña deriva una clave (PBKDF2 / Argon2 + salt).
   - El JSON completo se cifra con AES-256-GCM.
   - El blob cifrado se sube al servidor.
3. El servidor recibe y guarda un blob al que **no tiene acceso semántico**.
4. Sin la clave del usuario, el contenido es ininteligible para TRACKR.
5. Si el usuario pierde la contraseña → no podemos recuperar el contenido. Esto se comunica claramente en la UI y en los Términos.

### Por qué Escenario A (no B, no C)

- **Coherencia con el posicionamiento**: el usuario sigue siendo soberano de sus datos, solo añade comodidad.
- **Riesgo legal mínimo**: el art. 34.3.a RGPD exime de notificar brechas a interesados si los datos están cifrados. Multa máxima real estimada en caso de incidente bien gestionado: 0-5.000 €.
- **Coste contenido**: 500-1.500 €/año (Cloud UE + asesoría legal mínima).
- **Migración limpia a B si tiene sentido**: si más adelante queremos analítica de producto (sin tocar contenido cifrado), se añade encima.

Descartados:
- **Escenario B (analítica del contenido)**: contamina el mensaje. Lo dejamos para 2027-Q3+ si tiene sentido.
- **Escenario C (datos agregados para insights / partnerships)**: destruye el ADN. Solo si TRACKR genera ingresos sustanciales y se replantea por completo.

### Stack técnico previsto

- **Cloud**: Cloud UE puro. Opciones evaluadas: **OVH España** (DPA bien, soporte ES) o **Scaleway** (París/Ámsterdam, certificado ISO 27001, mejor DX). Hetzner se descarta por subida de precios anunciada para abr 2026.
- **Backend**: un Worker en Cloudflare adicional o un Cloudflare R2 + funciones edge para el blob storage (el coste real será muy bajo, no hace falta servidor propio todavía).
- **Auth**: contraseña con bcrypt/Argon2 en backend. Email opcional (solo para recuperar acceso a la cuenta, no al contenido).
- **Frontend**: añadir un panel "Cuenta" en Configuración con:
  - Crear cuenta / iniciar sesión.
  - Sincronizar ahora.
  - Activar sincronización automática.
  - Cerrar sesión y dejar de sincronizar.
  - Borrar cuenta y blob completo.

### Pricing

- **Plan opcional**: ~3-5 €/mes (incluye sincronización entre dispositivos + backup automático). 
- **Plan gratis intacto**: el core sigue funcionando 100% sin cuenta. La suscripción **solo paga la infraestructura**, no desbloquea ninguna funcionalidad de producto.
- Mensaje en la landing: *"Si no guardas datos en nuestro servidor, no pagas. No es freemium: es pagar por infraestructura."*

### Coste esperado

- Cloud UE para el primer año (Scaleway / OVH Object Storage): 120-400 €/año (estimación según volumen).
- Asesoría legal puntual para textos (aviso, privacidad, cookies, T&C, DPA): 300-800 € puntual.
- CMP de cookies: no necesaria si solo hay cookies técnicas. 0 €.
- **Total Q4 2026 + Q1 2027**: 500-1.500 € de cumplimiento + tiempo de desarrollo.

### Textos legales mínimos

Cuando se haga el pivot:
1. **Aviso legal** (LSSI-CE art. 10).
2. **Política de privacidad** (RGPD art. 13).
3. **Política de cookies** (mínima si solo hay cookies técnicas).
4. **Condiciones generales** con cláusula de pérdida de clave: *"si pierdes tu contraseña, no podemos recuperar tu contenido"*.
5. **DPA incrustado** (art. 28 RGPD) si almacenamos datos personales de clientes finales del usuario.

Plantillas base: Facilita_RGPD de la AEPD + revisión por consultora puntual.

### Pasos

| Fase | Cuándo | Acción |
|---|---|---|
| Decisión | Sep-Oct 2026 | Confirmar que tiene sentido tras revisar tracción del plan de marketing v1 |
| Cloud setup | Nov 2026 | Crear cuenta Scaleway/OVH + DPA + bucket Object Storage |
| Backend | Nov-Dic 2026 | Worker / funciones edge para subir/bajar blobs cifrados |
| Frontend | Dic 2026 - Ene 2027 | Panel cuenta + cifrado client-side en JS |
| Textos legales | Ene 2027 | Redactar + revisar + publicar |
| Lanzamiento | Q1 2027 | Beta cerrada → beta abierta tras validación |

### Decisión de no-hacer

Si en septiembre 2026 **no hay 50+ usuarios beta activos**, posponer el Pivot A. El coste fijo anual no se justifica sin tracción mínima. La app sigue funcionando 100% sin cuenta — no es un bloqueo.
