/* Temporizador: de la hora de inicio y la de fin a la entrada de horas (B.timerEntry).
 * Ejecutar: node test/temporizador.mjs (y con TZ=America/Los_Angeles o TZ=Pacific/Kiritimati) */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const ctx = { console, navigator: { language: 'es' }, window: { addEventListener() {} }, document: undefined, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
vm.createContext(ctx);
for (const f of ['utils.js', 'billing.js']) vm.runInContext(readFileSync(new URL('../js/' + f, import.meta.url), 'utf8'), ctx);
const B = vm.runInContext('B', ctx);
const min = 60000, h = 60 * min;
const ini = new Date(2026, 10, 20, 9, 5, 30).getTime(); /* 20 de noviembre de 2026, 09:05:30, hora local */

assert.equal(B.timerEntry(ini, ini + 59000), null, 'menos de un minuto no apunta nada');
assert.equal(B.timerEntry(ini, ini - 5000), null, 'un reloj que va hacia atrás, tampoco');
assert.equal(B.timerEntry(0, ini), null); assert.equal(B.timerEntry(undefined, ini), null);
const e = B.timerEntry(ini, ini + 90 * min);
assert.equal(e.cantidad, 1.5); assert.equal(e.fecha, '2026-11-20'); assert.equal(e.horaInicio, '09:05');
assert.equal(B.timerEntry(ini, ini + min).cantidad, 0.02, 'un minuto = 0,02 h');
assert.equal(B.timerEntry(ini, ini + 25 * min).cantidad, 0.42);
assert.equal(B.timerEntry(ini, ini + 2 * h + 20 * min).cantidad, 2.33);
/* Empieza a las 23:30 y acaba al día siguiente: una sola entrada, en el día en que empezó */
const noche = new Date(2026, 11, 31, 23, 30, 0).getTime();
const n = B.timerEntry(noche, noche + 3 * h);
assert.equal(n.fecha, '2026-12-31'); assert.equal(n.horaInicio, '23:30'); assert.equal(n.cantidad, 3);
/* Lo que guarda el temporizador es la hora de inicio: tras recargar da lo mismo */
assert.equal(JSON.stringify(B.timerEntry(JSON.parse(JSON.stringify({ inicio: ini })).inicio, ini + h)), JSON.stringify(B.timerEntry(ini, ini + h)));
console.log('temporizador: ok');
