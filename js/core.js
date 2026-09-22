/* ==========================================================================
   FUNÇÕES COMPARTILHADAS (usadas pelo painel e pelo site)
   ========================================================================== */

// Tempos das etapas do pedido (em minutos) — pode ajustar aqui
const TEMPO_EM_ANDAMENTO_MIN = 1;   // depois de aceito, fica "em andamento" por 1 min
const TEMPO_EM_PREPARO_MIN = 10;    // depois fica "em preparo" por 10 min
const TEMPO_ATRASO_MIN = 5;         // depois de "pronto", se passar disso sem sair, fica "em atraso"

// Converte um arquivo de imagem escolhido pelo usuário em base64,
// para ser salvo direto no Firestore (sem precisar de servidor de upload)
function arquivoParaBase64(file, callback) {
  if (!file) return callback(null);
  const leitor = new FileReader();
  leitor.onload = () => callback(leitor.result);
  leitor.readAsDataURL(file);
}

// Formata número para reais
function formatarValor(v) {
  const n = parseFloat(v || 0);
  return "R$ " + n.toFixed(2).replace(".", ",");
}

// Gera um id simples
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// A partir do pedido (aceito ou não, e de quando foi aceito), calcula
// automaticamente em que etapa ele está:
// 'aguardando' (esperando alguém aceitar) -> 'andamento' -> 'preparo' -> 'pronto'
// e se estiver 'pronto' passa a marcar 'atraso' depois de alguns minutos.
function calcularEtapaPedidoV2(pedido, aceitoEmMillis) {
  if (!pedido.aceito) return { etapa: "aguardando", atraso: false };

  const minutosPassados = (Date.now() - aceitoEmMillis) / 60000;
  let etapa;
  if (minutosPassados < TEMPO_EM_ANDAMENTO_MIN) etapa = "andamento";
  else if (minutosPassados < TEMPO_EM_ANDAMENTO_MIN + TEMPO_EM_PREPARO_MIN) etapa = "preparo";
  else etapa = "pronto";

  let atraso = false;
  if (etapa === "pronto") {
    const minutosProntoDesde = minutosPassados - (TEMPO_EM_ANDAMENTO_MIN + TEMPO_EM_PREPARO_MIN);
    atraso = minutosProntoDesde >= TEMPO_ATRASO_MIN;
  }
  return { etapa, atraso };
}

// Pega o storeId ativo (funciona tanto no painel quanto no site)
function getStoreId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("loja") || localStorage.getItem("loja_id") || (window.STORE_ID || null);
}

// Descobre automaticamente qual é a loja "ativa" no momento:
// 1) se tiver ?loja=ID na URL, usa esse (prioridade, serve pra testar/compartilhar um link fixo)
// 2) senão, busca no Firestore qual foi a última loja criada no painel (fica sempre atualizado
//    sozinho, sem precisar editar o config.js toda vez que alguém cria uma loja nova)
// 3) se nada disso funcionar, cai pro config.js manual (STORE_ID) como último recurso
async function resolverStoreIdAtivo() {
  const params = new URLSearchParams(window.location.search);
  const daUrl = params.get("loja");
  if (daUrl) return daUrl;

  try {
    const doc = await db.collection("config").doc("lojaAtiva").get();
    if (doc.exists && doc.data().lojaId) return doc.data().lojaId;
  } catch (e) {
    console.warn("Não foi possível buscar a loja ativa automaticamente:", e);
  }

  if (window.STORE_ID && window.STORE_ID !== "COLE_AQUI_O_ID_DA_LOJA") return window.STORE_ID;
  return null;
}

// Toca um beep curto de notificação usando o próprio navegador (sem precisar
// de nenhum arquivo de som externo)
function tocarBeepNotificacao() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    // um segundo "bip" logo em seguida
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.value = 1100;
      gain2.gain.setValueAtTime(0.001, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.35);
    }, 220);
  } catch (e) {
    console.warn("Não foi possível tocar o som de notificação:", e);
  }
}

// Toca um tom simples e curto (usado para montar os diferentes avisos sonoros)
function tocarTom(ctx, frequencia, inicioSeg, duracaoSeg) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = frequencia;
  const t0 = ctx.currentTime + inicioSeg;
  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duracaoSeg);
  osc.start(t0);
  osc.stop(t0 + duracaoSeg + 0.05);
}

function novoAudioContext() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn("Não foi possível criar o áudio:", e);
    return null;
  }
}

// Alarme repetido: pedido chegou e está esperando alguém aceitar
function tocarSomAguardando() {
  const ctx = novoAudioContext();
  if (!ctx) return;
  tocarTom(ctx, 880, 0, 0.3);
  tocarTom(ctx, 1100, 0.22, 0.3);
}

// Pedido aceito, passou de "andamento" para "em preparo"
function tocarSomPreparo() {
  const ctx = novoAudioContext();
  if (!ctx) return;
  tocarTom(ctx, 600, 0, 0.25);
  tocarTom(ctx, 750, 0.2, 0.25);
}

// Pedido ficou pronto
function tocarSomPronto() {
  const ctx = novoAudioContext();
  if (!ctx) return;
  tocarTom(ctx, 1000, 0, 0.18);
  tocarTom(ctx, 1300, 0.16, 0.18);
  tocarTom(ctx, 1600, 0.32, 0.25);
}

// Pedido ficou em atraso (alerta, tom mais grave e repetido)
function tocarSomAtraso() {
  const ctx = novoAudioContext();
  if (!ctx) return;
  tocarTom(ctx, 400, 0, 0.2);
  tocarTom(ctx, 400, 0.28, 0.2);
  tocarTom(ctx, 400, 0.56, 0.2);
}

// Cliente pediu uma previsão de +5 minutos
function tocarSomPrevisao() {
  const ctx = novoAudioContext();
  if (!ctx) return;
  tocarTom(ctx, 700, 0, 0.2);
  tocarTom(ctx, 900, 0.18, 0.2);
}

// Cliente cancelou o pedido
function tocarSomCancelado() {
  const ctx = novoAudioContext();
  if (!ctx) return;
  tocarTom(ctx, 350, 0, 0.3);
  tocarTom(ctx, 300, 0.28, 0.35);
}

// Chegou uma mensagem nova no chat
function tocarSomMensagem() {
  const ctx = novoAudioContext();
  if (!ctx) return;
  tocarTom(ctx, 950, 0, 0.15);
  tocarTom(ctx, 750, 0.13, 0.15);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
