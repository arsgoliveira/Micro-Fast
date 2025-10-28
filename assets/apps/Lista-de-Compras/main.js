// ===================== UTIL =====================
function formatMoney(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function groupByCategory(list) {
  const map = {};
  list.forEach(item => {
    if (!map[item.categoria]) {
      map[item.categoria] = [];
    }
    map[item.categoria].push(item);
  });
  return map;
}

function calcSubtotalFromObj(obj) { return obj.qtd * obj.unitario; }
function calcSubtotalRuntime(item) { return item.qty * item.price; }
function calcTotalRuntime(runtimeItems) {
  return runtimeItems.reduce((acc, cur) => acc + calcSubtotalRuntime(cur), 0);
}
function calcCategoryTotal(list) {
  return list.reduce((acc, cur) => acc + (cur.subtotal ?? calcSubtotalFromObj(cur)), 0);
}

// ===================== ESTADO GLOBAL =====================
let items = [];        // lista atual
let categories = [];   // categorias personalizadas
let historicoCompras = {};
let editingIndex = -1;

// ===================== STORAGE LOAD =====================
(function loadFromStorage() {
  const savedItems = localStorage.getItem('listaCompras');
  if (savedItems) { try { items = JSON.parse(savedItems); } catch { items = []; } }

  const savedCats = localStorage.getItem('listaCategorias');
  if (savedCats) { try { categories = JSON.parse(savedCats); } catch { categories = []; } }

  if (!categories || categories.length === 0) {
    categories = ["Mercado", "Açougue", "Limpeza", "Higiene", "Peças PC", "Outros"];
    localStorage.setItem('listaCategorias', JSON.stringify(categories));
  }

  const savedHist = localStorage.getItem('historicoCompras');
  if (savedHist) { try { historicoCompras = JSON.parse(savedHist); } catch { historicoCompras = {}; } }
  if (!historicoCompras || typeof historicoCompras !== "object") historicoCompras = {};
})();

function saveItems()       { localStorage.setItem('listaCompras', JSON.stringify(items)); }
function saveCategories()  { localStorage.setItem('listaCategorias', JSON.stringify(categories)); }
function saveHistorico()   { localStorage.setItem('historicoCompras', JSON.stringify(historicoCompras)); }

// ===================== DOM ELEMENTOS =====================
const itemNameInput   = document.getElementById('itemName');
const itemQtyInput    = document.getElementById('itemQty');
const itemPriceInput  = document.getElementById('itemPrice');
const itemCatSelect   = document.getElementById('itemCat');
const addBtn          = document.getElementById('addBtn');
const itemsBody       = document.getElementById('itemsBody');
const totalValueEl    = document.getElementById('totalValue');
const clearListBtn    = document.getElementById('clearListBtn');
const yearEl          = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const exportPdfBtn    = document.getElementById('exportPdfBtn');
const exportWaBtn     = document.getElementById('exportWaBtn');
const historyMonthSelect = document.getElementById('historyMonthSelect');
const exportCsvMonthBtn  = document.getElementById('exportCsvMonthBtn');
const exportPdfMonthBtn  = document.getElementById('exportPdfMonthBtn');
const historySummaryEl   = document.getElementById('historySummary');

// Scanner
const scanNameInput   = document.getElementById('scanName');
const scanQtyInput    = document.getElementById('scanQty');
const scanPriceInput  = document.getElementById('scanPrice');
const scanCatSelect   = document.getElementById('scanCat');
const scanAddBtn      = document.getElementById('scanAddBtn');
const scanStatusEl    = document.getElementById('scanStatus');

// Configurações
const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
const settingsBody      = document.getElementById('settingsBody');
const newCatNameInput   = document.getElementById('newCatName');
const addCatBtn         = document.getElementById('addCatBtn');
const catListEl         = document.getElementById('catList');

// ===================== CATEGORIAS =====================
function renderCategorySelectOptions() {
  itemCatSelect.innerHTML = "";
  scanCatSelect.innerHTML = "";
  categories.forEach(cat => {
    const opt1 = new Option(cat, cat);
    const opt2 = new Option(cat, cat);
    itemCatSelect.add(opt1);
    scanCatSelect.add(opt2);
  });
}

function renderCategoryListInSettings() {
  catListEl.innerHTML = "";
  if (categories.length === 0) {
    catListEl.innerHTML = "<div style='font-size:.8rem;color:#666;'>Nenhuma categoria cadastrada.</div>";
    return;
  }
  categories.forEach((cat, i) => {
    const row = document.createElement('div');
    row.className = "cat-list-item";
    row.innerHTML = `<div class="cat-name">${cat}</div>
      <button class="cat-remove-btn" data-index="${i}">remover</button>`;
    catListEl.appendChild(row);
  });
  catListEl.querySelectorAll('.cat-remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = +e.target.dataset.index;
      const used = items.some(it => it.cat === categories[i]);
      if (used) return alert("Categoria em uso. Remova itens primeiro.");
      categories.splice(i, 1);
      saveCategories();
      renderCategorySelectOptions();
      renderCategoryListInSettings();
      atualizarHistoricoUI();
    });
  });
}

function addCategory() {
  const newCat = newCatNameInput.value.trim();
  if (!newCat) return alert("Digite um nome de categoria.");
  if (categories.includes(newCat)) return alert("Essa categoria já existe.");
  categories.push(newCat);
  saveCategories();
  renderCategorySelectOptions();
  renderCategoryListInSettings();
  newCatNameInput.value = "";
}

// ===================== HISTÓRICO =====================
function registrarNoHistorico({ name, qty, price, cat }) {
  const dataISO = new Date().toISOString().slice(0,10);
  const mesChave = dataISO.slice(0,7);
  const subtotal = qty * price;
  if (!historicoCompras[mesChave]) historicoCompras[mesChave] = [];
  historicoCompras[mesChave].push({ data: dataISO, nome: name, categoria: cat, qtd: qty, unitario: price, subtotal });
  saveHistorico();
  atualizarHistoricoUI();
}

function getMesesHistorico() { return Object.keys(historicoCompras).sort().reverse(); }
function calcularResumoMes(mes) {
  const lista = historicoCompras[mes] || [];
  return lista.reduce((acc, it) => ({
    totalMes: acc.totalMes + (it.subtotal ?? it.qtd * it.unitario),
    qtdItens: acc.qtdItens + 1
  }), { totalMes: 0, qtdItens: 0 });
}

function atualizarHistoricoUI() {
  const meses = getMesesHistorico();
  historyMonthSelect.innerHTML = "";
  if (meses.length === 0) {
    historyMonthSelect.innerHTML = "<option>Sem dados</option>";
    historySummaryEl.textContent = "Nenhum dado mensal ainda.";
    return;
  }
  meses.forEach(m => historyMonthSelect.add(new Option(m, m)));
  const mes = meses[0];
  const { totalMes, qtdItens } = calcularResumoMes(mes);
  historyMonthSelect.value = mes;
  historySummaryEl.textContent = `Total do mês ${mes}: R$ ${formatMoney(totalMes)} (${qtdItens} itens)`;
}
if (historyMonthSelect)
  historyMonthSelect.addEventListener("change", () => {
    const mes = historyMonthSelect.value;
    if (!mes) return;
    const { totalMes, qtdItens } = calcularResumoMes(mes);
    historySummaryEl.textContent = `Total do mês ${mes}: R$ ${formatMoney(totalMes)} (${qtdItens} itens)`;
  });

// ===================== ADIÇÃO / EDIÇÃO =====================
function renderTable() {
  itemsBody.innerHTML = "";
  items.forEach((item, i) => {
    const tr = document.createElement('tr');
    const subtotal = calcSubtotalRuntime(item);
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.cat}</td>
      <td style="text-align:right;">${item.qty}</td>
      <td style="text-align:right;">R$ ${formatMoney(item.price)}</td>
      <td style="text-align:right;">R$ ${formatMoney(subtotal)}</td>
      <td><button class="action-btn remove-btn" data-i="${i}">Remover</button></td>`;
    itemsBody.appendChild(tr);
  });
  totalValueEl.textContent = formatMoney(calcTotalRuntime(items));
  itemsBody.querySelectorAll('.remove-btn').forEach(b => {
    b.addEventListener('click', e => {
      const i = +e.target.dataset.i;
      if (confirm("Remover este item?")) {
        items.splice(i, 1);
        saveItems();
        renderTable();
      }
    });
  });
}

function addItemManual() {
  const name = itemNameInput.value.trim();
  const qty = +itemQtyInput.value;
  const price = +itemPriceInput.value;
  const cat = itemCatSelect.value || "Outros";
  if (!name) return alert("Digite o nome do item.");
  items.push({ name, qty, price, cat });
  saveItems(); renderTable(); registrarNoHistorico({ name, qty, price, cat });
  itemNameInput.value = ""; itemQtyInput.value = 1; itemPriceInput.value = 0;
}

function addItemFromScanner() {
  const name = scanNameInput.value.trim();
  const qty = +scanQtyInput.value;
  const price = +scanPriceInput.value;
  const cat = scanCatSelect.value || "Outros";
  if (!name) return alert("Código lido, mas nome vazio.");
  items.push({ name, qty, price, cat });
  saveItems(); renderTable(); registrarNoHistorico({ name, qty, price, cat });
  scanQtyInput.value = 1; scanPriceInput.value = 0;
}

function clearList() {
  if (confirm("Apagar toda a lista atual? (Histórico será mantido)")) {
    items = []; saveItems(); renderTable();
  }
}

// ===================== EXPORTAÇÕES =====================
function exportWhatsApp() {
  if (!items.length) return alert("Lista vazia.");
  const msg = items.map(i => `${i.cat}: ${i.name} (${i.qty}x R$${formatMoney(i.price)})`).join("\n");
  const waUrl = "https://wa.me/?text=" + encodeURIComponent(msg);
  window.open(waUrl, "_blank");
}

// ===================== SCANNER / QRBOT =====================
const readerDivId = "reader";
let html5QrCode = null;
let scannerAtivo = false;

const config = {
  fps: 10,
  qrbox: 250,
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_39
  ]
};

function onScanSuccess(decodedText) {
  scanNameInput.value = decodedText;
  scanStatusEl.textContent = "Código lido: " + decodedText;
}

function onScanError(err) {
  // Erros de leitura são ignorados
}

async function startScanner() {
  if (scannerAtivo) {
    await stopScanner();
    return;
  }

  scanStatusEl.textContent = "Procurando câmera traseira...";
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras || cameras.length === 0) {
      scanStatusEl.textContent = "Nenhuma câmera encontrada.";
      return;
    }

    // Escolher a câmera traseira
    let camera = cameras.find(c => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("traseira"));
    if (!camera) camera = cameras[cameras.length - 1]; // usa a última se não achar “back”

    html5QrCode = new Html5Qrcode(readerDivId);

    await html5QrCode.start(camera.id, config, onScanSuccess, onScanError);
    scanStatusEl.textContent = "Câmera ativa (traseira). Aponte para o código.";
    scannerAtivo = true;
  } catch (err) {
    console.error(err);
    scanStatusEl.textContent = "Erro ao abrir câmera.";
  }
}

async function stopScanner() {
  if (html5QrCode && scannerAtivo) {
    await html5QrCode.stop();
    html5QrCode.clear();
    scannerAtivo = false;
    scanStatusEl.textContent = "Câmera parada.";
  }
}

// Botão para iniciar/parar leitor
const openQrAppBtn = document.getElementById("openQrAppBtn");
if (openQrAppBtn) {
  openQrAppBtn.addEventListener("click", async () => {
    if (!scannerAtivo) {
      scanStatusEl.textContent = "Iniciando leitor...";
      try {
        await startScanner();
      } catch {
        // fallback: tenta abrir app QRbot externo (Android)
        window.location.href =
          "intent://scan/#Intent;scheme=zxing;package=com.teacapps.barcodescanner;end";
      }
    } else {
      await stopScanner();
    }
  });
}

// Botão adicional para adicionar item lido
if (scanAddBtn) {
  scanAddBtn.addEventListener("click", addItemFromScanner);
}


// ===================== INICIALIZAÇÃO =====================
addBtn.addEventListener('click', addItemManual);
clearListBtn.addEventListener('click', clearList);
exportWaBtn.addEventListener('click', exportWhatsApp);
exportCsvMonthBtn.addEventListener('click', () => alert("Exportar CSV ativo."));
exportPdfMonthBtn.addEventListener('click', () => alert("Exportar PDF ativo."));
addCatBtn.addEventListener('click', addCategory);
toggleSettingsBtn.addEventListener('click', () => settingsBody.classList.toggle('active'));

navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: { ideal: "environment" } // traseira
  }
})


renderCategorySelectOptions();
renderCategoryListInSettings();
atualizarHistoricoUI();
renderTable();
