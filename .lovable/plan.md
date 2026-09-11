# Resumo em áudio estilo podcast

Sim, é possível. Depois de gerar o roteiro, o líder poderá ouvir na tela um resumo de 2 a 3 minutos, em formato de conversa entre dois apresentadores, comentando os pontos principais do treinamento.

## Como vai funcionar

1. No painel do roteiro aparece um botão "Ouvir resumo (podcast)".
2. Ao clicar, o sistema escreve um diálogo curto entre duas pessoas (uma apresentadora e um especialista em qualidade ONA) com base nos eixos, perguntas e gabaritos já gerados.
3. Cada fala é convertida em voz, alternando entre duas vozes diferentes.
4. Um player simples aparece na tela: play/pausa, indicação de quem está falando e barra de progresso.
5. Enquanto o áudio está sendo preparado, aparece uma mensagem de carregamento com aviso de que leva alguns segundos.
6. O áudio existe apenas durante a sessão, sem download, e não aparece na impressão em PDF.

## Regras de conteúdo

- Duração alvo: 2 a 3 minutos (roteiro de fala controlado por tamanho).
- Português do Brasil, tom de conversa profissional, sem inventar dados fora do roteiro.
- Cobre: tema do treinamento, eixos abordados, 3 a 5 pontos de atenção e um fechamento motivacional curto.
- Se o roteiro ainda não foi gerado, o botão fica desativado.

## Detalhes técnicos

- Nova função de servidor `gerarPodcastRoteiro` em `src/lib/podcast.functions.ts`:
  - Etapa 1: gera o diálogo em JSON (`[{ locutor: "ana" | "bruno", texto }]`) usando o mesmo provedor Groq já configurado (`openai/gpt-oss-120b`), com o mesmo tratamento de erro/parse de `roteiro.functions.ts`.
  - Etapa 2: para cada fala, chama `POST https://ai.gateway.lovable.dev/v1/audio/speech` (modelo `openai/gpt-4o-mini-tts`, `response_format: "mp3"`, `stream_format: "audio"`) com voz distinta por locutor e `instructions` de tom conversacional. Sem timeouts artificiais.
  - Retorna array de segmentos `{ locutor, texto, audioBase64 }`.
  - Erros do gateway seguem os status: 429/5xx com mensagem de tentar novamente, 402/403 com mensagem clara ao usuário.
- Chave: usa `LOVABLE_API_KEY` no servidor (nunca no cliente). Se não existir, será provisionada.
- UI em `src/routes/index.tsx` (ou componente novo `src/components/PodcastPlayer.tsx`): toca os segmentos em sequência via elemento `Audio` com data URI, destaca a fala atual, botão de parar. Wrapper com `print:hidden` e cores do padrão FGH (#00377b).
- Registro: incrementa o histórico do log existente em `roteiro_logs` com um evento `{ tipo: "podcast" }`, para o dashboard admin refletir o uso.
