# 🦅 o águia — sistema de comida rápido

Sistema feito 100% em **HTML, CSS e JavaScript puro**, pronto para hospedar
no **GitHub Pages**. Tem duas partes:

- **`/painel`** → o painel de controle do dono da loja (cadastro, pedidos, cardápio, clientes, chat, etc.)
- **`/site`** → o site do cliente, onde ele vê o cardápio e compra

## Por que existe um "Firebase" no projeto?

O GitHub Pages só hospeda arquivos estáticos — ele **não roda um servidor**.
Para o painel e o site conversarem em tempo real (ex: você abre a loja no
painel e ela aparece "aberta" no site na hora; ou o cliente manda uma
mensagem no chat e ela aparece no painel), é preciso um banco de dados em
algum lugar. Como pedido, isso continua sendo feito **só com JavaScript, no
navegador**, sem você escrever nenhum backend nem usar Render/Node — o
[Firebase](https://firebase.google.com) (Firestore) faz esse papel de banco
de dados/API, de graça, e o repositório continua sendo puramente estático.

## Passo a passo para configurar (uma vez só, leva uns 5 minutos)

1. Acesse **https://console.firebase.google.com** e crie um projeto (pode
   ser gratuito, plano "Spark").
2. No menu, vá em **Compilação → Firestore Database → Criar banco de
   dados** e escolha **"Iniciar no modo de teste"**.
3. Clique na engrenagem (⚙️) → **Configurações do projeto** → role até
   **"Seus apps"** → clique no ícone **`</>`** (Web) → dê um nome
   qualquer e clique em **Registrar app**.
4. O Firebase vai mostrar um bloco `firebaseConfig`. Copie os valores e
   cole no arquivo **`js/firebase-config.js`** deste projeto, no lugar de
   `COLE_AQUI_...`.
5. (Recomendado antes de deixar público) Em **Firestore → Regras**, troque
   as regras de teste por algo assim, para o banco não ficar liberado para
   sempre:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // simples, ideal para começar/testar
       }
     }
   }
   ```
   Esse modo libera leitura/escrita para todo mundo (necessário aqui porque
   não existe login "de verdade" com senha — é um cadastro simples). Se
   quiser mais segurança depois, dá pra evoluir para o Firebase
   Authentication.

## Como usar

1. Abra `painel/cadastro.html`, preencha o nome da loja e o usuário e
   clique em **criar**. Isso cria a loja no banco de dados e te leva para
   o painel principal.
2. No painel, clique em **usuário** no menu lateral e copie o **"ID da
   loja"**.
3. Abra `site/config.js` e cole esse ID em `window.STORE_ID = "..."`
   — isso conecta o site do cliente com a sua loja. (Também dá pra
   simplesmente compartilhar o link `site/cadastro.html?loja=ID_DA_LOJA`
   sem editar o arquivo.)
4. No painel, vá em **loja** e clique em **abrir loja**.
5. Vá em **vender** → clique no **+** → cadastre um lanche com foto,
   descrição e valor. Ele aparece automaticamente no **cardápio** do
   painel e no **site do cliente**.
6. Abra `site/cadastro.html`, crie uma conta de cliente (com endereço) e
   você verá o cardápio. Ao clicar em **comprar**, abre o chat, que
   conversa em tempo real com o chat do painel (o endereço do cliente é
   enviado automaticamente na primeira mensagem).
7. No painel, os pedidos aparecem em **pedidos**, começam em
   **"em andamento"**, depois de 3 minutos passam pra **"em preparo"**,
   depois de mais 10 minutos passam pra **"pronto"**. Quando o motoboy sai
   para entregar, clique em **sair** para o pedido sumir da tela.

## Publicando no GitHub Pages

1. Suba esta pasta inteira para um repositório no GitHub.
2. No repositório, vá em **Settings → Pages**.
3. Em "Branch", escolha `main` (ou a branch usada) e a pasta `/root`.
4. Salve. Em alguns minutos o site estará em
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
5. Compartilhe o link `.../painel/cadastro.html` com você mesmo (dono da
   loja) e `.../site/cadastro.html` com os clientes.

## Estrutura dos arquivos

```
├── index.html              → página inicial com os dois links
├── css/style.css           → todo o visual do sistema (cores, layout)
├── js/
│   ├── firebase-config.js  → suas chaves do Firebase (preencher)
│   ├── core.js              → funções compartilhadas (fotos, valores, status do pedido)
│   ├── painel.js             → toda a lógica do painel de controle
│   └── site.js               → toda a lógica do site do cliente
├── painel/
│   ├── cadastro.html         → criar conta da loja
│   └── index.html            → painel principal (loja, pedidos, cardápio, chat...)
└── site/
    ├── config.js              → ID da loja que o site deve mostrar
    ├── cadastro.html          → criar conta do cliente
    └── index.html             → cardápio + chat do cliente
```

## Observações importantes

- As fotos são salvas direto no banco de dados (em base64). Isso é simples
  e funciona bem para fotos pequenas/médias, mas se quiser fotos em alta
  qualidade no futuro, o ideal é migrar para o **Firebase Storage**.
- Sem login com senha: qualquer pessoa com o "ID da loja" acessa o painel
  se souber a URL. Para uso pessoal/pequeno negócio geralmente é
  suficiente, mas para algo mais sério, o próximo passo é adicionar
  **Firebase Authentication** (posso te ajudar a adicionar depois).
