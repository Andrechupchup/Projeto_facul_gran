-- Schema do banco de dados do DoaCiclo

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('admin', 'doador', 'beneficiario')),
    telefone VARCHAR(30),
    cidade VARCHAR(100),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS itens (
    id SERIAL PRIMARY KEY,
    doador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    descricao TEXT,
    condicao VARCHAR(30) NOT NULL CHECK (condicao IN ('novo', 'seminovo', 'usado_funcional', 'peca_para_reparo')),
    foto_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'entregue', 'cancelado')),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solicitacoes (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
    beneficiario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensagem TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada', 'entregue')),
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itens_status ON itens(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes(status);

-- Usuario admin padrao (senha: admin123 - troque em producao)
-- Hash gerado com bcryptjs, custo 10
INSERT INTO usuarios (nome, email, senha_hash, tipo)
VALUES ('Administrador', 'admin@doaciclo.org', '$2b$10$XD4h8z0IpXsycFJrysObxOOfqOgZDHzq0jVcDzOAupYKkI5qqgdbO', 'admin')
ON CONFLICT (email) DO NOTHING;
