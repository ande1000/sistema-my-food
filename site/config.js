/*
  Depois de criar a loja no painel (painel/cadastro.html), copie o "ID da
  loja" que aparece em painel > usuário, e cole aqui embaixo. Assim o site
  do cliente sabe de qual loja mostrar o cardápio.

  Também é possível abrir o site passando ?loja=ID_DA_LOJA na URL — nesse
  caso não precisa mexer aqui.
*/
window.STORE_ID = "COLE_AQUI_O_ID_DA_LOJA";

/*
  URL do servidor de pagamento (Render). Essa URL não é secreta — é só o
  endereço público do servidor. Depois de criar o serviço no Render, cole
  aqui a URL dele (algo como https://seu-servico.onrender.com).
*/
window.PAYMENT_API_URL = "COLE_AQUI_A_URL_DO_RENDER";
