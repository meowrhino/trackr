# 22 — Beta gestoría con Diega: guion del test

## Estado: 📋 listo — todo desplegado en producción (2026-07-17); quedada prevista 19 jul

## Antes del test (manu)

1. ~~Backend y frontend~~ ✅ ya desplegados (migraciones aplicadas, worker y Pages al día).
2. Los signups siguen cerrados (`SIGNUPS_OPEN=false`): para que Diega pueda crear cuenta,
   o bien poner `SIGNUPS_OPEN=true` temporalmente y redeployar, o crearla juntos y activarla
   tú desde el panel admin en el momento.

## El test (manu + Diega, ~15 min, cada uno en su navegador)

**Diega:**
1. Entra en trackr.meowrhino.studio → Iniciar sesión → **Crear cuenta**.
2. Elige **Gestoría** en "Tipo de cuenta", su email normal, contraseña de 12+.
3. Guarda el **código de recuperación** que le sale (es irrecuperable).
4. Espera a que manu la active; entonces cierra y vuelve a **iniciar sesión**.
5. En **Configuración → Cartera de gestoría** verá su código `TRK-G-XXXXXXXXXX`.
   Se lo pasa a manu por donde sea (no es secreto, pero identifica su cuenta).

**Manu:**
6. Activa la cuenta de Diega: Configuración → Usuarios (admin) → ○ → ✓.
7. Con su sesión de persona: **Configuración → Mi gestoría** → pega el código → Vincular.
8. Comprueba que el email y la **huella de clave** del modal coinciden con los que
   Diega ve en su Cartera (así se detectaría un código suplantado) → elige alcance
   (**Solo lo fiscal** recomendado para el test) → Compartir.

**Diega:**
9. Configuración → Cartera → **Refrescar** → aparece manu → **Ver datos**.
10. Banner naranja arriba: está viendo los datos de manu en solo-lectura.
    Que curiosee: Dineros, facturas, el resumen fiscal (130/303). Las horas no
    van incluidas en el alcance fiscal.
11. **← Volver a mis datos** para salir.

**Los dos, para cerrar el test:**
12. Manu revoca desde Mi gestoría → Diega refresca su cartera → manu desaparece
    y ya no puede abrir sus datos. Re-vincular vuelve a funcionar.

## Qué preguntarle a Diega después (para el roadmap)

- ¿Le sirve lo que ve o necesita más/menos? (alcance fiscal vs todo)
- ¿Qué haría con esos datos que hoy no puede? (→ Etapa B: edición por operaciones)
- ¿Está dada de alta como **colaboradora social** de la AEAT y con qué alcance?
  (→ vía de remisión VeriFactu para sus clientes, TODO/15)
- ¿Lo usaría con sus clientes reales? ¿Cobrando ella, gratis, o pagando a TRACKR?

## Notas técnicas

- Su cuenta gestora está **vacía** a propósito (no arrastra datos del navegador).
- Si quiere además llevar su propia actividad: segunda cuenta persona con otro
  email o alias (`suemail+trackr@gmail.com`).
- La compartición es E2E: el servidor solo ve blobs cifrados hacia su clave.
  Si Diega pierde su contraseña Y su código de recuperación, pierde el acceso a
  su clave de gestoría → los clientes tendrían que re-vincular (los datos de
  ellos no corren peligro: los suyos propios viven en sus navegadores).
