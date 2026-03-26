/* ================================================
 * TRACKR — Colores W3C
 * Tabla de colores nombrados, lookup y conversión
 * Globales: W3C_COLORS, COLOR_MAP, colorHex()
 * Dependencias: ninguna
 * ================================================ */

const W3C_COLORS = {
  'Rojos': [
    ['LightCoral','#F08080'],['Salmon','#FA8072'],['IndianRed','#CD5C5C'],['Red','#FF0000'],
    ['Crimson','#DC143C'],['FireBrick','#B22222'],['Brown','#A52A2A'],['DarkRed','#8B0000'],['Maroon','#800000']
  ],
  'Naranjas': [
    ['LightSalmon','#FFA07A'],['DarkSalmon','#E9967A'],['Orange','#FFA500'],['DarkOrange','#FF8C00'],
    ['Coral','#FF7F50'],['Tomato','#FF6347'],['OrangeRed','#FF4500']
  ],
  'Marrones': [
    ['SandyBrown','#F4A460'],['Goldenrod','#DAA520'],['Peru','#CD853F'],['DarkGoldenrod','#B8860B'],
    ['Chocolate','#D2691E'],['Sienna','#A0522D'],['SaddleBrown','#8B4513']
  ],
  'Amarillos': [
    ['Khaki','#F0E68C'],['Yellow','#FFFF00'],['Gold','#FFD700'],['DarkKhaki','#BDB76B'],['Olive','#808000']
  ],
  'Verdes': [
    ['PaleGreen','#98FB98'],['LightGreen','#90EE90'],['SpringGreen','#00FF7F'],['Lime','#00FF00'],
    ['LimeGreen','#32CD32'],['MediumSeaGreen','#3CB371'],['SeaGreen','#2E8B57'],
    ['ForestGreen','#228B22'],['Green','#008000'],['DarkGreen','#006400'],
    ['YellowGreen','#9ACD32'],['OliveDrab','#6B8E23']
  ],
  'Cianes': [
    ['Aquamarine','#7FFFD4'],['Cyan','#00FFFF'],['Turquoise','#40E0D0'],
    ['MediumTurquoise','#48D1CC'],['DarkTurquoise','#00CED1'],['LightSeaGreen','#20B2AA'],
    ['CadetBlue','#5F9EA0'],['DarkCyan','#008B8B'],['Teal','#008080']
  ],
  'Azules': [
    ['LightSkyBlue','#87CEFA'],['SkyBlue','#87CEEB'],['DeepSkyBlue','#00BFFF'],
    ['CornflowerBlue','#6495ED'],['DodgerBlue','#1E90FF'],['SteelBlue','#4682B4'],
    ['RoyalBlue','#4169E1'],['Blue','#0000FF'],['MediumBlue','#0000CD'],
    ['DarkBlue','#00008B'],['Navy','#000080'],['MidnightBlue','#191970']
  ],
  'Violetas': [
    ['Plum','#DDA0DD'],['Violet','#EE82EE'],['Orchid','#DA70D6'],['Magenta','#FF00FF'],
    ['MediumPurple','#9370DB'],['MediumOrchid','#BA55D3'],['SlateBlue','#6A5ACD'],
    ['BlueViolet','#8A2BE2'],['DarkViolet','#9400D3'],['DarkOrchid','#9932CC'],
    ['DarkMagenta','#8B008B'],['Purple','#800080'],['Indigo','#4B0082']
  ],
  'Rosas': [
    ['Pink','#FFC0CB'],['LightPink','#FFB6C1'],['HotPink','#FF69B4'],
    ['PaleVioletRed','#DB7093'],['DeepPink','#FF1493'],['MediumVioletRed','#C71585']
  ],
  'Grises': [
    ['Silver','#C0C0C0'],['DarkGray','#A9A9A9'],['Gray','#808080'],
    ['DimGray','#696969'],['SlateGray','#708090'],['DarkSlateGray','#2F4F4F']
  ]
};

/* Lookup plano: nombre → hex */
const COLOR_MAP = {};
Object.values(W3C_COLORS).forEach(arr => arr.forEach(([n,h]) => COLOR_MAP[n] = h));

/**
 * Convierte nombre de color a hex.
 * Devuelve gris por defecto si el nombre no es reconocido ni hex válido.
 */
function colorHex(name) {
  if (COLOR_MAP[name]) return COLOR_MAP[name];
  if (typeof name === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(name)) return name;
  return '#808080';
}

/**
 * Mezcla ponderada de colores en espacio OKLAB (perceptualmente uniforme).
 * @param {Array<{color:string, weight:number}>} entries — hex + peso
 * @returns {string} hex resultado
 */
function colorBlendOklab(entries) {
  if (!entries.length) return '#808080';
  if (entries.length === 1) return entries[0].color;
  const totalW = entries.reduce((s, e) => s + e.weight, 0);
  if (totalW === 0) return '#808080';

  /* hex → [r,g,b] 0-255 */
  const hexToRgb = h => {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  };
  const srgbToLin = c => { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
  const linToSrgb = c => Math.max(0, Math.min(255, Math.round((c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - .055) * 255)));

  const rgbToOk = (r,g,b) => {
    const lr = srgbToLin(r), lg = srgbToLin(g), lb = srgbToLin(b);
    const l = Math.cbrt(.4122214708*lr + .5363325363*lg + .0514459929*lb);
    const m = Math.cbrt(.2119034982*lr + .6806995451*lg + .1073969566*lb);
    const s = Math.cbrt(.0883024619*lr + .2817188376*lg + .6299787005*lb);
    return [.2104542553*l+.793617785*m-.0040720468*s, 1.9779984951*l-2.428592205*m+.4505937099*s, .0259040371*l+.7827717662*m-.808675766*s];
  };
  const okToRgb = (L,a,b) => {
    const l_ = L+.3963377774*a+.2158037573*b, m_ = L-.1055613458*a-.0638541728*b, s_ = L-.0894841775*a-1.291485548*b;
    const l = l_*l_*l_, m = m_*m_*m_, s = s_*s_*s_;
    return [linToSrgb(4.0767416621*l-3.3077115913*m+.2309699292*s),
            linToSrgb(-1.2684380046*l+2.6097574011*m-.3413193965*s),
            linToSrgb(-.0041960863*l-.7034186147*m+1.707614701*s)];
  };

  const labs = entries.map(e => ({ lab: rgbToOk(...hexToRgb(e.color)), w: e.weight / totalW }));
  const avg = [0,1,2].map(i => labs.reduce((s,c) => s + c.lab[i] * c.w, 0));
  const rgb = okToRgb(...avg);
  return '#' + rgb.map(v => v.toString(16).padStart(2,'0')).join('');
}
