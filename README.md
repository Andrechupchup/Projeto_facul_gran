- DoaCiclo

Plataforma para doação de eletrodomésticos e peças usadas ou excedentes a famílias em situação de vulnerabilidade, conectando quem tem itens parados a quem precisa deles.

Projeto desenvolvido para a disciplina de Projeto Integrador — Fase 3 (Criando Projetos e Enviando Candidaturas).

- O problema

É comum jogar fora eletrodoméstico ou peça que ainda funciona, seja em casa ou em empresas do setor (distribuidoras, lojas, assistências técnicas). Do outro lado, famílias de baixa renda não têm como comprar ou consertar o que precisam. Hoje esse tipo de doação normalmente acontece de forma informal — grupo de WhatsApp, rede social — sem controle nenhum de status ou de quem já retirou o quê.

O DoaCiclo organiza esse fluxo:

- doadores (pessoas físicas ou empresas) cadastram os itens disponíveis, completos ou em peças;
- beneficiários (famílias, ONGs, CRAS) navegam pela vitrine pública e solicitam o que precisam;
- o doador recebe a solicitação num painel e pode aprovar, recusar ou marcar como entregue; o item sai de circulação assim que é reservado;
- a página inicial mostra estatísticas de impacto (itens doados, entregues, famílias atendidas, doadores ativos) para dar transparência ao resultado.

O objetivo é reduzir o descarte de itens ainda aproveitáveis, facilitar o acesso de famílias vulneráveis a bens essenciais e dar mais organização a um processo que hoje é informal. Quem se beneficia diretamente são famílias, ONGs e centros de assistência social; indiretamente, também as empresas doadoras, que reduzem custo de descarte e ganham visibilidade pelo impacto social.

- Tecnologias

Node.js e Express na API, PostgreSQL como banco, JWT e bcrypt para autenticação. O frontend é HTML, CSS e JavaScript puro, sem framework, para rodar em qualquer lugar sem etapa de build. Tudo containerizado com Docker e Docker Compose.

- Como rodar

- Opção A — com Docker (recomendado)


docker compose up --build


Sobe em http://localhost:3000 e já cria o banco de dados (schema + usuário administrador padrão) automaticamente.

 Opção B — sem Docker (Node e Postgres locais)

- suba um Postgres local e crie o schema
psql -U seu_usuario -d doaciclo -f backend/src/schema.sql

- Configure as variáveis de ambiente
cp backend/.env.example backend/.env
- Edite backend/.env com a sua DATABASE_URL

- Instale as dependências e rode
cd backend
npm install
npm run dev


Acesse http://localhost:3000.

- Estrutura do repositório

backend/            API Node.js/Express
  src/
    routes/          autenticação, itens, solicitações, estatísticas
    middleware/      autenticação JWT
    db.js            conexão com o PostgreSQL
    schema.sql       estrutura do banco de dados
    server.js         ponto de entrada da API
frontend/            páginas HTML/CSS/JS (vitrine, login, painel)
docs/                relatório do projeto e material de divulgação
docker-compose.yml

- Fluxo principal

O doador se cadastra e publica um item, que aparece na vitrine pública (`index.html`) para qualquer visitante. O beneficiário se cadastra, navega pela vitrine e solicita um item, que fica automaticamente reservado. O doador vê a solicitação no painel e pode aprovar, recusar ou, depois da entrega, marcar como entregue. As estatísticas da página inicial são atualizadas em tempo real.

- Impacto social esperado

Formalizando e dando visibilidade ao processo de doação, o DoaCiclo busca aumentar o volume de itens que realmente chegam a quem precisa, reduzir o descarte precoce de eletrodomésticos ainda úteis e manter um histórico auditável do impacto de cada doador.
