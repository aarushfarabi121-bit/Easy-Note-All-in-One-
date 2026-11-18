import { Language } from '../types/note';

export type GreetingIconKey =
  | 'rocket'
  | 'sparkles'
  | 'flame'
  | 'sun'
  | 'zap'
  | 'trophy'
  | 'target'
  | 'compass';

export interface DailyGreeting {
  emoji: string;
  inspiringEmoji: string;
  icon: GreetingIconKey;
  salutation: string;
  text: string;
}

interface GreetingEntry {
  emoji: string;
  inspiringEmoji: string;
  icon: GreetingIconKey;
  bn: string;
  en: string;
}

const MOTIVATIONAL_GREETINGS: GreetingEntry[] = [
  {
    emoji: '🚀',
    inspiringEmoji: '🌠',
    icon: 'rocket',
    bn: 'ছোট ছোট পদক্ষেপই একদিন বড় সাফল্য এনে দেয়। এগিয়ে চলুন!',
    en: 'Small consistent steps create big breakthroughs. Keep going!',
  },
  {
    emoji: '🌟',
    inspiringEmoji: '✨',
    icon: 'sparkles',
    bn: 'আজকের প্রতিটি ঘণ্টা আপনার লক্ষ্য অর্জনের নতুন সুযোগ।',
    en: 'Every hour today is a fresh chance to move closer to your goals.',
  },
  {
    emoji: '🔥',
    inspiringEmoji: '👑',
    icon: 'flame',
    bn: 'শুরু করার সাহসটাই অর্ধেক জয়—আজই আপনার সেরা দিন!',
    en: 'Courage to begin is half the victory—make today count!',
  },
  {
    emoji: '🌱',
    inspiringEmoji: '🌿',
    icon: 'sun',
    bn: 'প্রতিদিন একটু একটু করে শিখুন ও নিজেকে আরও শক্তিশালী করুন।',
    en: 'Grow a little stronger and wiser with every single day.',
  },
  {
    emoji: '💡',
    inspiringEmoji: '⚡',
    icon: 'zap',
    bn: 'স্পষ্ট পরিকল্পনা কঠিন কাজকেও অনেক সহজ করে তোলে।',
    en: 'A clear plan turns even the hardest goal into simple steps.',
  },
  {
    emoji: '🏆',
    inspiringEmoji: '🥇',
    icon: 'trophy',
    bn: 'ধৈর্য আর পরিশ্রম কখনোই বৃথা যায় না—নিজের ওপর বিশ্বাস রাখুন।',
    en: 'Patience and steady effort always pay off—believe in yourself.',
  },
  {
    emoji: '☀️',
    inspiringEmoji: '🌻',
    icon: 'sun',
    bn: 'নতুন সকাল, নতুন উদ্যম! আজকের কাজগুলো আনন্দের সাথে শেষ করুন।',
    en: 'New day, fresh energy! Tackle today’s tasks with joy.',
  },
  {
    emoji: '🎯',
    inspiringEmoji: '💎',
    icon: 'target',
    bn: 'ফোকাস ধরে রাখুন—আজকের মনোযোগই আগামীর সাফল্য গড়বে।',
    en: 'Stay focused—today’s discipline shapes tomorrow’s success.',
  },
  {
    emoji: '💪',
    inspiringEmoji: '🛡️',
    icon: 'flame',
    bn: 'বাধা আসবেই, কিন্তু আপনার ইচ্ছাশক্তি তার চেয়েও অনেক বড়।',
    en: 'Challenges come, yet your determination is always stronger.',
  },
  {
    emoji: '🌈',
    inspiringEmoji: '✨',
    icon: 'sparkles',
    bn: 'ইতিবাচক চিন্তা দিয়ে দিন শুরু করুন, পথ নিজেই সুন্দর হয়ে যাবে।',
    en: 'Start with a positive mind and watch your path brighten.',
  },
  {
    emoji: '⚡',
    inspiringEmoji: '🚀',
    icon: 'zap',
    bn: 'অপেক্ষা নয়, আজকের ছোট্ট একটি কাজই পরিবর্তন শুরু করতে পারে।',
    en: 'Don’t wait for perfection—one focused action today sparks momentum.',
  },
  {
    emoji: '🌻',
    inspiringEmoji: '💛',
    icon: 'sun',
    bn: 'নিজেকে কখনো কম ভাববেন না—আপনি দারুণ কিছু করার ক্ষমতা রাখেন।',
    en: 'Never underestimate yourself—you are capable of amazing things.',
  },
  {
    emoji: '🧭',
    inspiringEmoji: '⭐',
    icon: 'compass',
    bn: 'সঠিক দিকে এগোনো গতি থেকেও গুরুত্বপূর্ণ। এগিয়ে যান দৃঢ়ভাবে!',
    en: 'Direction matters more than speed—keep moving forward steadily!',
  },
  {
    emoji: '✨',
    inspiringEmoji: '🕊️',
    icon: 'sparkles',
    bn: 'আজকের একটি সম্পন্ন কাজ আগামীকালের জন্য অনেক শান্তি নিয়ে আসবে।',
    en: 'Finishing one key task today brings peace for tomorrow.',
  },
  {
    emoji: '🏎️',
    inspiringEmoji: '💨',
    icon: 'zap',
    bn: 'প্রতিটি নতুন দিন আপনাকে আরও দ্রুত ও দৃঢ়ভাবে এগিয়ে যাওয়ার সুযোগ দেয়।',
    en: 'Each new day invites you to move forward with unstoppable speed and energy.',
  },
  {
    emoji: '📚',
    inspiringEmoji: '🎓',
    icon: 'target',
    bn: 'আজকের প্রস্তুতিই আগামীকালের আত্মবিশ্বাসের মূল শক্তি।',
    en: 'Today’s preparation is the secret behind tomorrow’s confidence.',
  },
];

function getTimeSalutation(date: Date, lang: Language): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return lang === 'bn' ? 'শুভ সকাল' : 'Good Morning';
  }
  if (hour >= 12 && hour < 17) {
    return lang === 'bn' ? 'শুভ অপরাহ্ণ' : 'Good Afternoon';
  }
  if (hour >= 17 && hour < 21) {
    return lang === 'bn' ? 'শুভ সন্ধ্যা' : 'Good Evening';
  }
  return lang === 'bn' ? 'শুভ রাত্রি' : 'Peaceful Night';
}

export function getDailyGreeting(date: Date, lang: Language): DailyGreeting {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diffMs = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const index = (date.getFullYear() * 366 + dayOfYear) % MOTIVATIONAL_GREETINGS.length;
  const picked = MOTIVATIONAL_GREETINGS[index];
  return {
    emoji: picked.emoji,
    inspiringEmoji: picked.inspiringEmoji,
    icon: picked.icon,
    salutation: getTimeSalutation(date, lang),
    text: lang === 'bn' ? picked.bn : picked.en,
  };
}
