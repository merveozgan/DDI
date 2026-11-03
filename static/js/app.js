// MOCK = true: sahte veriyle çalışır. Gerçek API hazır olunca false yapın (bkz. API_SPEC.md).
(() => {
const MOCK = true, P = document.body.dataset.page;
const D = [
 ['DB00515','Cisplatin','Platin bazlı antineoplastik','Kemoterapi'],
 ['DB00958','Carboplatin','Platin bazlı antineoplastik','Kemoterapi'],
 ['DB00531','Cyclophosphamide','Alkilleyici ajan','Kemoterapi'],
 ['DB00997','Doxorubicin','Antrasiklin','Kemoterapi'],
 ['DB01229','Paclitaxel','Taksan','Kemoterapi'],
 ['DB01248','Docetaxel','Taksan','Kemoterapi'],
 ['DB00563','Methotrexate','Antimetabolit','Kemoterapi'],
 ['DB00544','Fluorouracil','Antimetabolit','Kemoterapi'],
 ['DB00441','Gemcitabine','Antimetabolit','Kemoterapi'],
 ['DB00904','Ondansetron','5-HT3 reseptör antagonisti','Bulantı ve kusmanın önlenmesi (destekleyici)']
].map(([id,n,c,u]) => ({id,n,c,u}));
const NM = {}; D.forEach(d => NM[d.id] = d.n);
const nm = id => NM[id] || id;
const $ = s => document.querySelector(s);
const E = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const J = (st, k, d) => { try { return JSON.parse(st.getItem(k)) || d; } catch { return d; } };
const sel = () => J(sessionStorage, 'sel', []);
const setSel = v => { sessionStorage.setItem('sel', JSON.stringify(v)); if (window.onSel) onSel(); };
const RK = {high:['YÜKSEK RİSK','h'], medium:['ORTA RİSK','m'], low:['DÜŞÜK RİSK','l'], unknown:['SONUÇ YOK','u']};
const ORD = {high:0, medium:1, low:2, unknown:3};
const badge = l => `<span class="rk ${RK[l][1]}">${RK[l][0]}</span>`;
const EM = {ANALYSIS_FAILED:'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.', MODEL_UNAVAILABLE:'Model şu anda hazır değil. Biraz sonra tekrar deneyin.', UNKNOWN_DRUG:'Seçilen ilaçlardan biri veri tabanında bulunamadı.'};

function add(id, n) {
  const s = sel();
  if (s.some(x => x.id == id)) return 'Bu ilaç zaten seçili.';
  if (s.length >= 10) return 'En fazla 10 ilaç seçilebilir.';
  s.push({id, n}); setSel(s); return n + ' analize eklendi.';
}
async function drugs(q) {
  if (MOCK) return D.filter(d => (d.n + d.id).toLowerCase().includes(q.toLowerCase()));
  const r = await fetch('/api/drugs/?q=' + encodeURIComponent(q));
  return (await r.json()).results.map(x => ({id:x.drug_id, n:x.name}));
}
function mock(ids) {
  const pairs = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j], h = [...a + b].reduce((x, c) => x + c.charCodeAt(0), 0), nd = h % 7 == 0;
    const ex = nd || h % 5 == 0 ? [] : [{path:[{id:a,type:'drug',name:nm(a)},{id:'ORNEK',type:'target',name:'Örnek hedef'},{id:b,type:'drug',name:nm(b)}], relations:['temsili','temsili'], source:'Örnek veri'}];
    pairs.push({drug_a:a, drug_b:b, status:nd?'no_data':'ok', probability:nd?null:+(0.55 + (h % 40) / 100).toFixed(2),
      risk_level:nd?'unknown':['high','medium','low'][h % 3], explanation:ex, explanation_status:ex.length?'found':'not_found'});
  }
  return {api_version:'v0.1', model_version:'mock', graph_version:'mock', note:'Sonuçlar ikili etkileşimlerden türetilmiştir; üç veya daha fazla ilacın ortak etkisini modellemez.', pairs};
}
async function predict(ids, sig) {
  if (!MOCK) {
    const r = await fetch('/api/predict/', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({drugs:ids}), signal:sig});
    const j = await r.json(); if (!r.ok) throw j.error || {code:'ANALYSIS_FAILED'}; return j;
  }
  await new Promise((ok, no) => { const t = setTimeout(ok, 1500); sig.addEventListener('abort', () => { clearTimeout(t); no(new DOMException('', 'AbortError')); }); });
  if (new URLSearchParams(location.search).get('mock') == 'error') throw {code:'ANALYSIS_FAILED'};
  return mock(ids);
}
const card = p => { const e = p.explanation[0]; return `<article class="cd"><div class="rw"><h3>${E(nm(p.drug_a))} + ${E(nm(p.drug_b))}</h3>${badge(p.risk_level)}</div>` +
  (p.status == 'ok' ? `<p>Tahmin skoru: %${Math.round(p.probability * 100)} <span class="nt">(model skoru; klinik risk olasılığı değildir)</span></p>` +
    (e ? `<p><b>Olası biyolojik bağlantı:</b> ${e.path.map(n => E(n.name)).join(' → ')}</p><span class="nt">Kaynak: ${E(e.source)}</span>` : '<p class="nt">Bu çift için açıklama bulunamadı.</p>')
    : '<p>Bu çift için yeterli veri bulunamadı. Bu, düşük risk anlamına gelmez.</p>') + '</article>'; };
const top = r => r.pairs.map(p => p.risk_level).sort((a, b) => ORD[a] - ORD[b])[0] || 'unknown';
const when = r => new Date(r.t).toLocaleString('tr-TR');
const names = r => [...new Set(r.pairs.flatMap(p => [p.drug_a, p.drug_b]))].map(i => E((r.names || NM)[i] || i)).join(', ');

function nav() {
  document.querySelectorAll('.hd nav a').forEach(a => {
    if (a.pathname == location.pathname || (a.pathname != '/' && location.pathname.startsWith(a.pathname))) a.setAttribute('aria-current', 'page');
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const m = add(b.dataset.add, b.dataset.n || nm(b.dataset.add)), o = $('#msg'); if (o) o.textContent = m;
});

const pages = {
  home() {
    const h = J(localStorage, 'hist', []).slice(0, 3);
    $('#recent').innerHTML = h.map(r => `<div class="cd"><div class="rw"><b>${when(r)}</b>${badge(top(r))}</div><p>${names(r)}</p></div>`).join('')
      || '<div class="cd"><p>Henüz analiz yapılmadı.</p></div>';
  },
  drugs() {
    const q = $('#q'), draw = () => {
      const v = q.value.trim().toLowerCase(), r = D.filter(d => (d.n + d.id).toLowerCase().includes(v));
      $('#n').textContent = r.length + ' ilaç bulundu';
      $('#list').innerHTML = r.map(d => `<article class="cd"><h3>${d.n}</h3><p class="nt">Etken madde: ${d.n} · ${d.id}</p><p>${d.c}</p><div class="rw"><a class="bt b2" href="/ilaclar/${d.id}/">Detay</a><button class="bt" data-add="${d.id}" data-n="${d.n}">Analize ekle</button></div></article>`).join('')
        || '<p>Aramanızla eşleşen ilaç bulunamadı.</p>';
    };
    q.oninput = draw; draw();
  },
  detail() {
    const d = D.find(x => x.id == document.body.dataset.drug);
    $('#out').innerHTML = d ? `<h1>${d.n}</h1><dl class="kv"><dt>Etken madde</dt><dd>${d.n}</dd><dt>İlaç sınıfı</dt><dd>${d.c}</dd><dt>Kullanım alanı</dt><dd>${d.u}</dd><dt>DrugBank kimliği</dt><dd>${d.id}</dd></dl><p class="nt">Kaynak: örnek veri (gerçek bilgiler veri tablosundan gelecek).</p><div class="rw"><button class="bt" data-add="${d.id}" data-n="${d.n}">İlacı analize ekle</button><a class="bt b2" href="/analiz/">Analize git</a></div>`
      : '<h2>İlaç bulunamadı</h2><p>Bu kimliğe sahip bir ilaç yok.</p>';
  },
  analysis() {
    const q = $('#q'), sg = $('#sg'), go = $('#go'); let ctl;
    const show = k => { $('#fm').hidden = k != 'fm'; $('#ld').hidden = k != 'ld'; $('#er').hidden = k != 'er'; };
    window.onSel = () => {
      const s = sel(), n = s.length;
      $('#sel').innerHTML = s.map(x => `<li class="ch">${E(x.n)} <button class="x" data-rm="${x.id}" aria-label="${E(x.n)} ilacını kaldır">Kaldır</button></li>`).join('') || '<li class="nt">Henüz ilaç seçilmedi.</li>';
      $('#cnt').textContent = `Seçilen ilaçlar (${n}/10)`;
      $('#hint').textContent = n < 2 ? 'Analiz için en az 2 ilaç seçin.' : `${n} ilaç seçildi: ${n * (n - 1) / 2} çift analiz edilecek.`;
      go.disabled = n < 2;
    };
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-rm]'); if (b) setSel(sel().filter(x => x.id != b.dataset.rm));
      if (e.target.closest('[data-add]')) { q.value = ''; sg.innerHTML = ''; }
    });
    q.oninput = async () => {
      const v = q.value.trim(); if (v.length < 2) { sg.innerHTML = ''; return; }
      const s = sel(), r = (await drugs(v)).filter(d => !s.some(x => x.id == d.id)).slice(0, 6);
      sg.innerHTML = r.map(d => `<li><button type="button" class="sgb" data-add="${d.id}" data-n="${E(d.n)}">${E(d.n)} <span class="nt">(${d.id})</span></button></li>`).join('') || '<li class="nt">İlaç bulunamadı.</li>';
    };
    $('#clr').onclick = () => setSel([]);
    $('#cn').onclick = () => ctl && ctl.abort();
    $('#rt').onclick = () => { show('fm'); go.click(); };
    go.onclick = async () => {
      const s = sel(); ctl = new AbortController(); show('ld'); $('#slow').hidden = true;
      const t = setTimeout(() => $('#slow').hidden = false, 5000);
      try {
        const r = await predict(s.map(x => x.id), ctl.signal);
        r.names = Object.fromEntries(s.map(x => [x.id, x.n])); r.t = Date.now();
        sessionStorage.setItem('last', JSON.stringify(r));
        localStorage.setItem('hist', JSON.stringify([r, ...J(localStorage, 'hist', [])].slice(0, 30)));
        location.href = '/sonuclar/';
      } catch (err) {
        if (err.name == 'AbortError') show('fm');
        else { $('#errm').textContent = EM[err.code] || EM.ANALYSIS_FAILED; show('er'); }
      } finally { clearTimeout(t); }
    };
    onSel();
  },
  results() {
    const r = J(sessionStorage, 'last', null), o = $('#out');
    if (!r) { o.innerHTML = '<div class="cd"><h2>Henüz analiz yok</h2><p>Sonuç görmek için önce bir analiz başlatın.</p><div class="rw"><a class="bt" href="/analiz/">Analize git</a></div></div>'; return; }
    Object.assign(NM, r.names || {});
    o.innerHTML = `<h1>Analiz sonuçları</h1><p>${names(r)}</p><p class="nt">${r.pairs.length} çift · ${when(r)}</p>` +
      (r.model_version == 'mock' ? '<p class="warn">Temsili veri: bu sonuçlar gerçek klinik bulgu değildir; arayüz tasarımı içindir.</p>' : '') +
      `<p class="nt">${E(r.note)}</p>` + r.pairs.slice().sort((a, b) => ORD[a.risk_level] - ORD[b.risk_level]).map(card).join('') +
      '<p class="nt">Bir biyolojik bağlantının bulunması, klinik olarak kanıtlanmış bir etkileşim anlamına gelmez. Sonuçlar hekim değerlendirmesinin yerini almaz.</p><div class="rw"><a class="bt" href="/analiz/">Yeni analiz başlat</a><a class="bt b2" href="/gecmis/">Analiz geçmişi</a></div>';
  },
  history() {
    const o = $('#out'), draw = () => {
      const h = J(localStorage, 'hist', []);
      o.innerHTML = h.map((r, i) => { const c = {}; r.pairs.forEach(p => c[p.risk_level] = (c[p.risk_level] || 0) + 1);
        return `<article class="cd"><div class="rw"><b>${when(r)}</b>${badge(top(r))}</div><p>${names(r)}</p><p class="nt">Yüksek: ${c.high || 0} · Orta: ${c.medium || 0} · Düşük: ${c.low || 0} · Sonuç yok: ${c.unknown || 0}</p><div class="rw"><button class="bt b2" data-view="${i}">Detayı görüntüle</button><button class="x" data-del="${i}">Sil</button></div></article>`; }).join('')
        || '<div class="cd"><p>Henüz kayıtlı analiz yok.</p><div class="rw"><a class="bt" href="/analiz/">Yeni analiz başlat</a></div></div>';
    };
    o.onclick = e => {
      const v = e.target.closest('[data-view]'), d = e.target.closest('[data-del]'), h = J(localStorage, 'hist', []);
      if (v) { sessionStorage.setItem('last', JSON.stringify(h[v.dataset.view])); location.href = '/sonuclar/'; }
      if (d) { h.splice(d.dataset.del, 1); localStorage.setItem('hist', JSON.stringify(h)); draw(); }
    };
    $('#clr').onclick = () => { localStorage.removeItem('hist'); draw(); };
    draw();
  }
};
nav();
if (pages[P]) pages[P]();
})();
