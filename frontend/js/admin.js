const usuario = getUsuario();
if (!usuario || (usuario.tipo !== 'doador' && usuario.tipo !== 'admin')) {
  window.location.href = 'login.html';
}

document.querySelectorAll('.abas button').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.abas button').forEach((b) => b.classList.remove('ativa'));
    botao.classList.add('ativa');
    const aba = botao.dataset.aba;
    document.getElementById('painel-itens').style.display = aba === 'itens' ? 'block' : 'none';
    document.getElementById('painel-solicitacoes').style.display = aba === 'solicitacoes' ? 'block' : 'none';
  });
});

async function carregarMeusItens() {
  const container = document.getElementById('painel-itens');
  try {
    const rota = usuario.tipo === 'admin' ? '/itens?status=disponivel' : '/itens/meus/doados';
    const itens = usuario.tipo === 'admin' ? await api('/itens') : await api('/itens/meus/doados');
    if (itens.length === 0) {
      container.innerHTML = '<p class="vazio">Nenhum item cadastrado ainda. <a href="doar.html">Cadastre o primeiro</a>.</p>';
      return;
    }
    container.innerHTML = `
      <table class="tabela">
        <thead><tr><th>Item</th><th>Categoria</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
          ${itens.map(i => `
            <tr>
              <td>${i.nome}</td>
              <td>${i.categoria}</td>
              <td><span class="badge ${i.status}">${i.status}</span></td>
              <td>
                ${i.status !== 'entregue' && i.status !== 'cancelado' ? `
                  <button class="btn secundario" onclick="mudarStatusItem(${i.id}, 'cancelado')">Cancelar</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = `<p class="vazio">Erro: ${e.message}</p>`;
  }
}

async function mudarStatusItem(id, status) {
  const area = document.getElementById('mensagem-area');
  try {
    await api(`/itens/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    area.innerHTML = '<div class="mensagem sucesso">Item atualizado.</div>';
    carregarMeusItens();
  } catch (e) {
    area.innerHTML = `<div class="mensagem erro">${e.message}</div>`;
  }
}

async function carregarSolicitacoes() {
  const container = document.getElementById('painel-solicitacoes');
  try {
    const lista = await api('/solicitacoes');
    if (lista.length === 0) {
      container.innerHTML = '<p class="vazio">Nenhuma solicitação recebida ainda.</p>';
      return;
    }
    container.innerHTML = `
      <table class="tabela">
        <thead><tr><th>Item</th><th>Beneficiário</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
          ${lista.map(s => `
            <tr>
              <td>${s.item_nome}</td>
              <td>${s.beneficiario_nome}</td>
              <td><span class="badge ${s.status}">${s.status}</span></td>
              <td>
                ${s.status === 'pendente' ? `
                  <button class="btn" onclick="mudarStatusSolicitacao(${s.id}, 'aprovada')">Aprovar</button>
                  <button class="btn secundario" onclick="mudarStatusSolicitacao(${s.id}, 'recusada')">Recusar</button>
                ` : ''}
                ${s.status === 'aprovada' ? `
                  <button class="btn" onclick="mudarStatusSolicitacao(${s.id}, 'entregue')">Marcar entregue</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = `<p class="vazio">Erro: ${e.message}</p>`;
  }
}

async function mudarStatusSolicitacao(id, status) {
  const area = document.getElementById('mensagem-area');
  try {
    await api(`/solicitacoes/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    area.innerHTML = '<div class="mensagem sucesso">Solicitação atualizada.</div>';
    carregarSolicitacoes();
    carregarMeusItens();
  } catch (e) {
    area.innerHTML = `<div class="mensagem erro">${e.message}</div>`;
  }
}

carregarMeusItens();
carregarSolicitacoes();
