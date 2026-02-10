# Doçuras da Fran - Sistema de Gestão para Confeitarias

## 1. Visão Geral

Este é um sistema de gestão completo e personalizado para confeitarias, projetado para otimizar e simplificar o controle financeiro, o gerenciamento de produtos, clientes e pedidos. A aplicação é dividida em duas partes principais: um **Painel Administrativo** robusto e uma **Loja Virtual (Cardápio Online)** integrada para os clientes.

Construído como um **Progressive Web App (PWA)**, o sistema pode ser "instalado" em celulares e computadores, oferecendo uma experiência de uso semelhante a um aplicativo nativo, incluindo notificações em tempo real.

---

## 2. Funcionalidades do Painel Administrativo

### 2.1. PDV (Ponto de Venda)
O coração das vendas rápidas do dia a dia.
- **Grid Visual de Produtos:** Selecione produtos de forma rápida através de uma interface visual com imagens.
- **Busca e Filtro:** Encontre produtos rapidamente usando a busca por nome ou filtrando por categorias.
- **Carrinho de Compras Interativo:** Adicione ou remova produtos e ajuste quantidades com facilidade.
- **Finalização de Venda Completa:** Ao finalizar, é possível associar a venda a um cliente cadastrado, adicionar opcionais, aplicar descontos, incluir taxas de entrega e registrar o método de pagamento (PIX, Dinheiro, Cartão ou Fiado).

### 2.2. Dashboard
Sua visão geral do negócio em tempo real.
- **Cards de Resumo:** Acompanhe `Balanço`, `Entradas (Pagas)` e `Saídas (Gastos)` em um piscar de olhos.
- **Lançamentos Recentes:** Visualize as últimas transações registradas para um acompanhamento rápido.
- **Alerta de ID da Loja:** Caso o sistema de pedidos da loja online ainda não esteja vinculado, o dashboard exibe um alerta com o ID a ser configurado.

### 2.3. Pedidos da Loja
Central de gerenciamento para os pedidos que chegam do cardápio online.
- **Notificações em Tempo Real:** Receba um alerta sonoro e visual a cada novo pedido, mesmo com o aplicativo minimizado. O ícone do app no celular também exibe a quantidade de pedidos pendentes.
- **Listas Separadas:** Os pedidos são organizados em "Pendentes" e "Concluídos".
- **Ações Rápidas:** Marque um pedido como "Pago" com um clique, veja os detalhes completos do cliente e do pedido, edite ou exclua o lançamento.

### 2.4. Relatórios
Análise financeira detalhada para tomada de decisões.
- **Filtro por Período:** Selecione um intervalo de datas (início e fim) para gerar relatórios específicos.
- **Navegação por Mês:** Botões para avançar ou retroceder rapidamente entre os meses.
- **Resumo Geral:** Visualize o balanço total, as principais fontes de receita e as categorias com maiores despesas dentro do período selecionado.

### 2.5. Cadastros
Gerencie os dados mestres do seu negócio.
- **Produtos:** Crie e edite produtos com nome, preço, imagem (via upload), categoria e disponibilidade (`Em Falta`).
- **Recursos da Loja:** Marque produtos como `Destaque` para aparecerem no topo da loja ou como `Promoção`, definindo um preço promocional.
- **Clientes:** Cadastre clientes com nome, WhatsApp e endereço completo. O sistema evita duplicatas, atualizando os dados de clientes existentes.
- **Categorias de Produtos:** Organize seus produtos em categorias (Ex: Bolos, Doces, Salgados) para facilitar a navegação no PDV e na loja.
- **Opcionais:** Adicione itens opcionais com preço (Ex: "Mais Nutella", "Embalagem para presente") que podem ser incluídos nas vendas.

### 2.6. Meus Lançamentos
Controle total sobre as finanças manuais e vendas a prazo.
- **Vendas a Prazo (Fiado):** Uma seção dedicada exibe todas as vendas pendentes de pagamento, com o valor total a receber.
- **Quitação de Dívidas:** Marque uma venda "fiado" como paga, especificando o método de pagamento (PIX, Dinheiro ou Cartão).
- **Histórico Completo:** Visualize todos os lançamentos concluídos (entradas e saídas), com a possibilidade de editar ou excluir cada um.
- **Adicionar Lançamento:** Registre manualmente novas receitas ou despesas que não vieram de uma venda.

### 2.7. Configurações da Loja
Personalize as informações e regras do seu negócio.
- **Dados da Loja:** Defina a chave PIX, o telefone/WhatsApp de contato e o endereço para retirada.
- **Horário de Funcionamento:** Configure os dias e horários em que a loja virtual aceitará pedidos. Fora desse horário, a loja exibe uma mensagem de "Fechado".

---

## 3. Funcionalidades da Loja Virtual (Cardápio Online)

A vitrine do seu negócio, acessível a todos os clientes.
- **Design Moderno:** Um cardápio visualmente atraente que destaca seus produtos.
- **Seções Especiais:** Áreas dedicadas para `Promoções` e `Destaques da Casa`.
- **Navegação Intuitiva:** Filtre produtos por categoria para encontrar o que deseja.
- **Carrinho de Compras Flutuante:** Adicione produtos e finalize a compra através de um carrinho de compras prático.
- **Checkout Inteligente:**
  - **Dados do Cliente:** O sistema identifica clientes existentes pelo nome para evitar duplicatas. O WhatsApp é obrigatório.
  - **Agendamento:** O cliente seleciona a data (sextas e sábados) e o horário para entrega ou retirada.
  - **Opções de Entrega:** Permite escolher entre `Retirada` ou `Entrega`.
  - **Pagamento:** As opções de pagamento são PIX, Dinheiro ou Cartão (na entrega). Ao escolher PIX, a chave configurada no painel é exibida.

---

## 4. Tecnologias Utilizadas

- **Frontend:** Next.js (React) com TypeScript
- **Backend & Banco de Dados:** Firebase (Firestore, Authentication, Storage)
- **Estilização:** Tailwind CSS e ShadCN/UI
- **Gerenciamento de Estado:** Zustand
- **Inteligência Artificial (Sugestão de Categorias):** Genkit
- **Formulários:** React Hook Form com Zod para validação
- **Notificações:** PWA (Progressive Web App) com Service Workers

Este `README.md` oferece uma visão completa de todas as capacidades da sua aplicação.