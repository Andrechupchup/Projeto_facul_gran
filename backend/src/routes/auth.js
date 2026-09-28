const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

// Cadastro de usuario (doador ou beneficiario)
router.post('/register', async (req, res) => {
  const { nome, email, senha, tipo, telefone, cidade } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: 'Campos obrigatorios: nome, email, senha, tipo' });
  }
  if (!['doador', 'beneficiario'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo deve ser doador ou beneficiario' });
  }

  try {
    const existente = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existente.rows.length > 0) {
      return res.status(409).json({ erro: 'Ja existe um usuario com este email' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, cidade)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, tipo, telefone, cidade, criado_em`,
      [nome, email, senhaHash, tipo, telefone || null, cidade || null]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha sao obrigatorios' });
  }

  try {
    const resultado = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = resultado.rows[0];
    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo },
      SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao autenticar' });
  }
});

module.exports = router;
