export interface AuditQuestion {
  pergunta: string;
  gabarito: string;
  diretriz: string;
}

export interface AuditAxis {
  id: string;
  titulo: string;
  keywords: string[];
  perguntas: AuditQuestion[];
}

export const auditAxes: AuditAxis[] = [
  {
    id: "medicamentos",
    titulo: "Segurança no Uso de Medicamentos",
    keywords: [
      "medicamento",
      "medicação",
      "farmácia",
      "validade",
      "vencimento",
      "diluição",
      "antibiótico",
      "dose",
      "prescrição",
      "alta vigilância",
      "eletrólito",
    ],
    perguntas: [
      {
        pergunta:
          "Quais são os certos da administração segura de medicamentos que você verifica antes de medicar?",
        gabarito:
          "Confiro os 9 certos: paciente certo, medicamento certo, dose certa, via certa, hora certa, registro certo, orientação certa, forma certa e resposta certa.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Protocolo de Segurança na Prescrição, Uso e Administração de Medicamentos.",
      },
      {
        pergunta: "Como você confere a validade e a integridade do medicamento antes do uso?",
        gabarito:
          "Verifico data de validade no rótulo/embalagem, integridade física e condições de armazenamento; itens vencidos ou alterados são segregados e notificados.",
        diretriz: "Requisito ONA Seção 3 - Diagnóstico e Terapêutica • Gestão de Insumos e Medicamentos.",
      },
      {
        pergunta: "Onde e como são armazenados os medicamentos de alta vigilância nesta unidade?",
        gabarito:
          "Em local identificado com etiqueta de alerta, segregados dos demais, com dupla checagem na dispensação e administração.",
        diretriz: "Requisito ONA Seção 1.1.17 - Prevenção e Controle • Medicamentos Potencialmente Perigosos (MPP).",
      },
      {
        pergunta: "O que você faz diante de uma prescrição ilegível ou com dúvida na dose?",
        gabarito:
          "Não administro; contato o prescritor para esclarecer e registro a verificação antes de seguir.",
        diretriz: "Requisito ONA Seção 1.1.8 - Protocolos • Comunicação Efetiva.",
      },
      {
        pergunta: "Como é feito o registro da administração e da recusa de medicamento?",
        gabarito:
          "Registro horário, dose e via no prontuário imediatamente após a administração; recusas e eventos são documentados e comunicados.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Registro Assistencial.",
      },
      {
        pergunta: "Como você notifica um erro ou quase-erro de medicação?",
        gabarito:
          "Notifico no sistema de eventos da instituição, sem punição, para análise de causa e melhoria do processo.",
        diretriz: "Requisito ONA Seção 1.1.13 - Notificação • Cultura de Segurança.",
      },
    ],
  },
  {
    id: "identificacao",
    titulo: "Identificação Correta do Paciente",
    keywords: ["identificação", "pulseira", "identificar", "dois identificadores", "nome completo"],
    perguntas: [
      {
        pergunta: "Como você garante a identificação correta deste paciente antes de qualquer cuidado?",
        gabarito:
          "Uso no mínimo dois identificadores (nome completo e data de nascimento), confirmando ativamente com o paciente/acompanhante e conferindo a pulseira.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Protocolo de Identificação do Paciente.",
      },
      {
        pergunta: "Quais dados constam na pulseira de identificação?",
        gabarito: "Nome completo, data de nascimento e registro/atendimento — nunca o número do leito como identificador.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Dois Identificadores.",
      },
      {
        pergunta: "O que você faz se a pulseira estiver ausente, ilegível ou incorreta?",
        gabarito: "Suspendo o procedimento, providencio nova pulseira correta e confirmo os dados antes de prosseguir.",
        diretriz: "Requisito ONA Seção 1.1.8 - Protocolos • Identificação.",
      },
      {
        pergunta: "Como você identifica um paciente desconhecido ou sem condições de responder?",
        gabarito: "Utilizo protocolo institucional de identificação de paciente não identificado com acompanhante/documentos quando disponível.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Identificação Segura.",
      },
      {
        pergunta: "Em que momentos a identificação deve ser reconferida?",
        gabarito: "Antes de medicar, coletar exames, transfundir, transportar e realizar qualquer procedimento.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Metas Internacionais de Segurança.",
      },
    ],
  },
  {
    id: "higienizacao",
    titulo: "Higienização das Mãos e Controle de Infecção",
    keywords: ["higienização", "mãos", "higiene", "infecção", "antissepsia", "álcool", "epi", "biossegurança"],
    perguntas: [
      {
        pergunta: "Quais são os cinco momentos para a higienização das mãos?",
        gabarito:
          "Antes de tocar o paciente, antes de procedimento asséptico, após risco de exposição a fluidos, após tocar o paciente e após tocar superfícies próximas a ele.",
        diretriz: "Requisito ONA Seção 1.1.17 - Prevenção e Controle de Infecção e Biossegurança.",
      },
      {
        pergunta: "Quando usar água e sabão e quando usar preparação alcoólica?",
        gabarito:
          "Água e sabão quando as mãos estão visivelmente sujas ou após contato com esporos; preparação alcoólica nas demais situações de rotina.",
        diretriz: "Requisito ONA Seção 1.1.17 - Prevenção e Controle de Infecção.",
      },
      {
        pergunta: "Como você seleciona e utiliza os EPIs para cada cuidado?",
        gabarito: "Avalio o risco do procedimento e uso EPI adequado (luvas, máscara, avental, óculos), com paramentação e desparamentação corretas.",
        diretriz: "Requisito ONA Seção 1.1.17 - Biossegurança.",
      },
      {
        pergunta: "Como funciona o isolamento de precaução nesta unidade?",
        gabarito: "Sigo a sinalização de precaução (contato, gotículas, aerossóis), com EPI específico e orientação a acompanhantes.",
        diretriz: "Requisito ONA Seção 1.1.17 - Prevenção e Controle de Infecção.",
      },
      {
        pergunta: "Como é monitorada a adesão à higienização das mãos?",
        gabarito: "Por observação/auditoria da CCIH com indicadores e feedback às equipes.",
        diretriz: "Requisito ONA Seção 1.1.14 - Auditoria • Indicadores de PCI.",
      },
    ],
  },
  {
    id: "quedas",
    titulo: "Prevenção de Quedas",
    keywords: ["queda", "morse", "risco de queda", "grade", "contenção", "mobilidade"],
    perguntas: [
      {
        pergunta: "Como você avalia o risco de queda deste paciente?",
        gabarito: "Aplico a escala institucional (ex.: Morse) na admissão e reavalio conforme mudança de condição clínica.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Protocolo de Prevenção de Quedas.",
      },
      {
        pergunta: "Quais medidas você adota para um paciente classificado como alto risco de queda?",
        gabarito:
          "Sinalizo o risco, mantenho grades elevadas, leito baixo e travado, campainha ao alcance, orientação ao paciente/acompanhante e supervisão na deambulação.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Prevenção de Quedas.",
      },
      {
        pergunta: "Como o risco de queda é sinalizado e comunicado à equipe?",
        gabarito: "Por sinalização visual padronizada (ex.: pulseira/placa) e na passagem de plantão.",
        diretriz: "Requisito ONA Seção 1.1.18 - Comunicação.",
      },
      {
        pergunta: "O que você faz após a ocorrência de uma queda?",
        gabarito: "Avalio o paciente, comunico o médico, presto o cuidado necessário, registro no prontuário e notifico o evento.",
        diretriz: "Requisito ONA Seção 1.1.13 - Notificação de Eventos.",
      },
      {
        pergunta: "Como você orienta o acompanhante quanto à prevenção de quedas?",
        gabarito: "Oriento a chamar a equipe antes de levantar o paciente e a manter o ambiente livre de obstáculos.",
        diretriz: "Requisito ONA Seção 1.1.19 - Cuidado Centrado no Paciente.",
      },
    ],
  },
  {
    id: "prontuario",
    titulo: "Prontuário e Registro Assistencial",
    keywords: ["prontuário", "evolução", "registro", "anotação", "checagem", "documentação"],
    perguntas: [
      {
        pergunta: "Quais princípios você segue ao registrar no prontuário?",
        gabarito: "Registro de forma clara, legível, tempestiva, com data, hora e identificação do profissional; sem rasuras.",
        diretriz: "Requisito ONA Seção 1.1.10 - Gestão de Documentos • Registro Assistencial.",
      },
      {
        pergunta: "Com que frequência a evolução do paciente é registrada?",
        gabarito: "Conforme rotina da unidade e sempre que houver mudança no quadro clínico ou intercorrência.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Continuidade do Cuidado.",
      },
      {
        pergunta: "Como é garantida a confidencialidade das informações do paciente?",
        gabarito: "Acesso restrito a profissionais envolvidos no cuidado, com sigilo e proteção de dados.",
        diretriz: "Requisito ONA Seção 1.1.7 - Relacionamento com o Paciente/Cliente • Privacidade.",
      },
      {
        pergunta: "Como você documenta a checagem de prescrições e cuidados realizados?",
        gabarito: "Checo cada item após a execução, com horário e assinatura, garantindo rastreabilidade.",
        diretriz: "Requisito ONA Seção 2 - Atenção ao Paciente • Registro.",
      },
    ],
  },
];

export const generalQuestions: AuditQuestion[] = [
  {
    pergunta: "Qual é a Política e os objetivos de qualidade desta instituição?",
    gabarito:
      "Conheço a missão, visão e valores e entendo meu papel na qualidade e segurança do paciente; sei onde consultar a política.",
    diretriz: "Requisito ONA Seção 1.1.1 - Planejamento Estratégico.",
  },
  {
    pergunta: "O que você faz ao identificar um evento adverso ou near miss?",
    gabarito: "Cuido do paciente primeiro e notifico no sistema institucional para análise e prevenção de recorrência.",
    diretriz: "Requisito ONA Seção 1.1.13 - Notificação • Cultura de Segurança.",
  },
  {
    pergunta: "Como você participa dos protocolos assistenciais da instituição?",
    gabarito: "Sigo os protocolos vigentes, sei onde acessá-los e participo das capacitações e atualizações.",
    diretriz: "Requisito ONA Seção 1.1.8 - Protocolos.",
  },
  {
    pergunta: "O que você faz em caso de incêndio ou emergência (Plano de Contingência)?",
    gabarito: "Conheço as rotas de fuga, os pontos de encontro e meu papel no plano de resposta a emergências.",
    diretriz: "Requisito ONA Seção 1.1.3 - Gestão de Riscos Organizacionais.",
  },
  {
    pergunta: "Como você garante uma comunicação efetiva na passagem de plantão?",
    gabarito: "Uso método padronizado (ex.: SBAR), transmitindo informações completas e confirmando o entendimento.",
    diretriz: "Requisito ONA Seção 1.1.18 - Comunicação Efetiva.",
  },
  {
    pergunta: "Como você assegura o respeito aos direitos e à dignidade do paciente?",
    gabarito: "Garanto privacidade, escuta, consentimento informado e cuidado centrado nas necessidades do paciente.",
    diretriz: "Requisito ONA Seção 1.1.19 - Cuidado Centrado no Paciente.",
  },
  {
    pergunta: "Quais indicadores da sua área são acompanhados e o que eles significam?",
    gabarito: "Conheço os principais indicadores de qualidade/segurança da minha unidade e como contribuo para suas metas.",
    diretriz: "Requisito ONA Seção 1.1.14 - Auditoria e Indicadores.",
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface GeneratedQuestion extends AuditQuestion {
  eixo: string;
}

export function gerarRoteiro(texto: string): {
  perguntas: GeneratedQuestion[];
  eixos: string[];
  generico: boolean;
} {
  const t = normalize(texto);
  const matched = auditAxes.filter((axis) =>
    axis.keywords.some((kw) => t.includes(normalize(kw))),
  );

  if (matched.length === 0) {
    const pool = [...generalQuestions].sort(() => Math.random() - 0.5).slice(0, 6);
    return {
      perguntas: pool.map((p) => ({ ...p, eixo: "Alinhamento Geral ONA" })),
      eixos: ["Alinhamento Geral ONA"],
      generico: true,
    };
  }

  const collected: GeneratedQuestion[] = [];
  matched.forEach((axis) => {
    axis.perguntas.forEach((p) => collected.push({ ...p, eixo: axis.titulo }));
  });

  // Embaralha por eixo mantendo cobertura, limita entre 5 e 8
  const shuffled = collected.sort(() => Math.random() - 0.5);
  const total = Math.min(8, Math.max(5, shuffled.length));
  const perguntas = shuffled.slice(0, total);

  return {
    perguntas,
    eixos: matched.map((a) => a.titulo),
    generico: false,
  };
}