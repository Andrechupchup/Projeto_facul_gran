const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('doaciclo_token');
}

function getUsuario() {
  const dado = localStorage.getItem('doaciclo_usuario');
  return dado ? JSON.parse(dado) : null;
}

function salvarSessao(token, usuario) {
  localStorage.setItem('doaciclo_token', token);
  localStorage.setItem('doaciclo_usuario', JSON.stringify(usuario));
}

function encerrarSessao() {
  localStorage.removeItem('doaciclo_token');
  localStorage.removeItem('doaciclo_usuario');
}

async function api(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${API_BASE}${caminho}`, { ...opcoes, headers });
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro inesperado ao comunicar com o servidor');
  }
  return dados;
}

function montarCabecalho() {
  const usuario = getUsuario();
  const nav = document.getElementById('nav-usuario');
  if (!nav) return;

  if (!usuario) {
    nav.innerHTML = `
      <a href="login.html">Entrar</a>
      <a href="cadastro.html">Cadastrar</a>
    `;
    return;
  }

  let links = `<span>Ola, ${usuario.nome} (${usuario.tipo})</span>`;
  if (usuario.tipo === 'doador') links += `<a href="doar.html">Doar item</a>`;
  if (usuario.tipo === 'admin' || usuario.tipo === 'doador') links += `<a href="admin.html">Painel</a>`;
  if (usuario.tipo === 'beneficiario') links += `<a href="minhas-solicitacoes.html">Minhas solicitacoes</a>`;
  links += `<button id="btn-sair">Sair</button>`;

  nav.innerHTML = links;
  const btnSair = document.getElementById('btn-sair');
  if (btnSair) {
    btnSair.addEventListener('click', () => {
      encerrarSessao();
      window.location.href = 'index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', montarCabecalho);
