const ICONE_CAIXA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>';
const ICONE_LOCAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';

const usuarioLogado = getUsuario();
let categoriaAtual = '';

function condicaoLegivel(c) {
  const mapa = {
    novo: 'Novo',
    seminovo: 'Seminovo',
    usado_funcional: 'Usado e funcional',
    peca_para_reparo: 'Peça para reparo',
  };
  return mapa[c] || c;
}

function mostrarMensagem(tipo, texto) {
  const area = document.getElementById('mensagem-area');
  area.innerHTML = `<div class="mensagem ${tipo}">${texto}</div>`;
  area.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function carregarEstatisticas() {
  try {
    const stats = await api('/estatisticas');
    const cartoes = [
      [stats.itens_doados, 'itens cadastrados'],
      [stats.itens_entregues, 'itens entregues'],
      [stats.familias_atendidas, 'famílias atendidas'],
      [stats.doadores_ativos, 'doadores ativos'],
    ];
    document.getElementById('stats').innerHTML = cartoes.map(([valor, rotulo]) => `
      <div class="stat-card"><div class="valor">${valor}</div><div class="rotulo">${rotulo}</div></div>
    `).join('');
  } catch {
    return;
  }
}

async function carregarItens(categoria) {
  const grid = document.getElementById('grid-itens');
  grid.innerHTML = '<p class="vazio">Carregando itens disponíveis...</p>';
  try {
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    const itens = await api(`/itens${query}`);

    if (itens.length === 0) {
      grid.innerHTML = '<p class="vazio">Nenhum item disponível nesta categoria no momento.</p>';
      return;
    }

    grid.innerHTML = itens.map((item) => `
      <article class="card-item">
        <div class="foto">${item.foto_url ? `<img src="${item.foto_url}" alt="${item.nome}" loading="lazy">` : ICONE_CAIXA}</div>
        <div class="conteudo">
          <span class="categoria">${item.categoria}</span>
          <h3>${item.nome}</h3>
          <p class="descricao">${item.descricao || 'Sem descrição adicional.'}</p>
          <div class="rodape">
            <span class="badge neutro">${condicaoLegivel(item.condicao)}</span>
            ${item.doador_cidade ? `<span class="local">${ICONE_LOCAL}${item.doador_cidade}</span>` : ''}
          </div>
          <button class="btn" onclick="solicitarItem(${item.id})">Solicitar item</button>
        </div>
      </article>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<p class="vazio">Erro ao carregar itens: ${e.message}</p>`;
  }
}

async function solicitarItem(itemId) {
  if (!usuarioLogado) {
    window.location.href = 'login.html';
    return;
  }
  if (usuarioLogado.tipo !== 'beneficiario') {
    mostrarMensagem('erro', 'Apenas contas de beneficiário podem solicitar itens.');
    return;
  }

  try {
    await api('/solicitacoes', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    });
    mostrarMensagem('sucesso', 'Solicitação enviada! Acompanhe em <a href="minhas-solicitacoes.html">Minhas solicitações</a>.');
    carregarItens(categoriaAtual);
    carregarEstatisticas();
  } catch (e) {
    mostrarMensagem('erro', e.message);
  }
}

document.querySelectorAll('#filtros .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#filtros .chip').forEach((c) => c.classList.remove('ativo'));
    chip.classList.add('ativo');
    categoriaAtual = chip.dataset.categoria;
    carregarItens(categoriaAtual);
  });
});

if (usuarioLogado && (usuarioLogado.tipo === 'doador' || usuarioLogado.tipo === 'admin')) {
  document.getElementById('cta-doar').href = 'doar.html';
}

carregarEstatisticas();
carregarItens();
