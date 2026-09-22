/*
  ==========================================================================
  CONFIGURAÇÃO DO FIREBASE (o "banco de dados" / API do sistema)
  ==========================================================================
  O GitHub Pages só hospeda arquivos estáticos (HTML/CSS/JS) — ele não
  consegue rodar um servidor. Por isso, para o painel e o site conversarem
  entre si (loja aberta/fechada, cardápio, pedidos, chat) em tempo real,
  usamos o Firebase (Firestore), que é gratuito e é acessado 100% via
  JavaScript, direto do navegador. Não precisa de Node, Render, nem servidor
  próprio — continua sendo um site 100% estático no GitHub Pages.

  COMO CONFIGURAR (gratuito, leva 3 minutos):
  1. Acesse https://console.firebase.google.com
  2. Crie um projeto novo (qualquer nome, ex: "o-aguia").
  3. No menu lateral, clique em "Compilação" > "Firestore Database" >
     "Criar banco de dados" > escolha "Iniciar no modo de teste".
  4. Ainda no console, clique no ícone de engrenagem > "Configurações do
     projeto" > role até "Seus apps" > clique no ícone "</>" (Web) >
     dê um nome e clique em "Registrar app".
  5. O Firebase vai te mostrar um objeto "firebaseConfig" parecido com o
     de baixo. Copie os valores dele e cole nas linhas abaixo.
  ==========================================================================
*/

const firebaseConfig = {
  apiKey: "AIzaSyA4jQS3ZqfR8vIbYkeH7zx--3T4qDVeOSc",
  authDomain: "sisme-36c0e.firebaseapp.com",
  projectId: "sisme-36c0e",
  storageBucket: "sisme-36c0e.firebasestorage.app",
  messagingSenderId: "513353599801",
  appId: "1:513353599801:web:5c5075200089f0282f76e8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
