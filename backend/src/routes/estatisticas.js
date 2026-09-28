const express = require('express');
const db = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');

const router = express.Router();

// Estatisticas gerais - painel administrativo e transparencia do impacto social
router.get('/', async (req, res) => {
  try {
    const [itensDoados, itensEntregues, familiasAtendidas, doadoresAtivos] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS total FROM itens`),
      db.query(`SELECT COUNT(*)::int AS total FROM itens WHERE status = 'entregue'`),
      db.query(`SELECT COUNT(DISTINCT beneficiario_id)::int AS total FROM solicitacoes WHERE status = 'entregue'`),
      db.query(`SELECT COUNT(DISTINCT doador_id)::int AS total FROM itens`),
    ]);

    res.json({
      itens_doados: itensDoados.rows[0].total,
      itens_entregues: itensEntregues.rows[0].total,
      familias_atendidas: familiasAtendidas.rows[0].total,
      doadores_ativos: doadoresAtivos.rows[0].total,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao calcular estatisticas' });
  }
});

module.exports = router;
