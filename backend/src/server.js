require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const itensRoutes = require('./routes/itens');
const solicitacoesRoutes = require('./routes/solicitacoes');
const usuariosRoutes = require('./routes/usuarios');
const estatisticasRoutes = require('./routes/estatisticas');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API
app.use('/api/auth', authRoutes);
app.use('/api/itens', itensRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/estatisticas', estatisticasRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Frontend estatico
app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`DoaCiclo rodando na porta ${PORT}`);
});
