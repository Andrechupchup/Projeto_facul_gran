/**
 * Teste de integracao do fluxo completo do DoaCiclo.
 *
 * Sobe a API real (server.js) usando pg-mem no lugar de um Postgres de
 * verdade (nao precisa de banco de dados instalado para rodar), executa o
 * schema.sql tal como ele e usado em producao, e simula o fluxo:
 *   cadastro -> login -> doador publica item -> beneficiario solicita ->
 *   doador aprova -> doador marca como entregue -> estatisticas atualizadas.
 *
 * Rodar com: npm test
 */
const path = require('path');
const fs = require('fs');
const Module = require('module');
const { newDb } = require('pg-mem');

const RAIZ_BACKEND = path.join(__dirname, '..');
const schemaSql = fs.readFileSync(path.join(RAIZ_BACKEND, 'src/schema.sql'), 'utf8');

const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: 'now', returns: 'timestamp', implementation: () => new Date() });
mem.public.none(schemaSql);

const pgAdapter = mem.adapters.createPg();

// Substitui o modulo 'pg' pelo adaptador em memoria antes do server.js ser carregado.
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'pg') return pgAdapter;
  return originalLoad.apply(this, arguments);
};

process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '4123';

require(path.join(RAIZ_BACKEND, 'src/server.js'));

const BASE_URL = 'http://localhost:4123';
let falhas = 0;

function checar(label, ok, extra) {
  console.log(`${ok ? 'OK  ' : 'FALHOU'} - ${label}${extra ? ' :: ' + JSON.stringify(extra) : ''}`);
  if (!ok) falhas += 1;
}

async function main() {
  await new Promise((r) => setTimeout(r, 500));

  let r = await fetch(`${BASE_URL}/api/health`);
  checar('health check', r.ok, await r.json());

  r = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@doaciclo.org', senha: 'admin123' }),
  });
  const adminLogin = await r.json();
  checar('login do admin semeado no schema.sql (admin123)', r.ok && !!adminLogin.token);

  r = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Empresa Doadora', email: 'doador@teste.com', senha: '123456', tipo: 'doador', cidade: 'Maringa' }),
  });
  checar('registro de doador', r.status === 201);

  r = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doador@teste.com', senha: '123456' }),
  });
  const doadorLogin = await r.json();
  checar('login do doador', r.ok && !!doadorLogin.token);
  const tokenDoador = doadorLogin.token;

  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Familia Silva', email: 'familia@teste.com', senha: '123456', tipo: 'beneficiario' }),
  });
  r = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'familia@teste.com', senha: '123456' }),
  });
  const beneficiarioLogin = await r.json();
  checar('login do beneficiario', r.ok && !!beneficiarioLogin.token);
  const tokenBeneficiario = beneficiarioLogin.token;

  r = await fetch(`${BASE_URL}/api/itens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDoador}` },
    body: JSON.stringify({ nome: 'Geladeira Brastemp', categoria: 'Geladeira', condicao: 'usado_funcional', descricao: 'Funcionando bem' }),
  });
  const item = await r.json();
  checar('doador cadastra item', r.status === 201);

  r = await fetch(`${BASE_URL}/api/itens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenBeneficiario}` },
    body: JSON.stringify({ nome: 'Item invalido', categoria: 'Outros', condicao: 'novo' }),
  });
  checar('beneficiario nao pode cadastrar item (403 esperado)', r.status === 403);

  r = await fetch(`${BASE_URL}/api/itens`);
  const listaPublica = await r.json();
  checar('vitrine publica lista o item disponivel', r.ok && listaPublica.length === 1);

  r = await fetch(`${BASE_URL}/api/solicitacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenBeneficiario}` },
    body: JSON.stringify({ item_id: item.id, mensagem: 'Preciso muito, obrigado!' }),
  });
  const solicitacao = await r.json();
  checar('beneficiario solicita item', r.status === 201);

  r = await fetch(`${BASE_URL}/api/itens`);
  const listaAposSolicitacao = await r.json();
  checar('item some da vitrine publica apos reserva', listaAposSolicitacao.length === 0);

  r = await fetch(`${BASE_URL}/api/solicitacoes`, { headers: { Authorization: `Bearer ${tokenDoador}` } });
  const solicitacoesDoador = await r.json();
  checar('doador ve a solicitacao recebida', solicitacoesDoador.length === 1);

  r = await fetch(`${BASE_URL}/api/solicitacoes/${solicitacao.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDoador}` },
    body: JSON.stringify({ status: 'aprovada' }),
  });
  checar('doador aprova a solicitacao', r.ok);

  r = await fetch(`${BASE_URL}/api/solicitacoes/${solicitacao.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDoador}` },
    body: JSON.stringify({ status: 'entregue' }),
  });
  checar('doador marca a solicitacao como entregue', r.ok);

  r = await fetch(`${BASE_URL}/api/estatisticas`);
  const stats = await r.json();
  checar('estatisticas refletem a entrega', stats.itens_entregues === 1 && stats.familias_atendidas === 1, stats);

  r = await fetch(`${BASE_URL}/api/solicitacoes`, { headers: { Authorization: `Bearer ${tokenBeneficiario}` } });
  const minhas = await r.json();
  checar('beneficiario ve a solicitacao como entregue', minhas[0].status === 'entregue');

  r = await fetch(`${BASE_URL}/`);
  const html = await r.text();
  checar('frontend (index.html) e servido pelo backend', r.ok && html.includes('DoaCiclo'));

  console.log(`\n${falhas === 0 ? 'Todos os testes passaram.' : `${falhas} teste(s) falharam.`}`);
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('ERRO INESPERADO NO TESTE:', e);
  process.exit(1);
});
