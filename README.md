# Minuto ONA

Quero construir um aplicativo web chamado "FGH Prepara". O objetivo é permitir que os gestores e líderes hospitalares gerem roteiros de perguntas rápidos e personalizados para aplicar a colaboradores antes de uma auditoria real da ONA.

Esta ferramenta é voltada estritamente para o papel do ENTREVISTADOR (Líder).

1. Identidade Visual e Estética (FGH Brand):

- Siga estritamente a paleta de cores da FGH. A cor primária obrigatória é o "BLUE TURKISH SEA" (Hex: #00377b). Use-a em cabeçalhos, botões principais e destaques.

- Use uma tipografia sans-serif limpa, moderna e geométrica (semelhante à Nexa font), garantindo alta legibilidade e um visual "tech premium" voltado para a saúde.

- Use componentes estruturados do shadcn/ui (Cards, Textarea, Button, Badges) com cantos levemente arredondados e sombras suaves.

2. Estrutura da Interface (Layout Responsivo):

- Header: Um topo institucional elegante com a marca FGH e a indicação "Simulador de Auditoria ONA - Módulo do Entrevistador".

- Layout Split-Screen (Desktop): 

  * Lado Esquerdo (no-print): Painel de Configuração do Líder. Contém um campo de texto grande (Textarea) com o placeholder "Cole aqui o assunto que você deseja tratar ou o documento institucional!" e um botão de ação proeminente "Gerar Roteiro de Auditoria (Máx. 3 Minutos)".

  * Lado Direito: Painel de Exibição do Roteiro. Começa com um estado vazio (placeholder) instrutivo e, após o clique, renderiza a lista de perguntas geradas. Inclui um botão elegante de "Exportar PDF".

3. Lógica de Mapeamento (Heurística Interna no React):

- Crie um arquivo de dados local ou uma lógica em TypeScript que escaneie o texto colado pelo gestor em busca de palavras-chave críticas de rotina hospitalar (ex: 'medicamento', 'farmácia', 'validade', 'identificação', 'pulseira', 'higienização', 'mãos', 'queda', 'morse', 'prontuário', 'evolução').

- Configure um banco de dados interno estruturado com perguntas concisas, gabaritos institucionais e diretrizes da ONA para cada um desses eixos assistenciais.

- Se o texto inserido disparar um gatilho, selecione dinamicamente de 5 a 8 perguntas curtas e diretas sobre o tema. Caso o texto não dê match em nenhum gatilho, mescle perguntas ONA de alinhamento geral e postura.

4. Formato dos Flashcards do Roteiro (Visualização do Líder):

Cada pergunta deve ser exibida como um card contendo:

- Um Badge indicando o número da questão (ex: Q1, Q2).

- A pergunta direta e curta (ex: "Como você garante a identificação correta deste paciente antes de medicar?").

- Um box destacado com fundo claro e borda esquerda verde (estilo border-l-4 border-emerald-500) apresentando a "Resposta Esperada / Gabarito Institucional".

- Uma linha de texto menor indicando a "Diretriz ONA", citando de forma prática o requisito ou seção do manual correspondente àquela conduta (ex: Requisito ONA Seção 1.2 - Segurança do Paciente).

5. Funcionalidade de Exportação de PDF (Layout de Impressão):

- O botão "Exportar PDF" deve acionar o comando de impressão nativo do navegador.

- Configure o CSS de impressão do Tailwind de modo que, ao imprimir/salvar em PDF:

  * O header do app e o painel esquerdo de digitação fiquem completamente ocultos (`print:hidden`).

  * O painel direito (Roteiro) ocupe 100% da largura da página, remova sombras de fundo e quebre as páginas de forma limpa sem cortar os cards ao meio (`print:page-break-inside-avoid`).

  * Um rodapé técnico discreto apareça na folha assinando: "Fundação Gestão Hospitalar (FGH)".

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://minutoona.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/57cf3525-b5a2-4865-8351-fa805cf6585e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
