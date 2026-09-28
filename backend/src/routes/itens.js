const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

// Listar itens disponiveis (publico) - com filtro opcional por categoria
router.get('/', async (req, res) => {
  const { categoria, status } = req.query;
  const condicoes = [];
  const valores = [];

  if (categoria) {
    valores.push(categoria);
    condicoes.push(`i.categoria = $${valores.length}`);
  }
  if (status) {
    valores.push(status);
    condicoes.push(`i.status = $${valores.length}`);
  } else {
    condicoes.push(`i.status = 'disponivel'`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  try {
    const resultado = await db.query(
      `SELECT i.*, u.nome AS doador_nome, u.cidade AS doador_cidade
       FROM itens i
       JOIN usuarios u ON u.id = i.doador_id
       ${where}
       ORDER BY i.criado_em DESC`,
      valores
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar itens' });
  }
});

// Detalhe de um item
router.get('/:id', async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT i.*, u.nome AS doador_nome, u.cidade AS doador_cidade
       FROM itens i JOIN usuarios u ON u.id = i.doador_id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Item nao encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar item' });
  }
});

// Doador cadastra um novo item para doacao
router.post('/', autenticar, autorizar('doador', 'admin'), async (req, res) => {
  const { nome, categoria, descricao, condicao, foto_url } = req.body;

  if (!nome || !categoria || !condicao) {
    return res.status(400).json({ erro: 'Campos obrigatorios: nome, categoria, condicao' });
  }

  try {
    const resultado = await db.query(
      `INSERT INTO itens (doador_id, nome, categoria, descricao, condicao, foto_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.usuario.id, nome, categoria, descricao || null, condicao, foto_url || null]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar item' });
  }
});

// Itens cadastrados pelo doador logado
router.get('/meus/doados', autenticar, autorizar('doador', 'admin'), async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT * FROM itens WHERE doador_id = $1 ORDER BY criado_em DESC`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar seus itens' });
  }
});

// Atualizar status de um item (dono do item ou admin)
router.patch('/:id', autenticar, autorizar('doador', 'admin'), async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['disponivel', 'reservado', 'entregue', 'cancelado'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status invalido' });
  }

  try {
    const item = await db.query('SELECT * FROM itens WHERE id = $1', [req.params.id]);
    if (item.rows.length === 0) {
      return res.status(404).json({ erro: 'Item nao encontrado' });
    }
    if (req.usuario.tipo !== 'admin' && item.rows[0].doador_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Voce nao pode alterar um item que nao e seu' });
    }

    const resultado = await db.query(
      'UPDATE itens SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar item' });
  }
});

module.exports = router;
