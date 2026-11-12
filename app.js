(() => {
'use strict';
const KEY = 'unubank_v2';
const H = {}; // delegated click handlers: selector -> fn(event, element)
const MON = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const at = (d, h, m) => new Date(2026, 10, d, h, m).getTime();

/* ---------- Data ---------- */
const defaults = () => ({
  v: 2,
  balance: 8450.5,
  txs: [
    { id: 1, title: 'Київське метро', cat: 'Міський транспорт', kind: 'metro', type: 'out', amount: 30, ts: at(10, 18, 8) },
    { id: 2, title: 'Київське метро', cat: 'Міський транспорт', kind: 'metro', type: 'out', amount: 30, ts: at(10, 17, 45) },
    { id: 3, title: 'Від: Аліна Вітер', cat: 'Перекази', kind: 'user', type: 'in', amount: 300, ts: at(10, 16, 20) },
    { id: 4, title: 'Київпастранс', cat: 'Міський транспорт', kind: 'transit', type: 'out', amount: 30, ts: at(10, 13, 31), sub: '👏 Підкинемо картці настрою?' },
    { id: 5, title: 'Від: Nikita', cat: 'Перекази', kind: 'user', type: 'in', amount: 655, ts: at(10, 11, 2) },
    { id: 6, title: 'Київське метро', cat: 'Міський транспорт', kind: 'metro', type: 'out', amount: 30, ts: at(10, 9, 15) },
    { id: 7, title: 'Glovo', cat: 'Доставка їжі', kind: 'glovo', type: 'out', amount: 963.99, ts: at(9, 20, 47), sub: '👏 Додамо сил картці?' },
  ],
});
let S = load();
function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.txs && d.v === 2 && typeof d.balance === 'number') return d; } catch (e) {} return defaults(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- Helpers ---------- */
const group = n => String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
const money = n => `${n < 0 ? '-' : ''}${group(Math.abs(n))}.${Math.abs(n).toFixed(2).split('.')[1]} ₴`;
const sorted = () => [...S.txs].sort((a, b) => b.ts - a.ts);
const signed = t => (t.type === 'in' ? 1 : -1) * t.amount;
const dayLabel = ts => { const d = new Date(ts); return `${d.getDate()} ${MON[d.getMonth()]}` + (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : ''); };
const fullDate = ts => { const d = new Date(ts); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

const USER_SVG = '<svg viewBox="0 0 24 24" width="62%" height="62%"><circle cx="12" cy="9" r="4.2" fill="#8b8f99"/><path d="M3.500 22c0-5 4-8 8.500-8s8.500 3 8.500 8z" fill="#8b8f99"/></svg>';
function avatar(kind, title, cls = '') {
  const inner = {
    metro: '<svg viewBox="0 0 24 24" width="62%" height="62%"><path fill="#1fb34d" d="M2 20L7 5h2.500L12 12l2.500-7H17l5 15h-4l-2-8-4 8-4-8-2 8z"/></svg>',
    transit: 'КИЇВ<br>ПАСТРАНС',
    glovo: '<svg viewBox="0 0 24 24" width="62%" height="62%"><path fill="#0f6a50" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="3" fill="#cfa92a"/></svg>',
    user: USER_SVG,
    dl: '<svg viewBox="0 0 24 24" width="55%" height="55%"><path d="M12 4v10m0 0l-4-4m4 4l4-4M5 15v4h14v-4" stroke="#ddd" stroke-width="1.800" fill="none"/></svg>',
    shop: esc((title || '?').replace(/^Від:\s*/, '').charAt(0).toUpperCase()),
  }[kind] || USER_SVG;
  return `<div class="av ${kind} ${cls}">${inner}</div>`;
}
function txRow(t) {
  return `<button class="tx" data-id="${t.id}">${avatar(t.kind, t.title)}<div class="t">${esc(t.title)}${t.sub ? `<small>${esc(t.sub)}</small>` : ''}</div><div class="a ${t.type}">${t.type === 'in' ? '+' : '-'}${money(t.amount)}</div></button>`;
}

/* ---------- Navigation ---------- */
const TABS = ['s-home', 's-credit', 's-save', 's-market', 's-more'];
function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  $('.tabbar').classList.toggle('hide', !TABS.includes(id));
  $$('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
}

/* ---------- Render ---------- */
function render() {
  $('#home-balance').textContent = money(S.balance);
  $('#hist-balance').textContent = money(S.balance);
  const list = sorted();
  $('#home-list').innerHTML = list.slice(0, 3).map(txRow).join('');
  let html = '', last = '';
  list.forEach(t => { const d = dayLabel(t.ts); if (d !== last) { html += `<div class="day">${d}</div>`; last = d; } html += txRow(t); });
  $('#hist-list').innerHTML = html;
}
document.addEventListener('click', e => {
  const tx = e.target.closest('.tx'); if (tx) openReceipt(+tx.dataset.id);
  const ts = e.target.closest('[data-toast]'); if (ts) toast(ts.dataset.toast);
});

/* ---------- Home / History ---------- */
H['#btn-all'] = () => { show('s-hist'); $('#hist-scroll').scrollTop = 0; };
H['#hist-close'] = () => show('s-home');
H['#btn-reset'] = () => { if (confirm('Скинути баланс і транзакції до демо-стану?')) { S = defaults(); save(); render(); show('s-home'); toast('Демо-дані скинуто'); } };

/* ---------- Receipt ---------- */
let recFrom = 's-hist';
function openReceipt(id) {
  const t = S.txs.find(x => x.id === id); if (!t) return;
  recFrom = $('#s-hist').classList.contains('active') ? 's-hist' : 's-home';
  const after = S.balance - S.txs.filter(x => x.ts > t.ts).reduce((a, x) => a + signed(x), 0);
  const isTr = t.cat === 'Міський транспорт', isFood = t.cat === 'Доставка їжі';
  const color = isTr ? '#f59f00' : isFood ? '#d9b52f' : t.cat === 'Перекази' ? '#3b4a86' : '#6b7280';
  const pillTxt = isTr || isFood ? '#1b1b1b' : '#fff';
  const [whole, cents] = Math.abs(t.amount).toFixed(2).split('.');
  const data = [220, 250, 450, 330, 450, 250], mx = 450, sum = data.reduce((a, b) => a + b, 0);
  const bars = data.map(v => `<div class="bar" style="height:${v / mx * 100}%;${isTr ? '' : `background:linear-gradient(${color},${color}aa)`}"></div>`).join('');
  const mons = ['чер', 'лип', 'сер', 'вер', 'жов', 'лис'].map(m => `<span>${m}</span>`).join('');
  $('#rec').innerHTML = `
    <div class="banner" style="background-color:${color}">
      <button class="icon-btn" id="rec-back">←</button>
      <button class="icon-btn" id="rec-star">☆</button>
      ${avatar(t.kind, t.title)}
    </div>
    <div class="r-card">
      <h2>${esc(t.title)}</h2>
      <div class="cat-line"><span class="cat" style="background:${color};color:${pillTxt}">${esc(t.cat)}</span></div>
      <div class="r-date">${fullDate(t.ts)}</div>
      <div class="r-amt" style="color:${t.type === 'in' ? 'var(--green)' : 'var(--txt)'}">${t.type === 'in' ? '+' : '-'}${group(+whole)}<small>.${cents} ₴</small></div>
    </div>
    <div class="r-body">
      <div class="info"><div class="row2">▤ Опис та #теги</div><hr><div class="row2">⇪ Завантажити файл</div></div>
      <div class="info line"><span class="dot" style="background:${color}">▣</span><div>Залишок<b>${money(after)}</b></div></div>
      <div class="info line"><span class="vis">VISA</span><div>${t.type === 'in' ? 'Зарахування на картку' : 'Оплата через Apple Pay'}<b>${t.type === 'in' ? 'monobank •• 3415' : 'iPhone (Nikita)'}</b></div></div>
      <div class="half-pill">Витратили ${group(sum)} ₴ за півроку</div>
      <div class="chart-wrap"><div class="chart"><div class="axis"><span>450 ₴</span><span>225 ₴</span><span>0 ₴</span></div><div class="bars">${bars}</div></div><div class="labels">${mons}</div></div>
    </div>`;
  $('#rec-back').onclick = () => show(recFrom);
  $('#rec-star').onclick = e => { const b = e.currentTarget; b.classList.toggle('on'); b.textContent = b.classList.contains('on') ? '★' : '☆'; };
  $('#rec').scrollTop = 0;
  show('s-rec');
}

/* ---------- Create transaction ---------- */
const TPL = {
  transit: { title: 'Київпастранс', cat: 'Міський транспорт', kind: 'transit', type: 'out', amount: '30.00' },
  metro: { title: 'Київське метро', cat: 'Міський транспорт', kind: 'metro', type: 'out', amount: '30.00' },
  nikita: { title: 'Від: Nikita', cat: 'Перекази', kind: 'user', type: 'in', amount: '450.00' },
  custom: { title: '', cat: 'Інше', kind: 'shop', type: 'out', amount: '' },
};
let curTpl = 'transit', curType = 'out';
const toLocalInput = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
function applyTpl(k) {
  curTpl = k; const t = TPL[k];
  $$('#chips button').forEach(b => b.classList.toggle('on', b.dataset.t === k));
  $('#m-title').value = t.title; $('#m-amt').value = t.amount; setType(t.type);
  $('#m-title').placeholder = k === 'custom' ? 'Назва мерчанта або ім’я' : '';
}
function setType(v) { curType = v; $$('#m-type button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
H['#btn-create'] = () => { $('#m-dt').value = toLocalInput(Date.now()); applyTpl('transit'); $('#modal').classList.remove('hide'); };
H['#chips'] = e => { const b = e.target.closest('button'); if (b) applyTpl(b.dataset.t); };
H['#m-type'] = e => { const b = e.target.closest('button'); if (b) setType(b.dataset.v); };
H['#m-cancel'] = () => $('#modal').classList.add('hide');
H['#modal'] = e => { if (e.target.id === 'modal') $('#modal').classList.add('hide'); };
H['#m-save'] = () => {
  const amt = Math.round(parseFloat(($('#m-amt').value || '').replace(',', '.')) * 100) / 100;
  const ts = new Date($('#m-dt').value).getTime();
  let title = $('#m-title').value.trim();
  if (!title) return toast('Введіть назву');
  if (!(amt > 0)) return toast('Введіть суму більше 0');
  if (isNaN(ts)) return toast('Вкажіть дату і час');
  const base = TPL[curTpl];
  const kind = base.kind === 'user' && curTpl === 'custom' ? 'shop' : base.kind;
  if (curTpl === 'nikita' && curType === 'out') title = title.replace(/^Від:\s*/, '');
  S.txs.push({ id: Date.now(), title, cat: base.cat, kind: curType === 'in' && curTpl === 'custom' ? 'user' : kind, type: curType, amount: amt, ts });
  S.balance = Math.round((S.balance + (curType === 'in' ? amt : -amt)) * 100) / 100;
  save(); render(); $('#modal').classList.add('hide'); toast('Транзакцію додано');
};

/* ---------- Transfer: lookup ---------- */
const NAMES = ['Андрій К.', 'Олена М.', 'Максим Т.', 'Софія Л.', 'Дмитро Б.'];
let rcp = null;
const subAv = (kind, name, big) => `<div class="avw">${avatar(kind, name)}<span class="ub">u</span></div>`;
function lookup(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 16);
  $('#card-in').value = d.replace(/(.{4})/g, '$1 ').trim();
  $('#card-clear').classList.toggle('hide', !d);
  const found = d.length === 16;
  $('#found').classList.toggle('hide', !found);
  $('#tr-empty').classList.toggle('hide', !!d);
  if (found) {
    const name = d === '4441114404112755' ? 'Андрій В.' : 'Nikita K.';
    rcp = { name, card: d };
    $('#found-row').innerHTML = `${subAv('user', name)}<span>${esc(name)}</span>`;
  } else rcp = null;
}
H['#q-transfer'] = () => { lookup(''); show('s-tr1'); };
H['#tr1-back'] = () => show('s-home');
$('#card-in').oninput = e => lookup(e.target.value);
H['#card-clear'] = () => { lookup(''); $('#card-in').focus(); };
H['#demo-card'] = () => lookup('4441114404114215');

/* ---------- Transfer: amount ---------- */
let expr = '';
const evalExpr = () => {
  let s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/[+\-*/.]+$/, '');
  if (!s || !/^[0-9+\-*/.]+$/.test(s)) return 0;
  try { const v = Function('"use strict";return (' + s + ')')(); return isFinite(v) ? Math.round(v * 100) / 100 : 0; } catch (e) { return 0; }
};
function drawAmount() {
  $('#tr2-amount').textContent = (expr ? expr.replace(/\./g, ',') : '0') + ' ₴';
  const a = evalExpr(); $('#btn-send').classList.toggle('on', a > 0);
}
H['#found-row'] = () => {
  if (!rcp) return;
  expr = ''; $('#tr2-comment').value = '';
  $('#tr2-av').innerHTML = subAv('user', rcp.name);
  $('#tr2-name').textContent = rcp.name;
  $('#tr2-bal').textContent = '▣ ' + money(S.balance) + ' ⌄';
  drawAmount(); show('s-tr2');
};
H['#tr2-back'] = () => show('s-tr1');
function press(k) {
  const last = expr.slice(-1), isOp = c => '×÷+−'.includes(c) && c;
  if (/\d/.test(k)) expr = expr === '0' ? k : expr + k;
  else if (k === ',') { const n = expr.split(/[×÷+−]/).pop(); if (!n.includes('.')) expr += n === '' ? '0.' : '.'; }
  else if ('×÷+−'.includes(k)) { if (!expr) return; expr = isOp(last) ? expr.slice(0, -1) + k : expr + k; }
  else if (k === '%') { const m = expr.match(/(\d+\.?\d*)$/); if (m) expr = expr.slice(0, m.index) + String(+(m[1] / 100).toFixed(4)); }
  else if (k === '=') { const v = evalExpr(); expr = v ? String(v) : ''; }
  else if (k === '⌫') expr = expr.slice(0, -1);
  if (expr.length > 18) expr = expr.slice(0, 18);
  drawAmount();
}
H['[data-k]'] = (e, el) => press(el.dataset.k);
H['#btn-send'] = () => {
  const a = evalExpr();
  if (!(a > 0)) return;
  if (a > S.balance) return toast('Недостатньо коштів на картці');
  S.txs.push({ id: Date.now(), title: rcp.name, cat: 'Перекази', kind: 'user', type: 'out', amount: a, ts: Date.now(), sub: $('#tr2-comment').value.trim() });
  S.balance = Math.round((S.balance - a) * 100) / 100;
  save(); render(); show('s-home'); $('.home-scroll').scrollTop = 0;
  toast(`Надіслано ${money(a)} → ${rcp.name}`);
};

H['#demo-card2'] = () => lookup('4441114404112755');
H['[data-tab]'] = (e, el) => show(el.dataset.tab);

/* ---------- Full-screen mode ---------- */
const standalone = () => !!navigator.standalone || matchMedia('(display-mode: standalone)').matches;
function fsState() {
  const fs = !!document.fullscreenElement;
  $('#btn-fs').textContent = fs ? 'Вийти з повноекранного режиму' : 'Повноекранний режим';
  $('#fs-state').textContent = standalone() ? 'Застосунок запущено на весь екран.' : fs ? 'Повноекранний режим увімкнено.' : 'Вимкнено. На iPhone Safari цей режим недоступний — скористайтеся підказкою нижче.';
}
H['#btn-fs'] = async () => {
  const el = document.documentElement;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else toast('Тут повноекранний режим недоступний: Поділитися → На екран «Домой»');
  } catch (e) { toast('Не вдалося увімкнути: Поділитися → На екран «Домой»'); }
  $('#ios-tip').classList.add('flash'); fsState();
};
document.addEventListener('fullscreenchange', fsState);

/* ---------- Event delegation ---------- */
document.addEventListener('click', e => { for (const sel in H) { const el = e.target.closest(sel); if (el) H[sel](e, el); } });

fsState();
render();
})();
