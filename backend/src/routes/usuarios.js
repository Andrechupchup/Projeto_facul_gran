const express = require('express');
const db = require('../db');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

router.get('/me', autenticar, async (req, res) => {
  try {
    const resultado = await db.query(
      'SELECT id, nome, email, tipo, telefone, cidade, criado_em FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuario nao encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar usuario' });
  }
});

module.exports = router;
