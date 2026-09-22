# Resumo para continuar em outra conversa

## O que é este sistema
"o águia" — sistema de delivery (tipo um mini-iFood) feito em HTML/CSS/JS puro,
com painel de controle pro dono da loja e site pro cliente. Usa Firebase
Firestore como banco de dados (já configurado e funcionando — não precisa
criar um projeto novo no Firebase, as chaves já estão certas no
`js/firebase-config.js`).

## Funcionalidades já prontas (não precisa refazer nada disso)
- Cadastro de loja e cadastro de cliente
- Painel: loja (abrir/fechar), pedidos (kanban com aceitar/aguardando/em
  andamento/em preparo/pronto/atraso), cardápio, clientes, vender (criar
  produto), histórico, estatística, usuário, catálogo, configuração (nome,
  foto, cor de fundo, sair da conta), ajuda, **tira pedido** (pedido manual)
- Sons diferentes pra cada evento (pedido aguardando, foi pra preparo, ficou
  pronto, atraso, previsão, cancelamento, mensagem nova no chat)
- Sininho pra ligar/desligar o som, badge de mensagens não lidas no chat
- Relatório de vendas (baixa em .txt e .png)
- Site do cliente: cardápio, carrinho de compras (adicionar, quantidade,
  observação, forma de pagamento), popup de "loja fechada" bloqueando pedido,
  "ver pedido" (lista todos os pedidos ativos do cliente, com previsão de
  tempo e cancelamento por pedido), chat com a loja, botão de configuração
  (sair da conta)
- **Loja ativa automática**: toda vez que uma loja nova é criada no painel,
  o site do cliente passa a mostrar ela sozinho (usa um documento
  `config/lojaAtiva` no Firestore como "ponteiro"), sem precisar editar
  `site/config.js` na mão

## Problema em aberto (motivo de estar migrando de repositório)
O repositório antigo (`ande1000/sistema-de-vendass` no GitHub) ficou com o
GitHub Pages travado: mesmo com o arquivo `painel/index.html` correto no
repositório (confirmado visualmente) e o GitHub Pages mostrando "Your site is
live..." com deploy recente, o navegador do usuário recebia 404 real do
servidor ao acessar esse arquivo. Não foi possível identificar a causa exata
(não era cache do navegador — testado com DevTools "Disable cache" e ainda
deu 404). A decisão foi criar um repositório novo do zero pra descartar
qualquer problema de configuração/estado desse repositório específico.

## Próximo passo
1. O usuário vai criar um repositório NOVO no GitHub (nome novo).
2. Subir estes arquivos (a pasta inteira, mantendo a estrutura de pastas).
3. Ativar o GitHub Pages nesse repositório novo (Settings → Pages → Deploy
   from a branch → main → / (root)).
4. Testar o painel e o site nesse novo link.
5. **Dica**: ao subir os arquivos dessa vez, evitar radicalmente qualquer
   confusão entre `painel/index.html` e `painel/cadastro.html` (ou entre
   `site/index.html` e `site/cadastro.html`) — são nomes de arquivo iguais
   em pastas diferentes, e isso causou bastante retrabalho na conversa
   anterior. Fazer upload de UM arquivo por vez, sempre conferindo a pasta
   de destino antes de confirmar.

## Preferências do usuário (importante)
- Prefere que os arquivos grandes sejam enviados como **download** (zip ou
  arquivo avulso) em vez de copiar/colar código no chat, para evitar erro de
  colagem incompleta.
- Já se frustrou bastante com o processo de subir arquivos no GitHub — ir
  com calma, um arquivo de cada vez, sem repetir instruções desnecessárias.
