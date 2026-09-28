function condicaoLegivel(c) {
  const mapa = {
    novo: 'Novo',
    seminovo: 'Seminovo',
    usado_funcional: 'Usado e funcional',
    peca_para_reparo: 'Peça para reparo',
  };
  return mapa[c] || c;
}

async function carregarEstatisticas() {
  try {
    const stats = await api('/estatisticas');
    const container = document.getElementById('stats');
    container.innerHTML = `
      <div class="stat-card"><div class="valor">${stats.itens_doados}</div><div class="rotulo">itens cadastrados</div></div>
      <div class="stat-card"><div class="valor">${stats.itens_entregues}</div><div class="rotulo">itens entregues</div></div>
      <div class="stat-card"><div class="valor">${stats.familias_atendidas}</div><div class="rotulo">famílias atendidas</div></div>
      <div class="stat-card"><div class="valor">${stats.doadores_ativos}</div><div class="rotulo">doadores ativos</div></div>
    `;
  } catch (e) {
    // estatisticas sao um extra; falha silenciosa nao deve travar a pagina
  }
}

async function carregarItens(categoria) {
  const grid = document.getElementById('grid-itens');
  grid.innerHTML = '<p class="vazio">Carregando itens disponíveis...</p>';
  try {
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    const itens = await api(`/itens${query}`);

    if (itens.length === 0) {
      grid.innerHTML = '<p class="vazio">Nenhum item disponível no momento.</p>';
      return;
    }

    grid.innerHTML = itens.map((item) => `
      <div class="card-item">
        <div class="foto">${item.foto_url ? `<img src="${item.foto_url}" alt="${item.nome}">` : 'Sem foto'}</div>
        <div class="conteudo">
          <span class="categoria">${item.categoria}</span>
          <h3>${item.nome}</h3>
          <p class="descricao">${item.descricao || 'Sem descrição adicional.'}</p>
          <div class="rodape">
            <span>${condicaoLegivel(item.condicao)}</span>
            <span>${item.doador_cidade || ''}</span>
          </div>
          <button class="btn" onclick="solicitarItem(${item.id})">Solicitar</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<p class="vazio">Erro ao carregar itens: ${e.message}</p>`;
  }
}

async function solicitarItem(itemId) {
  const usuario = getUsuario();
  const area = document.getElementById('mensagem-area');

  if (!usuario) {
    area.innerHTML = '<div class="mensagem erro">Você precisa entrar como beneficiário para solicitar um item.</div>';
    window.location.href = 'login.html';
    return;
  }
  if (usuario.tipo !== 'beneficiario') {
    area.innerHTML = '<div class="mensagem erro">Apenas contas de beneficiário podem solicitar itens.</div>';
    return;
  }

  try {
    await api('/solicitacoes', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    });
    area.innerHTML = '<div class="mensagem sucesso">Solicitação enviada! Acompanhe em "Minhas solicitações".</div>';
    carregarItens(document.getElementById('filtro-categoria').value);
  } catch (e) {
    area.innerHTML = `<div class="mensagem erro">${e.message}</div>`;
  }
}

document.getElementById('btn-filtrar').addEventListener('click', () => {
  carregarItens(document.getElementById('filtro-categoria').value);
});

carregarEstatisticas();
carregarItens();
