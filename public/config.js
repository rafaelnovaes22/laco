// Personalize a carta aqui. Nenhum outro arquivo precisa ser editado.
// Para usar fotos próprias, coloque-as em public/assets/ e troque os caminhos abaixo.
window.LACO_CONFIG = {
  recipient: 'Nome de quem recebe',
  sender: 'Seu nome',

  intro: {
    kicker: 'Uma mensagem para você',
    text: 'Existe algo que eu queria que você ouvisse.',
    button: 'Abrir',
  },

  hero: {
    kicker: 'Para uma pessoa especial',
    title: 'Sua frase<br />principal.',
    opening: 'Um parágrafo curto de abertura, que prepara quem lê para o que vem a seguir.',
    image: '/assets/placeholder-portrait.svg',
    imageAlt: 'Imagem de abertura',
    caption: 'Uma legenda curta para a imagem.',
  },

  music: {
    kicker: 'Nossa música',
    title: 'O que as palavras não conseguem dizer.',
    note: 'Conte por que escolheu esta música.',
    playerLabel: 'A música escolhida',
    image: '/assets/placeholder-moment.svg',
    imageAlt: 'Imagem da seção de música',
  },

  letter: {
    kicker: 'O que eu precisava dizer',
    paragraphs: [
      'Primeiro parágrafo da carta.',
      'Segundo parágrafo da carta.',
      'Terceiro parágrafo da carta.',
    ],
    closingLine: 'Frase final em destaque.',
  },

  closing: 'Leia no seu tempo.',
};
