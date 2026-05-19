# Documento de Casos de Testes - Velô Sprint

Este documento contém os casos de teste funcionais para o sistema Velô Sprint - Configurador de Veículo Elétrico, focados nas regras de negócio, precificação e fluxos de pedido.

## Módulo: Configurador de Veículo

---

### CT01 - Configuração base do veículo

#### Objetivo
Validar se o valor base do veículo sem opcionais é exibido corretamente ao iniciar a configuração.

#### Pré-Condições
- O usuário deve estar na página inicial e clicar em "Configurar".
- O sistema deve carregar os dados iniciais do veículo.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Acessar a página de configuração do veículo. | O modelo Velô Sprint é carregado com as opções padrão (Cor, Interior e Rodas "Aero"). |
| 2  | Verificar o valor total do veículo exibido no rodapé ou resumo sem adicionar opcionais. | O valor total exibido deve ser de R$ 40.000,00. |

#### Resultados Esperados
- O preço inicial e base do veículo deve refletir exatamente R$ 40.000,00.

#### Critérios de Aceitação
- Nenhuma taxa extra deve ser cobrada por cores, interior padrão e rodas de modelo "Aero".

---

### CT02 - Adição de opcionais e precificação dinâmica

#### Objetivo
Validar se o preço total é atualizado corretamente de forma cumulativa ao adicionar rodas premium e opcionais tecnológicos.

#### Pré-Condições
- O usuário deve estar na página do Configurador.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Na seção de Rodas, selecionar o modelo "Sport". | O preço total é acrescido em R$ 2.000,00. |
| 2  | Na seção de Opcionais, selecionar "Precision Park". | O preço total é acrescido em R$ 5.500,00. |
| 3  | Na seção de Opcionais, selecionar "Flux Capacitor". | O preço total é acrescido em R$ 5.000,00. |
| 4  | Validar o valor total exibido na tela. | O valor total exibido deve ser de R$ 52.500,00 (40.000 + 2.000 + 5.500 + 5.000). |

#### Resultados Esperados
- O sistema deve calcular o preço total somando o valor base aos valores dos itens selecionados dinamicamente na UI.

#### Critérios de Aceitação
- Rodas Sport custam +R$ 2.000.
- Precision Park custa +R$ 5.500.
- Flux Capacitor custa +R$ 5.000.

---

## Módulo: Checkout/Pedido

---

### CT03 - Validação de campos obrigatórios no formulário

#### Objetivo
Garantir que o usuário não consiga submeter um pedido sem preencher todos os dados pessoais e aceitar os termos de uso.

#### Pré-Condições
- O usuário deve ter configurado um veículo e avançado para a página de Checkout (Finalizar Pedido).

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Deixar todos os campos da seção "Dados Pessoais" em branco ou preenchidos com espaços. | Os campos permanecem vazios. |
| 2  | Deixar a caixa de seleção de "Termos de Uso" desmarcada. | Checkbox desmarcada. |
| 3  | Clicar no botão "Confirmar Pedido". | O sistema deve impedir o avanço e destacar os campos inválidos (Nome, Sobrenome, Email, Telefone, CPF, Loja, Termos). |

#### Resultados Esperados
- O formulário não deve ser enviado. Mensagens em vermelho de validação devem aparecer abaixo de cada campo obrigatório.

#### Critérios de Aceitação
- Validação em tela das informações obrigatórias.

---

### CT04 - Compra com formato de dados inválidos (Cenário Negativo)

#### Objetivo
Validar se o formulário rejeita formatos inválidos para Email, CPF e Telefone.

#### Pré-Condições
- Estar na página de Checkout.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Inserir o Email como `usuario@.com` (formato inválido). | - |
| 2  | Inserir CPF incompleto (ex: `123.456`). | - |
| 3  | Inserir Telefone incompleto. | - |
| 4  | Clicar em "Confirmar Pedido". | O sistema deve exibir erro de validação ("Email inválido", "CPF inválido", etc). |

#### Resultados Esperados
- Bloqueio da submissão com feedback visual claro sobre os formatos de dados aceitos.

#### Critérios de Aceitação
- O sistema não pode acionar o back-end se os dados inseridos não respeitarem as máscaras/formatos.

---

### CT05 - Compra à vista com sucesso (Fluxo feliz)

#### Objetivo
Validar a criação de um pedido utilizando a forma de pagamento "À Vista", onde não deve haver análise de crédito.

#### Pré-Condições
- Estar na página de Checkout com veículo selecionado.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Preencher todos os campos de "Dados Pessoais" com dados válidos. | Formulário preenchido sem erros. |
| 2  | Aceitar os Termos de Uso e Política de Privacidade. | Checkbox de termos marcada. |
| 3  | Selecionar a Forma de Pagamento "À Vista". | A opção visualiza-se como selecionada e o resumo mostra o valor integral. |
| 4  | Clicar em "Confirmar Pedido". | O sistema processa a requisição e redireciona para a Confirmação. |

#### Resultados Esperados
- O pedido deve ser salvo no banco de dados com status igual a "APROVADO".
- O usuário é redirecionado para a página de `/success` visualizando o número do pedido.

#### Critérios de Aceitação
- A forma de pagamento à vista aprova o pedido diretamente, ignorando análise de crédito e score.

---

## Módulo: Análise de Crédito Automática e Financiamento

---

### CT06 - Cálculo de parcelas de financiamento

#### Objetivo
Verificar se as parcelas do financiamento são calculadas corretamente utilizando juros de 2% ao mês em 12x.

#### Pré-Condições
- Veículo configurado no valor base de R$ 40.000,00.
- Acessar a página de Checkout.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Selecionar a Forma de Pagamento "Financiamento". | O campo de Valor da Entrada e os detalhes financeiros são exibidos. |
| 2  | Inserir o valor da entrada como R$ 0,00. | O sistema calcula automaticamente o saldo devedor e a parcela. |
| 3  | Verificar o valor da parcela exibido e o total financiado. | A parcela exibida deve ser de R$ 3.400,00. |

#### Resultados Esperados
- O sistema calcula a parcela somando 2% ao valor principal dividido por 12 (40.000 / 12 * 1.02).

#### Critérios de Aceitação
- Taxa fixa de financiamento travada em 12x com juros compostos de 2%.

---

### CT07 - Financiamento Aprovado Automaticamente (Score > 700)

#### Objetivo
Garantir que um CPF com bom Score de Crédito resulte na aprovação automática do financiamento.

#### Pré-Condições
- Formulário totalmente preenchido corretamente.
- CPF utilizado está configurado para retornar um Score acima de 700 no mock da API de crédito.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Selecionar "Financiamento" e preencher uma entrada de 10%. | O sistema recalcula os valores de parcela. |
| 2  | Clicar em "Confirmar Pedido". | Uma requisição é feita para o motor de análise de crédito. |
| 3  | Aguardar a finalização da compra. | O sistema redireciona para a tela de Sucesso. |

#### Resultados Esperados
- O motor de crédito avalia o score alto e gera o pedido com o status "APROVADO".

#### Critérios de Aceitação
- Score de Crédito > 700 aprova o pedido, resultando no status "APROVADO".

---

### CT08 - Financiamento Em Análise Manual (Score 501 a 700)

#### Objetivo
Validar se clientes com score mediano têm seus pedidos marcados como "Em análise".

#### Pré-Condições
- Formulário totalmente preenchido.
- CPF utilizado está configurado para retornar um Score entre 501 e 700.
- Valor da entrada é inferior a 50% do total.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Selecionar "Financiamento". | Opção marcada. |
| 2  | Clicar em "Confirmar Pedido". | O sistema chama a API de crédito. |

#### Resultados Esperados
- O pedido é salvo, o usuário vê a página de confirmação, mas o status vinculado ao pedido no banco de dados e na página de consulta será "EM_ANALISE".

#### Critérios de Aceitação
- Score de Crédito 501 a 700 atrela o status "EM_ANALISE" ao pedido caso a entrada seja menor que 50%.

---

### CT09 - Financiamento Reprovado (Score <= 500)

#### Objetivo
Validar se pedidos de clientes com score baixo são rejeitados de imediato na análise de risco.

#### Pré-Condições
- Formulário totalmente preenchido.
- CPF utilizado retornará um Score <= 500.
- Valor da entrada inferior a 50%.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Selecionar "Financiamento". | Opção marcada. |
| 2  | Clicar em "Confirmar Pedido". | O sistema consulta a análise de crédito. |

#### Resultados Esperados
- O pedido é finalizado, mas o status gerado no banco de dados será "REPROVADO".

#### Critérios de Aceitação
- Score <= 500 e entrada < 50% obriga o pedido a ser "REPROVADO".

---

### CT10 - Exceção de Aprovação (Entrada >= 50%)

#### Objetivo
Validar a regra de negócio que sobrepõe o limite de crédito ruim caso o cliente dê uma entrada volumosa.

#### Pré-Condições
- Veículo no valor de R$ 40.000,00.
- CPF utilizado simulado para retornar Score <= 500 (Reprovado).

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Selecionar "Financiamento". | Opção selecionada. |
| 2  | Preencher o campo "Valor da Entrada" com R$ 20.000,00 ou mais. | O sistema deve aceitar e atualizar os cálculos. |
| 3  | Clicar em "Confirmar Pedido". | O sistema processa a aprovação. |

#### Resultados Esperados
- Mesmo com um score reprobatório, o pedido deve ser salvo com o status "APROVADO", devido à entrada ser igual ou superior a 50% do valor total do veículo configurado.

#### Critérios de Aceitação
- A regra Entrada >= 50% anula a regra de reprovação por score, aprovando automaticamente.

---

## Módulo: Consulta de Pedidos

---

### CT11 - Consulta de pedido com sucesso

#### Objetivo
Validar se o usuário consegue acessar as informações de um pedido inserindo o número do pedido correto.

#### Pré-Condições
- Um pedido foi gerado previamente e o número (`order_number`) é conhecido pelo usuário.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Navegar até a página de "Consulta de Pedidos" (via cabeçalho). | O formulário de busca de pedido é exibido. |
| 2  | Inserir o número do pedido existente (ex: `c8d4...`) no campo de texto. | O botão de busca é habilitado. |
| 3  | Clicar no botão "Buscar Pedido". | Um loading é exibido e a consulta é realizada. |

#### Resultados Esperados
- O sistema deve retornar um painel contendo a configuração escolhida do veículo, dados do cliente, modalidade de pagamento e o status atualizado do pedido.

#### Critérios de Aceitação
- Proteção de privacidade: as informações só devem ser acessadas com o número correto do pedido.

---

### CT12 - Consulta de pedido inexistente ou número inválido

#### Objetivo
Testar a resposta do sistema quando um usuário tenta consultar um pedido com código falso.

#### Pré-Condições
- Estar na tela de Consulta de Pedidos.

#### Passos

| Id | Ação | Resultado Esperado |
|----|------|--------------------|
| 1  | Inserir um texto qualquer ou um número de pedido que não existe no banco de dados. | - |
| 2  | Clicar em "Buscar Pedido". | A requisição é feita. |

#### Resultados Esperados
- O sistema deve exibir uma mensagem tratada informando "Pedido não encontrado", instruindo o usuário a verificar o código.
- Nenhuma falha de sistema (crash) ou dados sensíveis devem ser exibidos na tela.

#### Critérios de Aceitação
- Fallback seguro para registros não encontrados no banco de dados.
