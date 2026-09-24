/* ============================================================
   checkout.js — Página checkout.html
   Dois modos:
   - checkout.html?item=ID   -> compra somente aquela peça
   - checkout.html           -> compra todo o carrinho
   Como o site é estático (sem backend/gateway de pagamento),
   a "finalização" monta o pedido completo (peças + dados do
   cliente) e abre o WhatsApp para a Sassá confirmar pagamento
   e entrega — o mesmo fluxo de reserva que a loja já usa hoje.
   ============================================================ */
(function () {
  const NAME_LIMIT = 100;
  const NOTES_LIMIT = 500;

  function cellphoneDigits(value) {
    let digits = value.replace(/\D/g, "");
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
    return digits.slice(0, 11);
  }

  function formatCellphone(value) {
    const digits = cellphoneDigits(value);
    if (!digits) return "";
    if (digits.length < 3) return `(${digits}`;
    const subscriber = digits.slice(2);
    const splitAt = subscriber.length > 8 ? 5 : 4;
    return `(${digits.slice(0, 2)}) ${subscriber.slice(0, splitAt)}${subscriber.length > splitAt ? "-" + subscriber.slice(splitAt) : ""}`;
  }

  async function resolveOrderItems() {
    const itemId = getParam("item");

    if (itemId) {
      // Compra de UM item só: busca o produto atualizado (garante status/preço corretos)
      // mesmo que o cliente tenha vindo direto da página da peça sem passar pelo carrinho.
      const products = await fetchJSON("data/products.json");
      const p = products.find((x) => x.id === itemId);
      if (!p) return { mode: "single", items: [], error: "not-found" };
      if (p.status !== "Disponível") return { mode: "single", items: [], error: "unavailable", product: p };
      return {
        mode: "single",
        items: [{ id: p.id, nome: p.nome, preco: p.preco, foto: p.fotos[0], tamanho: p.tamanho, cor: p.cor }],
      };
    }

    // Confere novamente os dados do catálogo antes de finalizar um carrinho salvo.
    const products = await fetchJSON("data/products.json");
    const byId = new Map(products.map((p) => [p.id, p]));
    const unavailable = Cart.items.filter((item) => byId.get(item.id)?.status !== "Disponível").map((item) => item.id);
    if (unavailable.length) Cart.removeMany(unavailable);
    const items = Cart.items.map((item) => {
      const p = byId.get(item.id);
      return { id: p.id, nome: p.nome, preco: p.preco, foto: p.fotos[0], tamanho: p.tamanho, cor: p.cor };
    });
    return { mode: "cart", items, removedCount: unavailable.length };
  }

  function summaryItemTemplate(item) {
    const metaBits = [];
    if (item.tamanho) metaBits.push(`Tam ${item.tamanho}`);
    if (item.cor) metaBits.push(item.cor);
    return `
    <div class="checkout-summary-item">
      <img src="${item.foto}" alt="${item.nome}" loading="lazy">
      <div class="info">
        <p class="name">${item.nome}</p>
        <p class="meta">${metaBits.join(" · ")}</p>
      </div>
      <div class="price">${BRL(item.preco)}</div>
    </div>`;
  }

  function renderEmpty(container, { title, text, ctaHref, ctaLabel }) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="eyebrow">Ops</p>
        <h3>${title}</h3>
        <p class="text-muted">${text}</p>
        <a class="btn-boutique mt-2" href="${ctaHref}">${ctaLabel}</a>
      </div>`;
  }

  function renderCheckout(container, order) {
    const total = order.items.reduce((s, i) => s + i.preco, 0);

    container.innerHTML = `
      ${order.removedCount ? `<div class="availability-note reserved mb-3" role="status">${order.removedCount === 1 ? "Uma peça" : `${order.removedCount} peças`} do carrinho não está mais disponível e foi removida do pedido.</div>` : ""}
      <div class="row g-4 g-lg-5">
        <div class="col-12 col-lg-7">
          <div class="checkout-box">
            <h2 class="h5 mb-3">Resumo do pedido</h2>
            <div id="checkoutItemsList">${order.items.map(summaryItemTemplate).join("")}</div>
            <div class="checkout-totals">
              <div class="row-line"><span>Frete</span><span>A combinar no WhatsApp</span></div>
              <div class="row-line"><span>Desconto</span><span>—</span></div>
              <div class="row-total"><span>Total</span><strong>${BRL(total)}</strong></div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-5">
          <div class="checkout-box">
            <h2 class="h5 mb-3">Seus dados</h2>
            <form id="checkoutForm" novalidate>
              <div class="mb-3">
                <label class="form-label" for="ckNome">Nome completo *</label>
                <input class="form-control" id="ckNome" name="nome" required autocomplete="name" maxlength="100" aria-describedby="ckNomeHint">
                <div id="ckNomeHint" class="form-text">Máximo de 100 caracteres.</div>
                <div class="invalid-feedback">Informe seu nome, com até 100 caracteres.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="ckTelefone">Telefone / WhatsApp *</label>
                <input class="form-control" id="ckTelefone" name="telefone" type="tel" inputmode="tel" required autocomplete="tel-national" maxlength="15" placeholder="(51) 99999-9999" aria-describedby="ckTelefoneHint">
                <div id="ckTelefoneHint" class="form-text">Informe 2 dígitos de DDD e um telefone com 8 ou 9 dígitos.</div>
                <div class="invalid-feedback">Informe um telefone completo com DDD.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="ckRecebimento">Como prefere receber? *</label>
                <select class="form-select" id="ckRecebimento" name="recebimento" required>
                  <option value="">Selecione…</option>
                  <option value="Retirada em loja">Retirada em loja</option>
                  <option value="Entrega">Entrega no endereço</option>
                </select>
                <div class="invalid-feedback">Selecione uma opção.</div>
              </div>
              <div class="mb-3 d-none" id="ckEnderecoWrap">
                <label class="form-label" for="ckEndereco">Endereço completo *</label>
                <textarea class="form-control" id="ckEndereco" name="endereco" rows="2" placeholder="Rua, número, bairro, cidade, CEP"></textarea>
                <div class="invalid-feedback">Informe o endereço de entrega.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="ckObs">Observações</label>
                <textarea class="form-control" id="ckObs" name="observacoes" rows="2" placeholder="Opcional" maxlength="500" aria-describedby="ckObsCount"></textarea>
                <div id="ckObsCount" class="form-text text-end">0 / 500 caracteres</div>
              </div>
              <button class="btn-boutique w-100" type="submit" id="ckSubmit">
                <i class="bi bi-whatsapp me-1"></i> Finalizar e confirmar no WhatsApp
              </button>
              <p class="checkout-note mt-3">
                <i class="bi bi-info-circle"></i>
                <span>O site ainda não processa pagamento online: ao confirmar, seu pedido completo é enviado para a Sassá pelo WhatsApp, que confirma disponibilidade, forma de pagamento e entrega/retirada com você.</span>
              </p>
            </form>
          </div>
        </div>
      </div>`;

    const recebimento = document.getElementById("ckRecebimento");
    const enderecoWrap = document.getElementById("ckEnderecoWrap");
    const enderecoInput = document.getElementById("ckEndereco");
    recebimento.addEventListener("change", () => {
      const precisaEndereco = recebimento.value === "Entrega";
      enderecoWrap.classList.toggle("d-none", !precisaEndereco);
      enderecoInput.required = precisaEndereco;
    });

    const form = document.getElementById("checkoutForm");
    const nameInput = document.getElementById("ckNome");
    const phoneInput = document.getElementById("ckTelefone");
    const notesInput = document.getElementById("ckObs");
    const notesCount = document.getElementById("ckObsCount");

    function validateName() {
      nameInput.setCustomValidity(!nameInput.value.trim() || nameInput.value.length > NAME_LIMIT
        ? "Informe seu nome, com até 100 caracteres." : "");
    }
    function validatePhone() {
      const digits = cellphoneDigits(phoneInput.value);
      phoneInput.setCustomValidity(/^[0-9]{10,11}$/.test(digits)
        ? "" : "Informe o DDD e o telefone, com 10 ou 11 dígitos no total.");
    }
    function updateNotes() {
      notesCount.textContent = `${notesInput.value.length} / ${NOTES_LIMIT} caracteres`;
      notesInput.setCustomValidity(notesInput.value.length > NOTES_LIMIT
        ? "As observações devem ter no máximo 500 caracteres." : "");
    }
    nameInput.addEventListener("input", validateName);
    notesInput.addEventListener("input", updateNotes);
    phoneInput.addEventListener("input", () => {
      const caretDigits = phoneInput.value.slice(0, phoneInput.selectionStart).replace(/\D/g, "").length;
      phoneInput.value = formatCellphone(phoneInput.value);
      let caret = 0, count = 0;
      while (caret < phoneInput.value.length && count < caretDigits) {
        if (/\d/.test(phoneInput.value[caret])) count++;
        caret++;
      }
      phoneInput.setSelectionRange(caret, caret);
      validatePhone();
    });
    phoneInput.addEventListener("paste", (event) => {
      const pasted = event.clipboardData?.getData("text");
      if (!pasted) return;
      event.preventDefault();
      const start = phoneInput.selectionStart;
      const end = phoneInput.selectionEnd;
      const value = phoneInput.value.slice(0, start) + pasted + phoneInput.value.slice(end);
      phoneInput.value = formatCellphone(value);
      validatePhone();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      nameInput.value = nameInput.value.trim();
      phoneInput.value = formatCellphone(phoneInput.value);
      validateName();
      validatePhone();
      updateNotes();
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        form.querySelector(":invalid")?.focus();
        return;
      }
      const data = new FormData(form);
      const cliente = {
        nome: data.get("nome")?.toString().trim(),
        telefone: data.get("telefone")?.toString().trim(),
        endereco: data.get("recebimento") === "Entrega" ? data.get("endereco")?.toString().trim() : "Retirada em loja",
        observacoes: data.get("observacoes")?.toString().trim(),
      };

      const msg = CartBuildWhatsAppMessage(order.items, cliente);
      window.open(whatsappLink(msg), "_blank", "noopener");

      // Remove do carrinho só o que foi comprado (item único ou carrinho inteiro)
      if (order.mode === "single") {
        Cart.remove(order.items[0].id);
      } else {
        Cart.clear();
      }

      container.innerHTML = `
        <div class="checkout-success">
          <i class="bi bi-check-circle"></i>
          <h2 class="mt-3">Pedido enviado!</h2>
          <p class="text-muted">Abrimos o WhatsApp com o resumo do seu pedido. Finalize por lá a confirmação de pagamento e entrega.</p>
          <a class="btn-boutique mt-2" href="catalogo.html">Continuar garimpando</a>
        </div>`;
    });
  }

  async function init() {
    const container = document.getElementById("checkoutContent");
    if (!container) return;
    const order = await resolveOrderItems();

    if (order.error === "not-found") {
      renderEmpty(container, {
        title: "Peça não encontrada",
        text: "Essa peça pode não existir mais.",
        ctaHref: "catalogo.html", ctaLabel: "Ver catálogo",
      });
      return;
    }
    if (order.error === "unavailable") {
      renderEmpty(container, {
        title: `"${order.product.nome}" não está mais disponível`,
        text: "Essa peça já foi reservada ou vendida.",
        ctaHref: "catalogo.html", ctaLabel: "Ver outras peças",
      });
      return;
    }
    if (!order.items.length) {
      renderEmpty(container, {
        title: "Seu carrinho está vazio",
        text: "Adicione peças ao carrinho antes de finalizar o pedido.",
        ctaHref: "catalogo.html", ctaLabel: "Ver catálogo",
      });
      return;
    }
    renderCheckout(container, order);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
