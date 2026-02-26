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
