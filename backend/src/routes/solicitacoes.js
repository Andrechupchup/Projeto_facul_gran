const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

// Beneficiario solicita um item disponivel
router.post('/', autenticar, autorizar('beneficiario', 'admin'), async (req, res) => {
  const { item_id, mensagem } = req.body;
  if (!item_id) {
    return res.status(400).json({ erro: 'item_id e obrigatorio' });
  }

  try {
    const item = await db.query('SELECT * FROM itens WHERE id = $1', [item_id]);
    if (item.rows.length === 0) {
      return res.status(404).json({ erro: 'Item nao encontrado' });
    }
    if (item.rows[0].status !== 'disponivel') {
      return res.status(409).json({ erro: 'Este item nao esta mais disponivel' });
    }

    const resultado = await db.query(
      `INSERT INTO solicitacoes (item_id, beneficiario_id, mensagem)
       VALUES ($1, $2, $3) RETURNING *`,
      [item_id, req.usuario.id, mensagem || null]
    );

    // Reserva o item automaticamente ao receber uma solicitacao
    await db.query(`UPDATE itens SET status = 'reservado' WHERE id = $1`, [item_id]);

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar solicitacao' });
  }
});

// Listar solicitacoes - visao depende do tipo de usuario
router.get('/', autenticar, async (req, res) => {
  try {
    let resultado;
    if (req.usuario.tipo === 'admin') {
      resultado = await db.query(
        `SELECT s.*, i.nome AS item_nome, i.categoria, u.nome AS beneficiario_nome
         FROM solicitacoes s
         JOIN itens i ON i.id = s.item_id
         JOIN usuarios u ON u.id = s.beneficiario_id
         ORDER BY s.criado_em DESC`
      );
    } else if (req.usuario.tipo === 'doador') {
      resultado = await db.query(
        `SELECT s.*, i.nome AS item_nome, i.categoria, u.nome AS beneficiario_nome
         FROM solicitacoes s
         JOIN itens i ON i.id = s.item_id
         JOIN usuarios u ON u.id = s.beneficiario_id
         WHERE i.doador_id = $1
         ORDER BY s.criado_em DESC`,
        [req.usuario.id]
      );
    } else {
      resultado = await db.query(
        `SELECT s.*, i.nome AS item_nome, i.categoria
         FROM solicitacoes s
         JOIN itens i ON i.id = s.item_id
         WHERE s.beneficiario_id = $1
         ORDER BY s.criado_em DESC`,
        [req.usuario.id]
      );
    }
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar solicitacoes' });
  }
});

// Doador ou admin aprova, recusa ou marca como entregue
router.patch('/:id', autenticar, autorizar('doador', 'admin'), async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['aprovada', 'recusada', 'entregue'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status invalido' });
  }

  try {
    const solicitacao = await db.query(
      `SELECT s.*, i.doador_id FROM solicitacoes s JOIN itens i ON i.id = s.item_id WHERE s.id = $1`,
      [req.params.id]
    );
    if (solicitacao.rows.length === 0) {
      return res.status(404).json({ erro: 'Solicitacao nao encontrada' });
    }
    if (req.usuario.tipo !== 'admin' && solicitacao.rows[0].doador_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Voce nao pode alterar esta solicitacao' });
    }

    await db.query(
      'UPDATE solicitacoes SET status = $1, atualizado_em = now() WHERE id = $2',
      [status, req.params.id]
    );

    const itemId = solicitacao.rows[0].item_id;
    if (status === 'recusada') {
      await db.query(`UPDATE itens SET status = 'disponivel' WHERE id = $1`, [itemId]);
    } else if (status === 'entregue') {
      await db.query(`UPDATE itens SET status = 'entregue' WHERE id = $1`, [itemId]);
    }

    const atualizado = await db.query('SELECT * FROM solicitacoes WHERE id = $1', [req.params.id]);
    res.json(atualizado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar solicitacao' });
  }
});

module.exports = router;
