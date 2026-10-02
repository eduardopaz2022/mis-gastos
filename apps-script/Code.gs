/**
 * Mis Gastos: backend en Google Apps Script.
 * Guarda cada movimiento en la pestaña "Registro" de tu Hoja de Google.
 *
 * 1. Cambia el PIN de abajo por uno tuyo (4 a 8 números).
 * 2. Implementar > Nueva implementación > Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 3. Copia la URL que termina en /exec y pégala en la app (Ajustes).
 */
const PIN = '1234';
const HOJA = 'Registro';
const VERSION = '2';
const COLUMNAS = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Monto', 'Nota', 'Método', 'Fijo', 'Registrado'];

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (String(p.pin) !== PIN) return json_({ ok: false, error: 'pin' });
    if (p.action === 'ping') return json_({ ok: true, version: VERSION });
    if (p.action === 'list') return json_({ ok: true, items: listar_(p.desde, p.hasta) });
    if (p.action === 'diag') return json_(diag_());
    return json_({ ok: false, error: 'accion' });
  } catch (err) {
    return json_({ ok: false, error: 'script: ' + err.message });
  }
}

function doPost(e) {
  let b;
  try {
    b = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'json' });
  }
  try {
    return post_(b);
  } catch (err) {
    return json_({ ok: false, error: 'script: ' + err.message });
  }
}

function post_(b) {
  if (String(b.pin) !== PIN) return json_({ ok: false, error: 'pin' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (b.action === 'add') return json_({ ok: true, ids: agregar_(b.items || []) });
    if (b.action === 'delete') return json_({ ok: true, borrado: borrar_(b.id) });
    return json_({ ok: false, error: 'accion' });
  } finally {
    lock.releaseLock();
  }
}

function hoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(HOJA);
  if (!h) {
    h = libro.insertSheet(HOJA);
    h.appendRow(COLUMNAS);
    h.setFrozenRows(1);
    h.getRange('B:B').setNumberFormat('@');
    h.getRange('E:E').setNumberFormat('$#,##0.00');
  }
  return h;
}

function agregar_(items) {
  const h = hoja_();
  const existentes = new Set(h.getRange(1, 1, Math.max(h.getLastRow(), 1), 1).getValues().flat().map(String));
  const ids = [];
  items.forEach(function (it) {
    // Si el celular reintenta un envío, el ID evita duplicados.
    if (existentes.has(String(it.id))) {
      ids.push(it.id);
      return;
    }
    // La fecha se guarda como texto (2026-10-02) para que Sheets no la convierta.
    const fila = h.getLastRow() + 1;
    h.getRange(fila, 2).setNumberFormat('@');
    h.getRange(fila, 1, 1, COLUMNAS.length).setValues([[
      String(it.id),
      String(it.fecha),
      it.tipo,
      it.categoria,
      Number(it.monto),
      it.nota || '',
      it.metodo || '',
      it.fijo || '',
      new Date(),
    ]]);
    existentes.add(String(it.id));
    ids.push(it.id);
  });
  return ids;
}

function listar_(desde, hasta) {
  const h = hoja_();
  if (h.getLastRow() < 2) return [];
  const filas = h.getRange(2, 1, h.getLastRow() - 1, COLUMNAS.length).getValues();
  return filas
    .map(function (f) {
      return {
        id: String(f[0]),
        fecha: fecha_(f[1]),
        tipo: f[2],
        categoria: f[3],
        monto: monto_(f[4]),
        nota: f[5],
        metodo: f[6],
        fijo: f[7],
      };
    })
    .filter(function (it) {
      if (!it.id || !it.fecha) return false;
      return (!desde || it.fecha >= desde) && (!hasta || it.fecha <= hasta);
    });
}

function borrar_(id) {
  const h = hoja_();
  if (h.getLastRow() < 2) return false;
  const ids = h.getRange(2, 1, h.getLastRow() - 1, 1).getValues().flat().map(String);
  const i = ids.indexOf(String(id));
  if (i === -1) return false;
  h.deleteRow(i + 2);
  return true;
}

// Acepta la fecha como la haya guardado Sheets: fecha, número de serie o texto (2026-10-02 o 2/10/2026).
function fecha_(v) {
  const zona = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  if (v instanceof Date) return Utilities.formatDate(v, zona, 'yyyy-MM-dd');
  if (typeof v === 'number') return Utilities.formatDate(new Date(Math.round((v - 25569) * 86400000)), 'UTC', 'yyyy-MM-dd');
  const t = String(v).trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return t;
}

function monto_(v) {
  if (typeof v === 'number') return v;
  return Number(String(v).replace(/[$\s]/g, '').replace(',', '.')) || 0;
}

function diag_() {
  const h = hoja_();
  const n = Math.max(h.getLastRow() - 1, 0);
  const muestra = n ? h.getRange(2, 1, Math.min(n, 3), COLUMNAS.length).getValues().map(function (f) {
    return { id: f[0], fecha: String(f[1]) + ' [' + (f[1] instanceof Date ? 'fecha' : typeof f[1]) + ']', leida: fecha_(f[1]), monto: f[4] };
  }) : [];
  return { ok: true, version: VERSION, filas: n, zona: SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), muestra: muestra };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
