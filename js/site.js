/* ==========================================================================
   LÓGICA DO SITE DO CLIENTE (o águia)
   ========================================================================== */

(async function iniciarSite() {

  const storeId = await resolverStoreIdAtivo();

  if (!storeId) {
    document.getElementById("siteLista").innerHTML =
      '<p class="vazio-msg">Esta loja ainda não foi configurada. Peça o link correto ao vendedor.</p>';
    return;
  }

  // Se a loja ativa mudou desde a última vez que esse navegador acessou
  // (por exemplo, o dono saiu da conta no painel e criou uma loja nova),
  // a conta do cliente que estava salva aqui pertencia à loja ANTIGA e não
  // vale mais — então ela é apagada automaticamente e o cliente precisa
  // criar uma conta nova para a loja atual.
  const storeIdAnterior = localStorage.getItem("loja_id_atual_site");
  if (storeIdAnterior && storeIdAnterior !== storeId) {
    localStorage.removeItem("cliente_id");
    localStorage.removeItem("cliente_nome");
    localStorage.removeItem("cliente_endereco");
  }
  localStorage.setItem("loja_id_atual_site", storeId);
  localStorage.setItem("loja_id", storeId);

  const clienteId = localStorage.getItem("cliente_id");
  if (!clienteId) {
    window.location.href = "cadastro.html";
    return;
  }

  const lojaRef = db.collection("lojas").doc(storeId);
  const clienteRef = lojaRef.collection("clientes").doc(clienteId);

  /* ---------------- DADOS DA LOJA (nome, foto, aberta/fechada) ---------------- */
  let lojaEstaAberta = false;

  lojaRef.onSnapshot(doc => {
    if (!doc.exists) return;
    const loja = doc.data();
    document.getElementById("nomeLojaSite").textContent = loja.nomeLoja;
    document.title = loja.nomeLoja + " — o águia";

    const avatar = document.getElementById("avatarLojaSite");
    avatar.style.backgroundImage = loja.foto ? `url('${loja.foto}')` : "none";

    lojaEstaAberta = !!loja.aberta;
    const tag = document.getElementById("statusLojaTag");
    if (loja.aberta) {
      tag.textContent = "loja aberta";
      tag.className = "status-loja-tag aberta";
    } else {
      tag.textContent = "loja fechada";
      tag.className = "status-loja-tag fechada";
    }
  });

  /* ---------------- CARDÁPIO ---------------- */
  let produtosCache = {}; // id -> dados do produto (usado pelo modal e pelo carrinho)

  lojaRef.collection("produtos").orderBy("criadoEm", "desc").onSnapshot(snap => {
    const lista = document.getElementById("siteLista");
    lista.innerHTML = "";
    produtosCache = {};
    if (snap.empty) {
      lista.innerHTML = '<p class="vazio-msg">nenhum lanche disponível no momento.</p>';
      return;
    }
    snap.forEach(doc => {
      const p = doc.data();
      produtosCache[doc.id] = p;
      const card = document.createElement("div");
      card.className = "produto-card";
      card.innerHTML = `
        <div class="bolinha-foto" style="background-image:url('${p.foto || ""}')"></div>
        <div class="produto-info">
          <div class="nome">${escapeHtml(p.nome)}</div>
          <div class="desc">${escapeHtml(p.descricao || "")}</div>
          <div class="valor">${formatarValor(p.valor)}</div>
        </div>
        <button class="btn-comprar" data-id="${doc.id}">adicionar</button>
      `;
      card.querySelector(".btn-comprar").addEventListener("click", () => abrirModalProduto(doc.id));
      lista.appendChild(card);
    });
  });

  /* ==========================================================================
     MODAL DE PRODUTO (escolher quantidade e adicionar ao carrinho)
     ========================================================================== */
  let produtoModalId = null;
  let produtoModalQtd = 1;

  function abrirModalProduto(produtoId) {
    const p = produtosCache[produtoId];
    if (!p) return;
    produtoModalId = produtoId;
    produtoModalQtd = 1;

    document.getElementById("modalProdutoNome").textContent = p.nome;
    document.getElementById("modalProdutoFoto").style.backgroundImage = p.foto ? `url('${p.foto}')` : "none";
    document.getElementById("modalProdutoDesc").textContent = p.descricao || "";
    document.getElementById("modalProdutoValor").textContent = formatarValor(p.valor);
    document.getElementById("modalQtdValor").textContent = "1";

    document.getElementById("modalProdutoOverlay").classList.add("aberto");
  }

  document.getElementById("modalProdutoFechar").addEventListener("click", () => {
    document.getElementById("modalProdutoOverlay").classList.remove("aberto");
  });
  document.getElementById("modalQtdMenos").addEventListener("click", () => {
    produtoModalQtd = Math.max(1, produtoModalQtd - 1);
    document.getElementById("modalQtdValor").textContent = produtoModalQtd;
  });
  document.getElementById("modalQtdMais").addEventListener("click", () => {
    produtoModalQtd = Math.min(20, produtoModalQtd + 1);
    document.getElementById("modalQtdValor").textContent = produtoModalQtd;
  });

  document.getElementById("modalAdicionarBtn").addEventListener("click", () => {
    if (!produtoModalId) return;
    adicionarAoCarrinho(produtoModalId, produtoModalQtd);
    document.getElementById("modalProdutoOverlay").classList.remove("aberto");
  });

  /* ==========================================================================
     CARRINHO
     ========================================================================== */
  let carrinho = []; // [{produtoId, nome, valor, qtd}]

  function adicionarAoCarrinho(produtoId, qtd) {
    const p = produtosCache[produtoId];
    if (!p) return;
    const existente = carrinho.find(i => i.produtoId === produtoId);
    if (existente) existente.qtd += qtd;
    else carrinho.push({ produtoId, nome: p.nome, valor: p.valor, qtd });
    atualizarBadgeCarrinho();
  }

  function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(i => i.produtoId !== produtoId);
    atualizarBadgeCarrinho();
    renderizarCarrinho();
  }

  function atualizarBadgeCarrinho() {
    const totalItens = carrinho.reduce((soma, i) => soma + i.qtd, 0);
    const badge = document.getElementById("carrinhoBadge");
    if (totalItens > 0) {
      badge.textContent = totalItens;
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }
  }

  function renderizarCarrinho() {
    const container = document.getElementById("carrinhoListaItens");
    container.innerHTML = "";
    let total = 0;

    if (carrinho.length === 0) {
      container.innerHTML = '<p class="vazio-msg">seu carrinho está vazio.</p>';
    }

    carrinho.forEach(item => {
      total += item.valor * item.qtd;
      const div = document.createElement("div");
      div.className = "carrinho-item";
      div.innerHTML = `
        <span>${item.qtd}x ${escapeHtml(item.nome)} — ${formatarValor(item.valor * item.qtd)}</span>
        <button class="remover" data-id="${item.produtoId}">remover</button>
      `;
      div.querySelector(".remover").addEventListener("click", () => removerDoCarrinho(item.produtoId));
      container.appendChild(div);
    });

    document.getElementById("carrinhoTotal").textContent = "Total: " + formatarValor(total);
  }

  document.getElementById("carrinhoToggleBtn").addEventListener("click", () => {
    renderizarCarrinho();
    document.getElementById("modalCarrinhoOverlay").classList.add("aberto");
  });
  document.getElementById("modalCarrinhoFechar").addEventListener("click", () => {
    document.getElementById("modalCarrinhoOverlay").classList.remove("aberto");
  });

  document.getElementById("btnFinalizarCompra").addEventListener("click", async () => {
    if (!lojaEstaAberta) {
      document.getElementById("modalCarrinhoOverlay").classList.remove("aberto");
      document.getElementById("modalLojaFechadaOverlay").classList.add("aberto");
      return;
    }

    if (carrinho.length === 0) {
      alert("seu carrinho está vazio. Adicione pelo menos um item.");
      return;
    }

    const observacao = document.getElementById("carrinhoObservacao").value.trim();
    const formaPagamento = document.getElementById("carrinhoPagamento").value;

    const clienteSnap = await clienteRef.get();
    const cliente = clienteSnap.data() || {};

    const itensPedido = carrinho.map(i => ({
      nome: `${i.qtd}x ${i.nome}`,
      valor: i.valor * i.qtd,
      foto: (produtosCache[i.produtoId] && produtosCache[i.produtoId].foto) || ""
    }));

    await lojaRef.collection("pedidos").add({
      clienteId,
      clienteNome: cliente.nome || "cliente",
      endereco: cliente.endereco || "",
      itens: itensPedido,
      observacao,
      formaPagamento,
      aceito: false,
      saiu: false,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    await clienteRef.update({ ultimaMensagemEm: firebase.firestore.FieldValue.serverTimestamp() });

    const resumoItens = carrinho.map(i => `${i.qtd}x ${i.nome}`).join(", ");
    const totalPedido = carrinho.reduce((soma, i) => soma + i.valor * i.qtd, 0);

    carrinho = [];
    atualizarBadgeCarrinho();
    document.getElementById("carrinhoObservacao").value = "";
    document.getElementById("modalCarrinhoOverlay").classList.remove("aberto");

    abrirChat();
    let mensagem = `Pedido feito: ${resumoItens} — total ${formatarValor(totalPedido)} — pagamento: ${formaPagamento}`;
    if (observacao) mensagem += ` — obs: ${observacao}`;
    await enviarMensagemAutomatica(mensagem);
  });

  document.getElementById("modalLojaFechadaFechar").addEventListener("click", () => {
    document.getElementById("modalLojaFechadaOverlay").classList.remove("aberto");
  });
  document.getElementById("btnLojaFechadaOk").addEventListener("click", () => {
    document.getElementById("modalLojaFechadaOverlay").classList.remove("aberto");
  });

  /* ==========================================================================
     VER PEDIDO (acompanhar o(s) pedido(s), pedir previsão, cancelar)
     ========================================================================== */
  let meusPedidosAtivos = []; // [{id, ...dados}] todos os pedidos ativos do cliente
  let intervalosContadorModal = []; // um intervalo de contagem por pedido aberto no modal

  lojaRef.collection("pedidos").where("clienteId", "==", clienteId)
    .orderBy("criadoEm", "desc")
    .onSnapshot(snap => {
      meusPedidosAtivos = [];
      snap.forEach(doc => {
        const p = doc.data();
        if (!p.saiu && !p.cancelado) meusPedidosAtivos.push({ id: doc.id, ...p });
      });

      document.getElementById("verPedidoWrap").style.display = meusPedidosAtivos.length > 0 ? "flex" : "none";

      if (document.getElementById("modalPedidoOverlay").classList.contains("aberto")) {
        renderizarListaPedidosModal();
      }
    });

  function limparIntervalosContador() {
    intervalosContadorModal.forEach(id => clearInterval(id));
    intervalosContadorModal = [];
  }

  function renderizarListaPedidosModal() {
    limparIntervalosContador();
    const container = document.getElementById("pedidoModalLista");
    container.innerHTML = "";

    if (meusPedidosAtivos.length === 0) {
      container.innerHTML = '<p class="vazio-msg">você não tem pedidos em andamento.</p>';
      return;
    }

    document.getElementById("pedidoModalCliente").textContent = meusPedidosAtivos[0].clienteNome || "cliente";

    meusPedidosAtivos.forEach((p, index) => {
      const itensTexto = (p.itens || []).map(i => i.nome).join(", ");
      const total = (p.itens || []).reduce((soma, i) => soma + (parseFloat(i.valor) || 0), 0);
      const primeiraFoto = (p.itens || []).find(i => i.foto)?.foto || "";

      const bloco = document.createElement("div");
      bloco.className = "pedido-item-modal";
      bloco.innerHTML = `
        <h2>pedido ${index + 1}</h2>
        <div class="pedido-modal-linha">
          <div class="produto-modal-foto" style="${primeiraFoto ? `background-image:url('${primeiraFoto}')` : ""}">${primeiraFoto ? "" : "foto do lanche"}</div>
          <div>
            <p>${escapeHtml(itensTexto)} — pagamento: ${escapeHtml(p.formaPagamento || "não informado")}</p>
            ${p.observacao ? `<p class="pedido-modal-obs">observação: ${escapeHtml(p.observacao)}</p>` : ""}
          </div>
        </div>
        <p class="pedido-modal-valor">valor ${formatarValor(total)}</p>
        <p class="pedido-modal-previsao" style="display:none"></p>
        <div class="pedido-item-botoes">
          <button class="btn-previsao-mini" data-id="${p.id}">enviar previsão</button>
          <button class="btn-cancelar-mini" data-id="${p.id}">cancelar</button>
        </div>
      `;

      bloco.querySelector(".btn-previsao-mini").addEventListener("click", async (e) => {
        e.target.disabled = true;
        await lojaRef.collection("pedidos").doc(p.id).update({
          previsaoSolicitadaEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`Previsão de +5 minutos enviada para o pedido ${index + 1}!`);
        e.target.disabled = false;
      });

      bloco.querySelector(".btn-cancelar-mini").addEventListener("click", async (e) => {
        if (!confirm(`Cancelar o pedido ${index + 1}?`)) return;
        await lojaRef.collection("pedidos").doc(p.id).update({
          cancelado: true,
          canceladoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
      });

      const previsaoBox = bloco.querySelector(".pedido-modal-previsao");
      if (p.previsaoSolicitadaEm && p.previsaoSolicitadaEm.toDate) {
        const alvoMs = p.previsaoSolicitadaEm.toDate().getTime() + 5 * 60000;
        const atualizar = () => {
          const restanteMs = alvoMs - Date.now();
          if (restanteMs <= 0) {
            previsaoBox.textContent = "previsão: a loja já foi avisada";
            return;
          }
          const min = Math.floor(restanteMs / 60000);
          const seg = Math.floor((restanteMs % 60000) / 1000);
          previsaoBox.textContent = `previsão enviada — mais ${min}:${String(seg).padStart(2, "0")}`;
        };
        previsaoBox.style.display = "block";
        atualizar();
        intervalosContadorModal.push(setInterval(atualizar, 1000));
      }

      container.appendChild(bloco);
    });
  }

  document.getElementById("verPedidoBtn").addEventListener("click", () => {
    renderizarListaPedidosModal();
    document.getElementById("modalPedidoOverlay").classList.add("aberto");
  });
  document.getElementById("pedidoModalFechar").addEventListener("click", () => {
    document.getElementById("modalPedidoOverlay").classList.remove("aberto");
    limparIntervalosContador();
  });

  /* ==========================================================================
     CONFIGURAÇÃO (sair da conta)
     ========================================================================== */
  document.getElementById("siteConfigBtn").addEventListener("click", () => {
    document.getElementById("modalConfigOverlay").classList.add("aberto");
  });
  document.getElementById("modalConfigFechar").addEventListener("click", () => {
    document.getElementById("modalConfigOverlay").classList.remove("aberto");
  });
  document.getElementById("btnSairContaCliente").addEventListener("click", () => {
    if (!confirm("Tem certeza que deseja sair da conta?")) return;
    localStorage.removeItem("cliente_id");
    localStorage.removeItem("cliente_nome");
    localStorage.removeItem("cliente_endereco");
    window.location.href = "cadastro.html";
  });

  /* ==========================================================================
     CHAT
     ========================================================================== */
  const chatToggleBtn = document.getElementById("chatToggleBtn");
  const chatJanela = document.getElementById("chatJanela");

  function abrirChat() {
    chatJanela.classList.add("aberto");
  }
  chatToggleBtn.addEventListener("click", abrirChat);
  document.getElementById("chatFechar").addEventListener("click", () => {
    chatJanela.classList.remove("aberto");
  });

  let primeiraMensagemEnviada = false;

  clienteRef.collection("chat").orderBy("criadoEm", "asc").onSnapshot(snap => {
    const box = document.getElementById("chatMensagens");
    box.innerHTML = "";
    snap.forEach(doc => {
      const m = doc.data();
      const div = document.createElement("div");
      div.className = "msg " + (m.autor === "loja" ? "loja" : "cliente");
      div.textContent = m.texto;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
    if (!snap.empty) primeiraMensagemEnviada = true;
  });

  async function enviarMensagemAutomatica(texto) {
    const jaTemMensagens = primeiraMensagemEnviada;

    await clienteRef.collection("chat").add({
      autor: "cliente",
      texto,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (!jaTemMensagens) {
      const cliente = (await clienteRef.get()).data() || {};
      if (cliente.endereco) {
        await clienteRef.collection("chat").add({
          autor: "cliente",
          texto: `📍 endereço de entrega: ${cliente.endereco}`,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    primeiraMensagemEnviada = true;
  }

  function enviarMensagemCliente() {
    const input = document.getElementById("chatInput");
    const texto = input.value.trim();
    if (!texto) return;
    enviarMensagemAutomatica(texto);
    clienteRef.update({ ultimaMensagemEm: firebase.firestore.FieldValue.serverTimestamp() });
    input.value = "";
  }
  document.getElementById("chatEnviar").addEventListener("click", enviarMensagemCliente);
  document.getElementById("chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarMensagemCliente();
  });

})();
