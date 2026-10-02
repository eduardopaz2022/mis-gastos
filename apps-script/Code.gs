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
const COLUMNAS = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Monto', 'Nota', 'Método', 'Fijo', 'Registrado'];

function doGet(e) {
  const p = e.parameter || {};
  if (String(p.pin) !== PIN) return json_({ ok: false, error: 'pin' });
  if (p.action === 'ping') return json_({ ok: true });
  if (p.action === 'list') return json_({ ok: true, items: listar_(p.desde, p.hasta) });
  return json_({ ok: false, error: 'accion' });
}

function doPost(e) {
  let b;
  try {
    b = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'json' });
  }
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
    h.appendRow([
      it.id,
      it.fecha,
      it.tipo,
      it.categoria,
      Number(it.monto),
      it.nota || '',
      it.metodo || '',
      it.fijo || '',
      new Date(),
    ]);
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
        monto: Number(f[4]),
        nota: f[5],
        metodo: f[6],
        fijo: f[7],
      };
    })
    .filter(function (it) {
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

function fecha_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
