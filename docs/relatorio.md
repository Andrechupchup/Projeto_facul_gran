# Relatório do Projeto Integrador — DoaCiclo

## Por que escolhi esse problema

Trabalho na área de peças e eletrodomésticos e vejo de perto uma coisa que
me incomoda: muita coisa que ainda funciona (ou que dá pra reaproveitar)
acaba sendo descartada, seja por empresa ou por família mesmo, enquanto tem
gente que precisaria daquilo e não tem como comprar nem consertar o que já
tem. Hoje isso normalmente é resolvido no boca a boca, grupo de WhatsApp ou
post avulso no Instagram — sem controle nenhum de quem já pegou o quê, se
chegou a entregar, nada.

Foi por isso que decidi fazer um sistema pra organizar esse processo de
doação de eletrodomésticos e peças, em vez de escolher um tema qualquer só
pra cumprir a atividade.

## O projeto: DoaCiclo

A ideia é simples: uma plataforma onde quem tem itens pra doar (pessoa física
ou empresa) cadastra o que tem disponível, e quem precisa consegue ver
isso numa vitrine pública e pedir o item. Dá pra resumir o fluxo assim:

1. Doador cadastra o item (geladeira, fogão, peça de máquina, etc.).
2. Qualquer visitante vê o item disponível na página inicial, sem precisar
   nem ter conta.
3. Quem precisa (beneficiário) se cadastra e solicita o item.
4. O doador recebe a solicitação num painel próprio e decide se aprova ou
   recusa.
5. Quando a entrega acontece de verdade, o doador marca como entregue.
6. A página inicial mostra em tempo real quantos itens já foram doados,
   entregues e quantas famílias já foram atendidas — pra dar transparência
   pro impacto disso.

Quem seria atendido diretamente: famílias de baixa renda e ONGs/CRAS.
Quem doa também ganha algo com isso — um jeito organizado de fazer a doação
e conseguir mostrar o resultado, em vez de simplesmente postar numa rede
social e nunca mais saber o que aconteceu com aquele item.

## Como construí

Fiz a API em Node.js com Express e o banco em PostgreSQL, com login por
JWT. O banco tem três tabelas: usuários (que podem ser admin, doador ou
beneficiário), itens (com status disponível/reservado/entregue/cancelado)
e solicitações (pendente/aprovada/recusada/entregue), ligando um item a
quem pediu ele.

O frontend eu fiz em HTML, CSS e JS puro mesmo, sem framework — pra qualquer
um conseguir rodar sem precisar instalar nada de build. Tem a vitrine
pública com filtro por categoria, tela de login/cadastro, tela pro doador
cadastrar item, um painel com abas (meus itens / solicitações recebidas) e
uma tela pro beneficiário acompanhar o status do que ele pediu.

Duas coisas que precisei pensar com mais calma:

- **Quando alguém solicita um item, ele já sai da vitrine na hora**
  (fica "reservado"), pra evitar que duas pessoas peçam a mesma coisa ao
  mesmo tempo. Se o doador recusar, o item volta a aparecer como
  disponível automaticamente.
- **Cada tipo de conta só pode fazer certas coisas**: beneficiário não
  consegue cadastrar item, e um doador não consegue mexer em solicitação de
  item que não é dele. Isso é validado direto na API, não só escondendo
  botão na tela.

Deixei tudo rodando com Docker Compose (`docker compose up --build`), então
pra avaliar o projeto não precisa instalar Postgres nem nada manualmente,
sobe tudo com um comando só.

Também escrevi um teste automatizado (`npm test` dentro da pasta
`backend`) que simula o fluxo inteiro — cadastro, doação, solicitação,
aprovação e entrega — e confirma que as estatísticas batem no final.
Rodei antes de subir pro GitHub pra ter certeza de que o fluxo principal
realmente funciona de ponta a ponta, não só no visual.

## GitHub e divulgação

O código está no repositório `Projeto_gran_facul`, separado em `backend/`,
`frontend/` e `docs/` (onde está este relatório e o rascunho do post do
LinkedIn). O README explica o problema, as tecnologias e como rodar o
projeto do zero.

## O que eu faria a seguir

Esse projeto ficou como um MVP funcional — cobre o fluxo inteiro de uma
doação de ponta a ponta. Se fosse continuar, eu adicionaria upload de foto
de verdade (hoje é só um link de imagem), aviso por WhatsApp quando a
solicitação muda de status, e talvez um jeito de ONGs pedirem itens em nome
de várias famílias de uma vez, já que na prática é assim que costuma
funcionar.
