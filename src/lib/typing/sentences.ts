// Real-world sentence banks + famous quotes.
// "Real world" mode lets users practice on sentences people actually type
// in daily messages, work emails, literature, film, and idioms.

import type { QuoteLength, RealWorldCategory } from "./types";

export const CATEGORY_META: Record<
  RealWorldCategory | "mixed",
  { label: string; blurb: string }
> = {
  mixed: { label: "Mixed", blurb: "A blend of every category" },
  everyday: { label: "Everyday", blurb: "Daily conversations & messages" },
  tech: { label: "Tech", blurb: "Tech, code & internet talk" },
  literature: { label: "Literature", blurb: "Classic lines from books" },
  movies: { label: "Movies", blurb: "Iconic lines from film" },
  idioms: { label: "Idioms", blurb: "Sayings, proverbs & idioms" },
  business: { label: "Business", blurb: "Professional email phrases" },
};

const EVERYDAY: string[] = [
  "Hey, good morning! Did you sleep well last night?",
  "I'll grab coffee on my way, want me to get you anything?",
  "Sorry I'm running late, traffic is worse than usual today.",
  "Can we move our call to sometime tomorrow afternoon instead?",
  "Thanks so much for your help yesterday, it really meant a lot.",
  "Let me know when you get home safe, okay?",
  "I was thinking we could order pizza and watch a movie tonight.",
  "Don't forget your umbrella, it's supposed to rain later.",
  "Have you eaten anything since this morning? You should eat something.",
  "I'll text you the address once I get there, give me a minute.",
  "That sounds amazing! Count me in for the weekend trip.",
  "I just checked the weather and it looks clear for Saturday.",
  "Could you pick up milk and eggs on your way back home?",
  "Honestly, I didn't expect the movie to be that good.",
  "We should definitely do this again sometime soon.",
  "My phone battery is about to die, so call me on the landline.",
  "I finished the book you lent me, the ending was incredible.",
  "Do you remember the name of that restaurant we loved last summer?",
  "I'm so proud of you for how far you've come this year.",
  "Let's take a short walk after dinner, the evening air is nice.",
  "I'll be working from home tomorrow, so ping me anytime.",
  "Can you believe it's already October? This year flew by.",
  "She said she'd arrive around seven, so we still have time.",
  "I made some soup, there's plenty left if you're hungry.",
  "We need to water the plants before we leave for the trip.",
  "That new coffee shop downtown is worth the hype, honestly.",
  "I keep telling him to slow down, but he never listens.",
  "Text me when you're outside and I'll come down.",
];

const TECH: string[] = [
  "The function returns a promise that resolves once the data loads.",
  "I pushed the fix to the main branch, can you review the pull request?",
  "Have you tried turning it off and on again? Classic first step.",
  "The server is responding with a five hundred error, check the logs.",
  "We're migrating the database to a new cluster this weekend.",
  "Type your password carefully, the field is case sensitive.",
  "The keyboard shortcut control shift P opens the command palette.",
  "My laptop has sixteen gigabytes of RAM and it still lags sometimes.",
  "Always commit your changes before switching between branches.",
  "The API endpoint expects a JSON payload with two required fields.",
  "Let's pair program on this bug, two heads are better than one.",
  "The deployment pipeline runs tests automatically on every commit.",
  "Clearing your browser cache fixes the strangest issues sometimes.",
  "I refactor legacy code when I need a break from new features.",
  "The query was slow until we added an index on the timestamp column.",
  "Never store API keys in your repository, use environment variables.",
  "The documentation says the feature ships in the next release.",
  "We're dropping support for older browsers starting next month.",
  "A good type system catches bugs before your code ever runs.",
  "The meeting notes are in the shared folder, take a look when you can.",
  "I wrote a script that renames all the files in one go.",
  "Version control saved my work more times than I can count.",
  "The app now works offline thanks to service workers and caching.",
  "Let's spin up a staging environment and test the changes there.",
  "Hardware is fast, but bad algorithms are slow forever.",
  "She debugged the memory leak by profiling the running process.",
  "The bot automatically closes issues that have been inactive for weeks.",
  "Back up your files in two different places, always.",
];

const LITERATURE: string[] = [
  "It was the best of times, it was the worst of times.",
  "Call me Ishmael. Some years ago, never mind how long precisely...",
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
  "All happy families are alike; each unhappy family is unhappy in its own way.",
  "The past is a foreign country: they do things differently there.",
  "In our village, folks say God crumbles up the old moon into stars.",
  "Whatever our souls are made of, his and mine are the same.",
  "I took the one less traveled by, and that has made all the difference.",
  "It is only with the heart that one can see rightly.",
  "The only way out is through, and the only way through is together.",
  "Not all those who wander are lost; some simply enjoy the journey.",
  "A reader lives a thousand lives before he dies, the man who never reads lives only one.",
  "The world breaks everyone, and afterward, some are strong at the broken places.",
  "Children see magic because they look for it.",
  "We are all in the gutter, but some of us are looking at the stars.",
  "There is nothing either good or bad, but thinking makes it so.",
  "The old order changeth, yielding place to new.",
  "Do I dare disturb the universe? In a minute there is time.",
  "I have measured out my life with coffee spoons.",
  "Beauty is truth, truth beauty, that is all ye know on earth.",
  "The sun also rises, and the moon follows quietly after.",
  "Beware; for I am fearless, and therefore powerful.",
  "Nothing behind me, everything ahead of me, as is ever so on the road.",
  "So we beat on, boats against the current, borne back ceaselessly into the past.",
  "Time flies over us, but leaves its shadow behind.",
  "The mystery of life isn't a problem to solve, but a reality to experience.",
];

const MOVIES: string[] = [
  "May the Force be with you, always.",
  "I'll be back, and you'd better be ready.",
  "You can't handle the truth!",
  "Here's looking at you, kid.",
  "There's no place like home, there really isn't.",
  "I'm going to make him an offer he can't refuse.",
  "Life is like a box of chocolates, you never know what you're gonna get.",
  "You talking to me? Well, I'm the only one here.",
  "I feel the need, the need for speed.",
  "To infinity and beyond, my friends!",
  "Why so serious? Let's put a smile on that face.",
  "I see dead people, they're everywhere.",
  "Say hello to my little friend!",
  "Elementary, my dear Watson, quite elementary indeed.",
  "Keep your friends close, but your enemies closer.",
  "I'll have what she's having, thank you very much.",
  "You had me at hello, you truly did.",
  "Nobody puts Baby in a corner.",
  "I am your father, search your feelings, you know it to be true.",
  "Just keep swimming, just keep swimming.",
  "Hasta la vista, baby.",
  "My precious, my own, my love.",
  "You shall not pass! Not on my watch.",
  "Great power comes with great responsibility, always remember that.",
  "I'm king of the world! At least for this moment.",
  "There's no crying in baseball!",
  "The first rule of fight club is you do not talk about fight club.",
  "Carpe diem. Seize the day, boys. Make your lives extraordinary.",
];

const IDIOMS: string[] = [
  "Don't count your chickens before they hatch.",
  "The early bird catches the worm, or so they say.",
  "A penny for your thoughts, you seem lost in them.",
  "Actions speak louder than words, now more than ever.",
  "Barking up the wrong tree won't help you find the answer.",
  "When it rains, it pours, and this week proves it.",
  "Don't put all your eggs in one basket, diversify your plans.",
  "Every cloud has a silver lining, even this one.",
  "Hit the nail on the head with that observation.",
  "It takes two to tango, so let's work on it together.",
  "Kill two birds with one stone by combining the trips.",
  "Let sleeping dogs lie; bringing it up will only cause trouble.",
  "Once in a blue moon, everything aligns perfectly.",
  "Piece of cake! That exam was easier than expected.",
  "Spill the beans, we all know you know something.",
  "The ball is in your court now, make your move.",
  "Time flies when you're having fun, doesn't it?",
  "You can't judge a book by its cover, so keep reading.",
  "Bite the bullet and get it over with today.",
  "Burn the midnight oil if the deadline demands it.",
  "Curiosity killed the cat, but satisfaction brought it back.",
  "Don't beat around the bush, just tell me plainly.",
  "Every dog has its day, and yours is coming.",
  "Give someone the benefit of the doubt once in a while.",
  "Practice makes perfect, or at least much better.",
  "The grass is always greener on the other side of the fence.",
  "Where there's smoke, there's fire, so investigate carefully.",
  "You can lead a horse to water, but you can't make it drink.",
];

const BUSINESS: string[] = [
  "Thank you for reaching out, I appreciate your patience on this matter.",
  "I'm writing to follow up on our conversation from last week.",
  "Please find the attached report for your review and feedback.",
  "Could we schedule a quick call to discuss the project timeline?",
  "I wanted to circle back and see if you had any questions for me.",
  "Per my last email, the deliverables are due this Friday afternoon.",
  "Let me know if you need anything else from my side.",
  "I'll keep you posted as things develop on our end.",
  "Great work on the presentation, the client loved the proposal.",
  "Looking forward to hearing your thoughts on the draft.",
  "Just a gentle reminder about the meeting scheduled for tomorrow.",
  "We're aiming to launch the new feature by the end of the quarter.",
  "Please let me know your availability for early next week.",
  "Thanks for flagging that, I'll look into it right away.",
  "The team has made significant progress since our last check-in.",
  "I'd love to get your input before we finalize the budget.",
  "Attached is the agenda; feel free to suggest additional topics.",
  "Happy to hop on a call if that's easier for you.",
  "We appreciate your business and look forward to continuing the partnership.",
  "Could you confirm receipt of this message at your earliest convenience?",
  "The proposal looks good overall, with a few minor revisions needed.",
  "I'm copying my colleague so she can add her perspective.",
  "Let's touch base next week to review the analytics together.",
  "Thanks in advance for your help with the onboarding process.",
  "The invoice has been processed and payment is on its way.",
  "To summarize, we agreed on three key action items moving forward.",
  "I apologize for the delayed response, it's been a busy week.",
  "Please advise on how you'd like us to proceed with the request.",
];

export const REAL_WORLD_BANK: Record<RealWorldCategory, string[]> = {
  everyday: EVERYDAY,
  tech: TECH,
  literature: LITERATURE,
  movies: MOVIES,
  idioms: IDIOMS,
  business: BUSINESS,
};

/** Build a stream of real-world sentences (shuffled, low repetition). */
export function makeSentenceStream(categories: RealWorldCategory[]): () => string {
  let pool: string[] = [];
  const refill = () => {
    pool = [];
    for (const cat of categories) {
      pool.push(...REAL_WORLD_BANK[cat]);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  };
  refill();
  let last = "";
  return () => {
    if (pool.length === 0) refill();
    let s = pool.pop()!;
    if (s === last && pool.length > 0) {
      const tmp = pool.pop()!;
      pool.push(s);
      s = tmp;
    }
    last = s;
    return s;
  };
}

/** Fill a target word count with real-world sentences. */
export function buildRealWorldWords(
  categories: RealWorldCategory[],
  targetWords: number
): string[] {
  const stream = makeSentenceStream(categories);
  const words: string[] = [];
  while (words.length < targetWords) {
    const sentence = stream();
    words.push(...sentence.split(/\s+/));
  }
  return words;
}

// ---------- Quotes ----------

export interface Quote {
  text: string;
  source: string;
}

export const QUOTES: Quote[] = [
  { text: "Stay hungry, stay foolish.", source: "Steve Jobs" },
  { text: "Simplicity is the ultimate sophistication.", source: "Leonardo da Vinci" },
  { text: "Less is more.", source: "Ludwig Mies van der Rohe" },
  { text: "Talk is cheap. Show me the code.", source: "Linus Torvalds" },
  { text: "Programs must be written for people to read.", source: "Harold Abelson" },
  { text: "Any fool can write code that a computer can understand.", source: "Martin Fowler" },
  { text: "First, solve the problem. Then, write the code.", source: "John Johnson" },
  { text: "Make it work, make it right, make it fast.", source: "Kent Beck" },
  {
    text: "The best way to predict the future is to invent it.",
    source: "Alan Kay",
  },
  {
    text: "The most disastrous thing that you can ever learn is your first programming language.",
    source: "Alan Kay",
  },
  {
    text: "Programming is not about typing, it's about thinking. The typing is just how we share those thoughts with machines and with each other.",
    source: "Rich Hickey",
  },
  {
    text: "The computer was born to solve problems that did not exist before, and it has been inventing new ones ever since with remarkable creativity.",
    source: "Bill Gates",
  },
  {
    text: "It always seems impossible until it's done. Then, looking back, you wonder why you ever doubted yourself in the first place.",
    source: "Nelson Mandela",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep going, keep trying, keep learning.",
    source: "Winston Churchill",
  },
  {
    text: "Whether you think you can, or you think you can't, you're right. Your beliefs shape your reality far more than you realize.",
    source: "Henry Ford",
  },
  {
    text: "The only true wisdom is in knowing that you know nothing. Question everything, stay curious, and never stop exploring the world around you.",
    source: "Socrates",
  },
  {
    text: "In the middle of difficulty lies opportunity. Every challenge carries within it the seeds of growth, if you are willing to look for them.",
    source: "Albert Einstein",
  },
  {
    text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work. And the only way to do great work is to love what you do.",
    source: "Steve Jobs",
  },
  {
    text: "The journey of a thousand miles begins with a single step. Do not be discouraged by how far you have to go; be encouraged by how far you have already come.",
    source: "Lao Tzu",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act but a habit, formed one small decision at a time, day after day.",
    source: "Aristotle",
  },
  {
    text: "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference in where I stand today.",
    source: "Robert Frost",
  },
  {
    text: "The unexamined life is not worth living. Pause, reflect, and ask yourself whether the path you walk is truly your own.",
    source: "Socrates",
  },
  {
    text: "Practice does not make perfect. Only perfect practice makes perfect, so slow down, focus on accuracy, and speed will follow naturally.",
    source: "Vince Lombardi",
  },
  {
    text: "Fast is fine, but accuracy is everything. In typing, as in marksmanship and in life, precision beats raw speed every single time.",
    source: "Wyatt Earp",
  },
  {
    text: "Slow is smooth, and smooth is fast. Rushing leads to mistakes, and mistakes cost more time than patience ever will.",
    source: "Navy SEAL saying",
  },
  {
    text: "The expert in anything was once a beginner who refused to give up. Every master you admire started exactly where you are right now.",
    source: "Helen Hayes",
  },
  {
    text: "Do not fear mistakes. There are none in music, in art, or in learning; there are only experiments that teach you something new.",
    source: "Miles Davis",
  },
  {
    text: "Everything is hard before it is easy. The struggle you feel today is the strength you will carry into every tomorrow that follows.",
    source: "Johann Wolfgang von Goethe",
  },
  {
    text: "Perseverance is not a long race; it is many short races one after the other, each one run with the same heart as the first.",
    source: "Walter Elliot",
  },
  {
    text: "Quality is never an accident. It is always the result of intelligent effort, careful attention, and the honest desire to make something that lasts.",
    source: "John Ruskin",
  },
  {
    text: "What we plant in the soil of contemplation, we shall reap in the harvest of action. Thoughtful work today becomes effortless skill tomorrow.",
    source: "Meister Eckhart",
  },
];

function quoteLengthOf(q: Quote): "short" | "medium" | "long" {
  const len = q.text.length;
  if (len < 100) return "short";
  if (len < 220) return "medium";
  return "long";
}

/** Pick a random quote of the requested size. */
export function pickQuote(length: QuoteLength): Quote {
  let pool = QUOTES;
  if (length !== "all") {
    pool = QUOTES.filter((q) => quoteLengthOf(q) === length);
    if (pool.length === 0) pool = QUOTES;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
