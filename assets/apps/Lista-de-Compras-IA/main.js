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
let items = [];              // lista atual
let categories = [];         // categorias personalizadas
let historicoCompras = {};   // histórico por mês
let produtosCadastrados = []; // banco de produtos com código de barras
let historicoPrecos = {};     // histórico de preços por produto (código/nome como chave)
let editingIndex = -1;

// ===================== STORAGE LOAD =====================
(function loadFromStorage() {
  const savedItems = localStorage.getItem('listaCompras');
  if (savedItems) { try { items = JSON.parse(savedItems); } catch { items = []; } }

  const savedCats = localStorage.getItem('listaCategorias');
  if (savedCats) { try { categories = JSON.parse(savedCats); } catch { categories = []; } }

  if (!categories || categories.length === 0) {
    categories = ["Mercado", "Açougue", "Limpeza", "Higiene", "Padaria", "Bebidas", "Outros"];
    localStorage.setItem('listaCategorias', JSON.stringify(categories));
  }

  const savedHist = localStorage.getItem('historicoCompras');
  if (savedHist) { try { historicoCompras = JSON.parse(savedHist); } catch { historicoCompras = {}; } }
  if (!historicoCompras || typeof historicoCompras !== "object") historicoCompras = {};

  const savedProdutos = localStorage.getItem('produtosCadastrados');
  if (savedProdutos) { try { produtosCadastrados = JSON.parse(savedProdutos); } catch { produtosCadastrados = []; } }
  if (!produtosCadastrados || !Array.isArray(produtosCadastrados)) produtosCadastrados = [];

  const savedPrecos = localStorage.getItem('historicoPrecos');
  if (savedPrecos) { try { historicoPrecos = JSON.parse(savedPrecos); } catch { historicoPrecos = {}; } }
  if (!historicoPrecos || typeof historicoPrecos !== "object") historicoPrecos = {};
})();

function saveItems()         { localStorage.setItem('listaCompras', JSON.stringify(items)); }
function saveCategories()    { localStorage.setItem('listaCategorias', JSON.stringify(categories)); }
function saveHistorico()     { localStorage.setItem('historicoCompras', JSON.stringify(historicoCompras)); }
function saveProdutos()      { localStorage.setItem('produtosCadastrados', JSON.stringify(produtosCadastrados)); }
function saveHistoricoPrecos() { localStorage.setItem('historicoPrecos', JSON.stringify(historicoPrecos)); }

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

// Produtos
const toggleProdutosBtn = document.getElementById('toggleProdutosBtn');
const produtosBody      = document.getElementById('produtosBody');
const prodCodigoInput   = document.getElementById('prodCodigo');
const prodNomeInput     = document.getElementById('prodNome');
const prodCategoriaSelect = document.getElementById('prodCategoria');
const cadastrarProdBtn  = document.getElementById('cadastrarProdBtn');
const produtosListEl    = document.getElementById('produtosList');

// Dashboard
const economiaDashboardEl = document.getElementById('economiaDashboard');
const economiaProdutoSelect = document.getElementById('economiaProdutoSelect');
const historicoPrecoProdutoEl = document.getElementById('historicoPrecoProduto');

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
  if (prodCategoriaSelect) renderProdutoSelect();
  newCatNameInput.value = "";
}

// ===================== PRODUTOS CADASTRADOS =====================
function buscarProdutoPorCodigo(codigo) {
  return produtosCadastrados.find(p => p.codigo === codigo);
}

function buscarProdutoPorNome(nome) {
  return produtosCadastrados.find(p => p.nome.toLowerCase() === nome.toLowerCase());
}

function cadastrarProdutoNoBanco({ codigo, nome, categoria }) {
  if (!codigo || !nome) return false;
  const existe = produtosCadastrados.find(p => p.codigo === codigo || p.nome.toLowerCase() === nome.toLowerCase());
  if (existe) {
    // Atualizar produto existente
    existe.nome = nome;
    existe.categoria = categoria || existe.categoria;
    saveProdutos();
    return true;
  }
  produtosCadastrados.push({ codigo, nome, categoria: categoria || "Outros" });
  saveProdutos();
  return true;
}

// ===================== HISTÓRICO DE PREÇOS =====================
function registrarPrecoProduto(identificador, preco, dataISO) {
  if (!historicoPrecos[identificador]) historicoPrecos[identificador] = [];
  historicoPrecos[identificador].push({ data: dataISO, preco });
  // Manter apenas últimos 20 preços por produto
  if (historicoPrecos[identificador].length > 20) {
    historicoPrecos[identificador] = historicoPrecos[identificador].slice(-20);
  }
  saveHistoricoPrecos();
}

function getUltimoPreco(identificador) {
  const historico = historicoPrecos[identificador];
  if (!historico || historico.length === 0) return null;
  return historico[historico.length - 1].preco;
}

function getPrecoAnterior(identificador) {
  const historico = historicoPrecos[identificador];
  if (!historico || historico.length < 2) return null;
  return historico[historico.length - 2].preco;
}

function compararPreco(precoAtual, precoAnterior) {
  if (!precoAnterior || precoAnterior === 0) return null;
  const diferenca = precoAtual - precoAnterior;
  const percentual = ((diferenca / precoAnterior) * 100).toFixed(1);
  return { diferenca, percentual };
}

// ===================== HISTÓRICO =====================
function registrarNoHistorico({ name, qty, price, cat, codigoBarras }) {
  const dataISO = new Date().toISOString().slice(0,10);
  const mesChave = dataISO.slice(0,7);
  const subtotal = qty * price;
  if (!historicoCompras[mesChave]) historicoCompras[mesChave] = [];
  historicoCompras[mesChave].push({ data: dataISO, nome: name, categoria: cat, qtd: qty, unitario: price, subtotal, codigoBarras });
  saveHistorico();
  atualizarHistoricoUI();
  
  // Registrar preço no histórico de preços
  const identificador = codigoBarras || name;
  registrarPrecoProduto(identificador, price, dataISO);
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
    const identificador = item.codigoBarras || item.name;
    const ultimoPreco = getUltimoPreco(identificador);
    const precoAnterior = getPrecoAnterior(identificador);
    let precoComparacao = "";
    
    if (precoAnterior && ultimoPreco) {
      const comparacao = compararPreco(item.price, precoAnterior);
      if (comparacao) {
        const sinal = comparacao.diferenca > 0 ? "↑" : comparacao.diferenca < 0 ? "↓" : "→";
        const cor = comparacao.diferenca > 0 ? "#dc2626" : comparacao.diferenca < 0 ? "#16a34a" : "#6b7280";
        precoComparacao = `<br><small style="color:${cor};font-size:0.75rem;">${sinal} R$ ${formatMoney(Math.abs(comparacao.diferenca))} (${Math.abs(comparacao.percentual)}%)</small>`;
      }
    }
    
    const codigoBarrasHtml = item.codigoBarras ? '<br><small style="color:#6b7280;font-size:0.75rem;">📷 ' + item.codigoBarras + '</small>' : '';
    
    tr.innerHTML = `
      <td data-label="Item">${item.name}${codigoBarrasHtml}</td>
      <td data-label="Categoria">${item.cat}</td>
      <td data-label="Quantidade" style="text-align:right;">${item.qty}</td>
      <td data-label="Unitário" style="text-align:right;">R$ ${formatMoney(item.price)}${precoComparacao}</td>
      <td data-label="Subtotal" style="text-align:right;">R$ ${formatMoney(subtotal)}</td>
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
  
  // Verificar se produto existe cadastrado
  const produto = buscarProdutoPorNome(name);
  const codigoBarras = produto ? produto.codigo : null;
  
  items.push({ name, qty, price, cat, codigoBarras });
  saveItems(); 
  renderTable(); 
  registrarNoHistorico({ name, qty, price, cat, codigoBarras });
  
  itemNameInput.value = ""; 
  itemQtyInput.value = 1; 
  itemPriceInput.value = 0;
}

function addItemFromScanner() {
  const codigoLido = scanNameInput.value.trim();
  const qty = +scanQtyInput.value;
  const price = +scanPriceInput.value;
  const cat = scanCatSelect.value || "Outros";
  if (!codigoLido) return alert("Código lido, mas nome vazio.");
  
  // Buscar produto cadastrado pelo código
  let produto = buscarProdutoPorCodigo(codigoLido);
  let nome = codigoLido;
  
  if (produto) {
    nome = produto.nome;
    scanCatSelect.value = produto.categoria;
    scanStatusEl.textContent = "Produto encontrado: " + produto.nome;
  } else {
    // Produto não cadastrado, usar código como nome
    scanStatusEl.textContent = "Produto não cadastrado. Use o código como nome.";
  }
  
  items.push({ name: nome, qty, price, cat, codigoBarras: codigoLido });
  saveItems(); 
  renderTable(); 
  registrarNoHistorico({ name: nome, qty, price, cat, codigoBarras: codigoLido });
  
  scanQtyInput.value = 1; 
  scanPriceInput.value = 0;
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
// Integração com QRbot - App gratuito para Android e iOS
// Site: https://qrbot.net/

function processarCodigoLido(codigoLido) {
  codigoLido = codigoLido.trim();
  
  // Validar código de barras (deve ter pelo menos 8 dígitos para EAN-8 ou mais)
  if (codigoLido.length < 4) {
    scanStatusEl.textContent = "Código muito curto. Tente novamente.";
    return;
  }
  
  // Preencher campo de código no scanner
  if (scanNameInput) {
    scanNameInput.value = codigoLido;
  }
  
  // Preencher campo de código no cadastro de produtos
  if (prodCodigoInput) {
    prodCodigoInput.value = codigoLido;
    // Abrir seção de cadastro se estiver fechada
    if (produtosBody && !produtosBody.classList.contains('active')) {
      produtosBody.classList.add('active');
    }
    // Scroll suave até o campo
    prodCodigoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  scanStatusEl.textContent = "✓ Código recebido: " + codigoLido;
  
  // Buscar produto cadastrado
  const produto = buscarProdutoPorCodigo(codigoLido);
  if (produto) {
    // Produto encontrado - preencher automaticamente nos dois formulários
    const ultimoPreco = getUltimoPreco(codigoLido);
    
    // Preencher formulário de scanner
    scanStatusEl.textContent = "✓ Produto encontrado: " + produto.nome;
    if (scanCatSelect) scanCatSelect.value = produto.categoria;
    if (ultimoPreco && scanPriceInput) {
      scanPriceInput.value = ultimoPreco.toFixed(2);
      scanStatusEl.textContent += " | Último preço: R$ " + formatMoney(ultimoPreco);
    }
    
    // Preencher formulário de cadastro
    if (prodNomeInput) prodNomeInput.value = produto.nome;
    if (prodCategoriaSelect) prodCategoriaSelect.value = produto.categoria;
    
    // Feedback visual
    if (scanNameInput) {
      scanNameInput.style.borderColor = "#10b981";
      setTimeout(() => {
        if (scanNameInput) scanNameInput.style.borderColor = "";
      }, 2000);
    }
  } else {
    scanStatusEl.textContent = "✓ Código recebido: " + codigoLido + " (produto não cadastrado - preencha o nome)";
    // Limpar nome e categoria no cadastro para permitir novo cadastro
    if (prodNomeInput) prodNomeInput.value = "";
    if (prodCategoriaSelect) prodCategoriaSelect.value = "Outros";
    
    // Feedback visual
    if (scanNameInput) {
      scanNameInput.style.borderColor = "#0b5f8a";
      setTimeout(() => {
        if (scanNameInput) scanNameInput.style.borderColor = "";
      }, 2000);
    }
    
    // Focar no campo de nome para facilitar preenchimento
    if (prodNomeInput) {
      setTimeout(() => prodNomeInput.focus(), 300);
    }
  }
}

// Função para abrir QRbot
function abrirQRbot() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  
  scanStatusEl.textContent = "Abrindo QRbot...";
  
  if (isAndroid) {
    // Android: Intent URL para QRbot
    // Package: net.qrbot (baseado no site oficial)
    const intentUrl = "intent://scan/#Intent;scheme=zxing;package=net.qrbot;end";
    window.location.href = intentUrl;
    
    // Fallback: tenta abrir na Play Store se o app não estiver instalado
    setTimeout(() => {
      window.location.href = "https://play.google.com/store/apps/details?id=net.qrbot";
    }, 2000);
  } else if (isIOS) {
    // iOS: URL Scheme do QRbot
    // Tenta abrir o app, se não funcionar, abre a App Store
    window.location.href = "qrbot://scan";
    
    setTimeout(() => {
      window.location.href = "https://apps.apple.com/app/qr-code-barcode-scanner/id1048473097";
    }, 2000);
  } else {
    // Desktop/outros: abrir página de download
    scanStatusEl.textContent = "Abra o QRbot no seu dispositivo móvel";
    window.open("https://qrbot.net/", "_blank");
  }
  
  // Sugerir colar o código após alguns segundos
  setTimeout(() => {
    if (scanNameInput) {
      scanStatusEl.textContent = "Após escanear no QRbot, copie o código e cole no campo 'Item lido'";
      scanNameInput.focus();
      scanNameInput.select();
    }
  }, 3000);
}

// Detectar colagem de código no campo scanName
if (scanNameInput) {
  scanNameInput.addEventListener('paste', (e) => {
    setTimeout(() => {
      const valor = scanNameInput.value.trim();
      if (valor.length >= 4) {
        processarCodigoLido(valor);
      }
    }, 100);
  });
  
  // Também detectar quando o usuário digita/cola manualmente
  scanNameInput.addEventListener('input', () => {
    const valor = scanNameInput.value.trim();
    if (valor.length >= 8) { // Só processar se parecer um código de barras completo
      processarCodigoLido(valor);
    }
  });
}

// Detectar colagem de código no campo prodCodigo
if (prodCodigoInput) {
  prodCodigoInput.addEventListener('paste', (e) => {
    setTimeout(() => {
      const valor = prodCodigoInput.value.trim();
      if (valor.length >= 4) {
        processarCodigoLido(valor);
      }
    }, 100);
  });
}

// Botão para abrir QRbot (seção scanner)
const openQrAppBtn = document.getElementById("openQrAppBtn");
if (openQrAppBtn) {
  openQrAppBtn.addEventListener("click", abrirQRbot);
}

// Botão para abrir QRbot (seção cadastro)
const openQrAppBtnCadastro = document.getElementById("openQrAppBtnCadastro");
if (openQrAppBtnCadastro) {
  openQrAppBtnCadastro.addEventListener("click", () => {
    // Abrir seção de cadastro se estiver fechada
    if (produtosBody && !produtosBody.classList.contains('active')) {
      produtosBody.classList.add('active');
    }
    abrirQRbot();
  });
}

// ===================== RECONHECIMENTO POR FOTO (IA) =====================
// IMPORTANTE: Requer configuração de API key (OpenAI, Google Vision, etc.)
// Por segurança, a API key não deve ficar no código do frontend
// Idealmente, usar um backend proxy para fazer as chamadas à API

const fotoProdutoBtn = document.getElementById("fotoProdutoBtn");
const fotoProdutoInput = document.getElementById("fotoProdutoInput");

if (fotoProdutoBtn && fotoProdutoInput) {
  fotoProdutoBtn.addEventListener("click", () => {
    fotoProdutoInput.click();
  });

  fotoProdutoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar se é imagem
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione uma imagem.");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem é muito grande. Use uma imagem menor que 5MB.");
      return;
    }

    try {
      // Mostrar status
      if (produtosBody && !produtosBody.classList.contains('active')) {
        produtosBody.classList.add('active');
      }
      
      // Converter imagem para base64
      const base64Image = await fileToBase64(file);
      
      // Processar com IA
      await processarFotoComIA(base64Image);
      
    } catch (error) {
      console.error("Erro ao processar foto:", error);
      alert("Erro ao processar a foto. Tente novamente.");
    } finally {
      // Limpar input
      fotoProdutoInput.value = "";
    }
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remover prefixo data:image/...;base64,
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function processarFotoComIA(base64Image) {
  // ===== CONFIGURAÇÃO DA API =====
  // Configure aqui a URL do seu backend que fará a chamada à API de IA
  // IMPORTANTE: NÃO coloque a API key aqui no frontend!
  // Crie um backend (Node.js, Python, etc.) que recebe a foto e chama a API
  
  const API_BACKEND_URL = 'https://seu-backend.com/api/reconhecer-produto'; // ← CONFIGURE AQUI SUA URL
  
  // Mostrar loading
  if (scanStatusEl) scanStatusEl.textContent = "Analisando foto com IA...";
  
  mostrarPreviewImagem(base64Image);
  
  try {
    // ===== OPÇÃO 1: Usar Backend (RECOMENDADO) =====
    // Descomente e configure quando tiver seu backend pronto:
    /*
    const response = await fetch(API_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagem: base64Image
      })
    });

    if (!response.ok) {
      throw new Error('Erro na API do backend');
    }

    const dados = await response.json();
    preencherCamposComDadosIA(dados);
    return; // Sair após processar
    */
    
    // ===== OPÇÃO 2: Simulação para desenvolvimento/teste =====
    // Descomente para testar sem API real (simula resposta após 2 segundos):
    /*
    await new Promise(resolve => setTimeout(resolve, 2000));
    const dadosSimulados = {
      nome: "Produto Reconhecido (exemplo)",
      codigo: "7891234567890",
      categoria: "Mercado"
    };
    preencherCamposComDadosIA(dadosSimulados);
    return; // Sair após simular
    */
    
    // Por enquanto, apenas mostra preview (configure uma das opções acima)
    if (scanStatusEl) scanStatusEl.textContent = "Foto carregada. Configure a API para reconhecimento automático.";
    
    alert("ℹ️ Para usar reconhecimento por IA:\n\n" +
          "1. Crie um backend (exemplo em README-IA.md)\n" +
          "2. Configure API_BACKEND_URL no código (linha ~610)\n" +
          "3. Descomente a OPÇÃO 1 no código\n" +
          "4. Ou use OPÇÃO 2 para testes com simulação\n\n" +
          "Por enquanto, a foto foi carregada. Preencha os campos manualmente.");
    
  } catch (error) {
    console.error("Erro ao processar foto:", error);
    if (scanStatusEl) scanStatusEl.textContent = "Erro ao processar foto. Tente novamente.";
    alert("Erro ao processar a foto: " + error.message);
  }
}

function preencherCamposComDadosIA(dados) {
  // Função auxiliar para preencher campos com dados da IA
  // Você pode melhorar esta função para processar mais dados
  let preenchido = false;
  
  if (dados.nome && prodNomeInput) {
    prodNomeInput.value = dados.nome;
    preenchido = true;
  }
  
  if (dados.codigo && prodCodigoInput) {
    prodCodigoInput.value = dados.codigo;
    preenchido = true;
  }
  
  if (dados.categoria && prodCategoriaSelect) {
    // Tentar encontrar categoria correspondente
    const catMatch = categories.find(c => 
      c.toLowerCase().includes(dados.categoria.toLowerCase()) ||
      dados.categoria.toLowerCase().includes(c.toLowerCase())
    );
    if (catMatch) {
      prodCategoriaSelect.value = catMatch;
    } else if (categories.includes(dados.categoria)) {
      prodCategoriaSelect.value = dados.categoria;
    }
  }
  
  if (preenchido) {
    if (scanStatusEl) scanStatusEl.textContent = "✓ Produto reconhecido! Revise os campos.";
    alert("✓ Produto reconhecido com sucesso!\n\nRevise os campos preenchidos e clique em 'Cadastrar'.");
  } else {
    if (scanStatusEl) scanStatusEl.textContent = "Dados recebidos, mas campos não preenchidos.";
  }
}

function mostrarPreviewImagem(base64Image) {
  // Criar preview visual (opcional)
  const preview = document.createElement('div');
  preview.style.cssText = 'margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; text-align: center;';
  preview.innerHTML = `
    <img src="data:image/jpeg;base64,${base64Image}" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 8px;" />
    <div style="font-size: 0.75rem; color: #6b7280;">
      Foto carregada. Configure a API de reconhecimento para preencher automaticamente.
    </div>
  `;
  
  // Remover preview anterior se existir
  const previewAnterior = document.getElementById('previewFotoProduto');
  if (previewAnterior) {
    previewAnterior.remove();
  }
  
  preview.id = 'previewFotoProduto';
  if (produtosBody) {
    produtosBody.appendChild(preview);
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Botão adicional para adicionar item lido
if (scanAddBtn) {
  scanAddBtn.addEventListener("click", addItemFromScanner);
}

// ===================== PRODUTOS =====================
function renderProdutosList() {
  if (!produtosListEl) return;
  produtosListEl.innerHTML = "";
  if (produtosCadastrados.length === 0) {
    produtosListEl.innerHTML = "<div style='font-size:.8rem;color:#666;'>Nenhum produto cadastrado.</div>";
    return;
  }
  produtosCadastrados.forEach((prod, i) => {
    const row = document.createElement('div');
    row.className = "cat-list-item";
    const ultimoPreco = getUltimoPreco(prod.codigo);
    const precoTexto = ultimoPreco ? ` | Último: R$ ${formatMoney(ultimoPreco)}` : "";
    row.innerHTML = `<div class="cat-name">${prod.nome}<br><small style="color:#6b7280;font-size:0.7rem;">📷 ${prod.codigo} | ${prod.categoria}${precoTexto}</small></div>
      <button class="cat-remove-btn" data-index="${i}">remover</button>`;
    produtosListEl.appendChild(row);
  });
  produtosListEl.querySelectorAll('.cat-remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = +e.target.dataset.index;
      if (confirm(`Remover produto "${produtosCadastrados[i].nome}"?`)) {
        produtosCadastrados.splice(i, 1);
        saveProdutos();
        renderProdutosList();
        atualizarEconomiaDashboard();
        atualizarEconomiaSelect();
      }
    });
  });
}

function cadastrarProduto() {
  if (!prodCodigoInput || !prodNomeInput || !prodCategoriaSelect) return;
  const codigo = prodCodigoInput.value.trim();
  const nome = prodNomeInput.value.trim();
  const categoria = prodCategoriaSelect.value || "Outros";
  if (!codigo || !nome) return alert("Preencha código de barras e nome do produto.");
  
  if (cadastrarProdutoNoBanco({ codigo, nome, categoria })) {
    prodCodigoInput.value = "";
    prodNomeInput.value = "";
    renderProdutosList();
    atualizarEconomiaSelect();
    alert("Produto cadastrado com sucesso!");
  }
}

function renderProdutoSelect() {
  if (!prodCategoriaSelect) return;
  prodCategoriaSelect.innerHTML = "";
  categories.forEach(cat => {
    prodCategoriaSelect.add(new Option(cat, cat));
  });
}

// ===================== DASHBOARD DE ECONOMIA =====================
function atualizarEconomiaDashboard() {
  if (!economiaDashboardEl) return;
  let totalEconomia = 0;
  let produtosComVariacao = 0;
  let produtosMaisCaros = 0;
  let produtosMaisBaratos = 0;
  
  Object.keys(historicoPrecos).forEach(identificador => {
    const historico = historicoPrecos[identificador];
    if (historico.length >= 2) {
      const ultimo = historico[historico.length - 1].preco;
      const anterior = historico[historico.length - 2].preco;
      const diferenca = ultimo - anterior;
      totalEconomia += diferenca * (-1); // negativo = economia, positivo = aumento
      produtosComVariacao++;
      if (diferenca > 0) produtosMaisCaros++;
      if (diferenca < 0) produtosMaisBaratos++;
    }
  });
  
  economiaDashboardEl.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
      <div style="padding: 12px; background: #ecfdf5; border-radius: 10px; border: 1px solid #a7f3d0;">
        <div style="font-size: 0.75rem; color: #065f46; font-weight: 600;">ECONOMIA TOTAL</div>
        <div style="font-size: 1.2rem; color: #047857; font-weight: 700; margin-top: 4px;">R$ ${formatMoney(Math.max(0, totalEconomia))}</div>
      </div>
      <div style="padding: 12px; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe;">
        <div style="font-size: 0.75rem; color: #1e40af; font-weight: 600;">PRODUTOS MONITORADOS</div>
        <div style="font-size: 1.2rem; color: #1e3a8a; font-weight: 700; margin-top: 4px;">${produtosComVariacao}</div>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div style="padding: 10px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <div style="font-size: 0.7rem; color: #991b1b;">Mais caros: ${produtosMaisCaros}</div>
      </div>
      <div style="padding: 10px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
        <div style="font-size: 0.7rem; color: #166534;">Mais baratos: ${produtosMaisBaratos}</div>
      </div>
    </div>
  `;
}

function atualizarEconomiaSelect() {
  if (!economiaProdutoSelect) return;
  economiaProdutoSelect.innerHTML = '<option value="">Selecione um produto...</option>';
  Object.keys(historicoPrecos).forEach(identificador => {
    const produto = buscarProdutoPorCodigo(identificador) || buscarProdutoPorNome(identificador);
    const nome = produto ? produto.nome : identificador;
    economiaProdutoSelect.add(new Option(`${nome} (${identificador.substring(0, 13)}...)`, identificador));
  });
}

if (economiaProdutoSelect && historicoPrecoProdutoEl) {
  economiaProdutoSelect.addEventListener('change', (e) => {
    const identificador = e.target.value;
    if (!identificador) {
      historicoPrecoProdutoEl.style.display = 'none';
      return;
    }
    
    const historico = historicoPrecos[identificador];
    if (!historico || historico.length === 0) {
      historicoPrecoProdutoEl.innerHTML = '<div style="color:#666;">Nenhum histórico de preços para este produto.</div>';
      historicoPrecoProdutoEl.style.display = 'block';
      return;
    }
    
    const produto = buscarProdutoPorCodigo(identificador) || buscarProdutoPorNome(identificador);
    const nome = produto ? produto.nome : identificador;
    
    let html = `<div style="font-weight: 600; margin-bottom: 8px; color: #0b5f8a;">${nome}</div>`;
    html += '<div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 8px;">Histórico de preços:</div>';
    html += '<div style="display: flex; flex-direction: column; gap: 6px;">';
    
    historico.slice().reverse().forEach((item, i) => {
      const dataFormatada = new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR');
      const isUltimo = i === 0;
      const diferenca = i < historico.length - 1 ? item.preco - historico[historico.length - 2 - i].preco : 0;
      let indicador = "";
      if (i < historico.length - 1) {
        if (diferenca > 0) indicador = `<span style="color:#dc2626;">↑ +R$ ${formatMoney(diferenca)}</span>`;
        else if (diferenca < 0) indicador = `<span style="color:#16a34a;">↓ -R$ ${formatMoney(Math.abs(diferenca))}</span>`;
        else indicador = `<span style="color:#6b7280;">→</span>`;
      }
      html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: ${isUltimo ? '#e6f4ff' : '#fff'}; border-radius: 6px; border: ${isUltimo ? '2px solid #0b5f8a' : '1px solid #e5e7eb'};">
        <div><strong>${dataFormatada}</strong></div>
        <div style="font-weight: 600;">R$ ${formatMoney(item.preco)} ${indicador}</div>
      </div>`;
    });
    
    html += '</div>';
    historicoPrecoProdutoEl.innerHTML = html;
    historicoPrecoProdutoEl.style.display = 'block';
  });
}

// ===================== INICIALIZAÇÃO =====================
addBtn.addEventListener('click', addItemManual);
clearListBtn.addEventListener('click', clearList);
exportWaBtn.addEventListener('click', exportWhatsApp);
exportCsvMonthBtn.addEventListener('click', () => alert("Exportar CSV ativo."));
exportPdfMonthBtn.addEventListener('click', () => alert("Exportar PDF ativo."));
addCatBtn.addEventListener('click', addCategory);
toggleSettingsBtn.addEventListener('click', () => settingsBody.classList.toggle('active'));
if (toggleProdutosBtn) toggleProdutosBtn.addEventListener('click', () => produtosBody.classList.toggle('active'));
if (cadastrarProdBtn) cadastrarProdBtn.addEventListener('click', cadastrarProduto);

renderCategorySelectOptions();
renderProdutoSelect();
renderCategoryListInSettings();
renderProdutosList();
atualizarHistoricoUI();
atualizarEconomiaDashboard();
atualizarEconomiaSelect();
renderTable();
