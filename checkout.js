/* O WhatsApp recebe a intenção de compra; a loja confirma reserva e pagamento. */
(() => {
  'use strict';
  const limits = { nome: 80, telefone: 15, endereco: 200, observacoes: 300 };
  const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  function validate(c) {
    const errors = {};
    if (clean(c.nome).length < 3 || c.nome.length > limits.nome) errors.nome = 'Informe seu nome, entre 3 e 80 caracteres.';
    if (!/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(c.telefone.replace(/\D/g, '')) || c.telefone.length > limits.telefone) errors.telefone = 'Informe DDD e telefone válido, com 10 ou 11 dígitos.';
    if (!['Retirada', 'Entrega'].includes(c.recebimento)) errors.recebimento = 'Escolha entrega ou retirada.';
    if (c.recebimento === 'Entrega' && (clean(c.endereco).length < 10 || c.endereco.length > limits.endereco)) errors.endereco = 'Informe rua, número, bairro, cidade e CEP (10 a 200 caracteres).';
    if (c.observacoes.length > limits.observacoes) errors.observacoes = 'Use até 300 caracteres nas observações.';
    return errors;
  }
  function message(items, c) {
    const total = items.reduce((sum, item) => sum + Math.round(item.preco * 100), 0) / 100;
    return ['Olá! Quero confirmar este pedido pelo site:', '', ...items.map((item, i) =>
      `${i + 1}. ${item.nome} [${item.id}]\nTam. ${item.tamanho || 'Único'}${item.cor ? ` · ${item.cor}` : ''} · 1 unidade · ${BRL(item.preco)}`),
      '', `Subtotal (${items.length} ${items.length === 1 ? 'peça' : 'peças'}): ${BRL(total)}`,
      'Frete: a combinar; não incluído no subtotal.', '', `Nome: ${clean(c.nome)}`,
      `Telefone: ${clean(c.telefone)}`, `Recebimento: ${c.recebimento}`,
      c.recebimento === 'Entrega' ? `Endereço: ${clean(c.endereco)}` : 'Retirada: local e horário a combinar.',
      c.observacoes ? `Observações: ${clean(c.observacoes)}` : '', '',
      'Pode confirmar a disponibilidade, o valor final e as formas de pagamento?'].join('\n');
  }
  window.Checkout = { validate, message, limits };
  window.CartBuildWhatsAppMessage = message;
  const esc = value => escapeHTML(value);
  function summary(items) {
    return items.map(item => `<article class="checkout-summary-item">
      ${BrechoImages.tag(item.foto, item.nome, { width: 70, height: 88 })}
      <div class="info"><a class="name" href="produto.html?id=${encodeURIComponent(item.id)}">${esc(item.nome)}</a>
      <p class="meta">Tam. ${esc(item.tamanho)} · ${esc(item.cor)}<br>1 peça única</p></div>
      <strong class="price">${BRL(item.preco)}</strong></article>`).join('');
  }
  async function init() {
    const container = document.getElementById('checkoutContent');
    if (!container) return;
    const id = getParam('item');
    let order = [];
    try {
      const result = await Cart.refresh();
      order = id ? result.products.filter(p => p.id === id && p.status === 'Disponível').map(Cart.normalize).filter(Boolean) : Cart.items.slice();
      if (!order.length) {
        container.innerHTML = `<div class="checkout-empty"><h2>${id ? 'Esta peça não está disponível' : 'Seu carrinho está vazio'}</h2><p>Explore o catálogo para encontrar seu próximo achado.</p><a class="btn-boutique" href="catalogo.html">Explorar peças</a></div>`;
        return;
      }
      render(result.removed.length ? 'Atualizamos o carrinho: peças indisponíveis foram removidas. Confira sua seleção.' : '');
    } catch {
      container.innerHTML = `<div class="checkout-empty"><h2>Não conseguimos carregar seu pedido</h2><p>Sua seleção continua salva. Confira sua conexão e tente novamente.</p><button type="button" class="btn-boutique" id="retryCheckout">Tentar novamente</button></div>`;
      document.getElementById('retryCheckout').addEventListener('click', init);
    }
    function render(notice) {
      const field = (name, label, min, placeholder = '', multiline = false) => `<div class="mb-3">
        <label class="form-label" for="ck-${name}">${label}${name === 'observacoes' ? ' (opcional)' : ' *'}</label>
        <${multiline ? 'textarea' : 'input'} class="form-control" id="ck-${name}" name="${name}" maxlength="${limits[name]}" minlength="${min}" ${name !== 'observacoes' && name !== 'endereco' ? 'required' : ''}
        ${name === 'telefone' ? 'type="tel" inputmode="tel" autocomplete="tel-national"' : name === 'nome' ? 'autocomplete="name"' : name === 'endereco' ? 'autocomplete="street-address"' : ''}
        aria-describedby="hint-${name} error-${name}" placeholder="${placeholder}" ${multiline ? 'rows="3"></textarea>' : '>'}
        <div class="field-hint" id="hint-${name}">${name === 'telefone' ? 'DDD + número brasileiro' : 'Caracteres'} <span data-counter="${name}">0/${limits[name]}</span></div>
        <div class="invalid-feedback" id="error-${name}"></div></div>`;
      container.innerHTML = `<ol class="checkout-steps" aria-label="Etapas da compra"><li>1. Escolha suas peças</li><li aria-current="step">2. Revise seu pedido</li><li>3. Combine no WhatsApp</li></ol>
        <div class="row g-4 g-lg-5"><div class="col-12 col-lg-6"><section class="checkout-box checkout-review">
        <p class="eyebrow">${id ? 'Só esta peça' : 'Seus achados'}</p><h2 class="h4">Uma nova história começa aqui.</h2>
        <p class="text-secondary small">${id ? 'As outras peças continuam no seu carrinho.' : 'Confira tamanhos e valores antes de continuar.'}</p>
        <div id="checkoutItemsList"></div><div class="checkout-totals"><div class="row-total"><span>Subtotal</span><strong id="orderTotal"></strong></div>
        <p class="small text-secondary mt-2">Frete a combinar com a loja.</p></div><button type="button" class="btn-outline-b w-100" data-cart-toggle>Editar carrinho</button></section></div>
        <div class="col-12 col-lg-6"><section class="checkout-box"><p class="eyebrow">Falta pouco</p><h2 class="h4">Como podemos te atender?</h2>
        <p class="small text-secondary">* Campos obrigatórios. Seus dados serão incluídos na mensagem do WhatsApp.</p>
        <form id="checkoutForm" novalidate>
        ${field('nome', 'Seu nome', 3, 'Como você se chama?')}${field('telefone', 'WhatsApp / telefone', 14, '(51) 99999-9999')}
        <div class="mb-3"><label class="form-label" for="ck-recebimento">Como prefere receber? *</label>
        <select class="form-select" id="ck-recebimento" name="recebimento" required aria-describedby="error-recebimento"><option value="">Escolha uma opção</option><option value="Retirada">Retirada a combinar</option><option value="Entrega">Entrega no endereço</option></select><div class="invalid-feedback" id="error-recebimento"></div></div>
        <div id="addressWrap" hidden>${field('endereco', 'Endereço completo', 10, 'Rua, número, bairro, cidade e CEP', true)}</div>
        ${field('observacoes', 'Observações', 0, 'Alguma informação para a Sassá?', true)}
        <p id="checkoutStatus" role="status" class="checkout-status">${esc(notice)}</p>
        <button class="btn-boutique btn-whats w-100" type="submit" id="ckSubmit">Continuar no WhatsApp →</button>
        <a id="whatsappRetry" class="btn-outline-b w-100 mt-2 text-center" hidden target="_blank" rel="noopener noreferrer">Abrir mensagem novamente</a>
        <p class="checkout-note mt-3">Você revisa e envia a mensagem no WhatsApp. A loja confirma disponibilidade, frete e pagamento. Seu carrinho fica salvo até você removê-lo.</p></form></section></div></div>`;
      const form = document.getElementById('checkoutForm');
      const status = document.getElementById('checkoutStatus');
      const button = document.getElementById('ckSubmit');
      const retry = document.getElementById('whatsappRetry');
      const paintOrder = () => {
        document.getElementById('checkoutItemsList').innerHTML = summary(order);
        document.getElementById('orderTotal').textContent = BRL(order.reduce((sum, item) => sum + Math.round(item.preco * 100), 0) / 100);
        button.disabled = !order.length;
      };
      paintOrder();
      const customer = () => Object.fromEntries(new FormData(form));
      const showErrors = errors => {
        [...form.elements].filter(el => el.name).forEach(el => {
          el.classList.toggle('is-invalid', !!errors[el.name]);
          el.setAttribute('aria-invalid', String(!!errors[el.name]));
          document.getElementById(`error-${el.name}`).textContent = errors[el.name] || '';
        });
      };
      form.addEventListener('input', event => {
        retry.hidden = true;
        const input = event.target;
        if (input.name === 'telefone') {
          const digits = input.value.replace(/\D/g, '').slice(0, 11);
          const split = digits.length > 10 ? 7 : 6;
          input.value = digits.length > 2 ? `(${digits.slice(0, 2)}) ${digits.slice(2, split)}${digits.length > split ? '-' + digits.slice(split) : ''}` : digits;
        }
        if (limits[input.name]) {
          input.value = input.value.slice(0, limits[input.name]);
          form.querySelector(`[data-counter="${input.name}"]`).textContent = `${input.value.length}/${limits[input.name]}`;
        }
        if (form.dataset.validated) showErrors(validate(customer()));
      });
      form.elements.recebimento.addEventListener('change', () => {
        const delivery = form.elements.recebimento.value === 'Entrega';
        document.getElementById('addressWrap').hidden = !delivery;
        form.elements.endereco.required = delivery;
        retry.hidden = true;
        if (form.dataset.validated) showErrors(validate(customer()));
      });
      let busy = false;
      document.addEventListener('cart:updated', () => {
        retry.hidden = true;
        if (!id && !busy) { order = Cart.items.slice(); paintOrder(); status.textContent = order.length ? 'Seleção atualizada. Confira os valores.' : 'Seu carrinho está vazio. Adicione peças para continuar.'; }
      });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy) return;
        form.dataset.validated = 'true';
        const errors = validate(customer());
        showErrors(errors);
        if (Object.keys(errors).length) { form.querySelector('.is-invalid').focus(); return; }
        busy = true;
        button.disabled = true;
        button.textContent = 'Conferindo suas peças…';
        retry.hidden = true;
        try {
          const result = await Cart.refresh();
          const latest = id ? result.products.filter(p => p.id === id && p.status === 'Disponível').map(Cart.normalize).filter(Boolean) : Cart.items.slice();
          const changed = JSON.stringify(order) !== JSON.stringify(latest);
          order = latest;
          paintOrder();
          if (!order.length) { status.textContent = 'As peças selecionadas não estão mais disponíveis. Explore o catálogo para escolher outras.'; return; }
          if (changed) { status.textContent = 'A disponibilidade ou os valores mudaram. Confira o resumo atualizado e clique novamente para continuar.'; return; }
          const data = customer();
          const currentErrors = validate(data);
          showErrors(currentErrors);
          if (Object.keys(currentErrors).length) { form.querySelector('.is-invalid').focus(); return; }
          const url = whatsappLink(message(order, data));
          retry.href = url;
          retry.hidden = false;
          status.textContent = 'Mensagem pronta. Envie no WhatsApp para combinar o pagamento. Se a janela não abrir, use o botão abaixo.';
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch { status.textContent = 'Não conseguimos conferir a disponibilidade. Seus dados continuam aqui. Tente novamente.'; }
        finally { busy = false; button.disabled = !order.length; button.textContent = 'Continuar no WhatsApp →'; }
      });
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
