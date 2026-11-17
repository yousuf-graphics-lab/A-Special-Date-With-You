/**
 * Every word Samiya reads lives here, so the wording stays human and easy to
 * edit. Line breaks are preserved exactly as written.
 */

export const SITE = {
  title: "For Samee, My Love",
  recipient: "Samiya",
  nickname: "Samee",
  author: "Yousuf",
  description:
    "A little something made just for Samee. Unlock it when you are ready, my love.",
};

export const LOCK = {
  heading: "Hey, My Samee",
  subtitle:
    "I have something special for you. But before you enter, there's one little thing only you should know.",
  placeholder: "Enter your special date",
  button: "Unlock My Surprise",
  error: "Oops, my love! Try once more.",
  hint: "Psst… it is the date that started everything.",
};

export const LETTER = {
  eyebrow: "Something From My Heart",
  salutation: "My Dearest Samiya,",
  paragraphs: [
    "Jano Samee, majhe majhe bhabi tomake amar jibone peye ami kotota lucky. Hoyto protidin shob kotha thikmoto bola hoy na, hoyto shob shomoy bujhiye uthte pari na tumi amar kache kotota special. But believe me, tumi amar jiboner emon ekta manush jar sathe choto choto moment guloo amar kache onek shundor hoye jay.",
    "Tomar sathe kotha bola, tomar hashi, tomar choto choto abdar, tomar rag kora, abar shob kichur majheo tomar oi nijer moto thaka, shob kichui amar onek priyo.",
    "Ami jani na future amader jonno ki likhe rekheche. But ami chai amader protita shundor moment nijeder moto kore toiri korte. Tomar sathe kichu shomoy katate, onek golpo korte, eksathe haste, ar emon kichu memory banate chai jegulo pore mone korle dujoner mukhei hashi chole ashbe.",
    "Samee, tumi amar kache shudhu ekjon special manush na. Tumi amar ekta onek shundor onubhuti. Ar ami chai tomar sathe aro onek shundor din katate.",
    "Tai ajke tomar jonno amar ekta chotto surprise ache. Kono boro kichu na, just tomar sathe amar ekta special din katano r ichha.",
    "Will you let me make a beautiful memory with you?",
  ],
  closing: "Always yours,",
  signoff: "Tomar preme pagol chele,",
  signature: "Yousuf",
  cta: "There's Something More For You",
};

export const PROPOSAL = {
  heading: "Samee, Can I Steal A Day With You?",
  body: "I don't need a perfect day. I just want a day with you, where we can laugh, talk, enjoy little moments, and create a memory that belongs only to us.",
  question: "So, my dear sweetheart, will you go on a special date with me?",
  accept: "YES, MY LOVE",
  think: "LET ME THINK",
  thinkResponse: "Take your time, my Pakhi. I want you to feel happy and comfortable.",
};

export const PLANNER = {
  heading: "Let's Plan Our Little Date",
  subtitle: "This time, you get to decide how our special day should look.",
  sections: {
    date: "Choose Your Date",
    dateHint: "Only days that are still ahead of us, in Bangladesh time.",
    time: "Choose Your Time",
    timeHint: "Pick a slot, or tell me your own time.",
    place: "Choose Our Place",
    placeHint: "Nothing is fixed. If you have somewhere else in mind, say it.",
    activity: "Choose Our Date Activity",
    activityHint: "You can pick more than one, my love.",
    message: "A Little Message For Me",
    messageLabel: "Is there anything you want to tell me before our special day?",
    messagePlaceholder: "Anything you want, my love. I'm listening...",
    messageOptional: "Optional",
    review: "One Last Look",
    reviewHint: "Change anything you like before we save it.",
  },
  customTime: "A different time",
  customPlace: "Somewhere else in mind?",
  customPlacePlaceholder: "Write the place you are thinking of…",
  customActivity: "Tell me what you have in mind…",
  save: "Save Our Little Plan",
  saving: "Saving our little plan…",
  edit: "Edit my choices",
  success: "Saved, my love.",
};

export const BOUQUET = {
  heading: "For You, My Beautiful Pakhi",
  paragraphs: [
    "Jodi prithibir shob shundor ful ekshatheo tomake dewa jay, tobuo amar mone hoy tomar hashi tar cheyeo beshi shundor.",
    "Ei chotto bouquet ta tomar jonno, Samee. Just a little reminder that someone out here thinks you're incredibly special.",
  ],
  cta: "One More Little Surprise",
};

export const FINALE = {
  heading: "Thank You, My Love",
  greeting: "My Dear Sweetheart,",
  paragraphs: [
    "Thank you for being a part of my little world. I don't know how our special day will turn out, but I already know that having you beside me will make it beautiful.",
    "I hope we get to laugh a lot, share silly stories, enjoy our favorite moments, and create memories that we will remember for a long time.",
    "I am really looking forward to our little date.",
    "Until then, keep smiling, my Samee.",
  ],
  closing: "With all my love,",
  signoff: "Tomar preme pagol chele,",
  signature: "Yousuf",
  cardTitle: "Our Little Date",
  footer: "Made with an entire heart by Yousuf, only for Samiya.",
};

/** Read the letter aloud, section by section, for the writing animation. */
export const LETTER_REVEAL_BLOCKS = [
  LETTER.salutation,
  ...LETTER.paragraphs,
  LETTER.closing,
  LETTER.signoff,
  LETTER.signature,
];
