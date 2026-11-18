import girl1Img from '../assets/images/avatar_girl_one_1795013173956.jpg';
import girl2Img from '../assets/images/avatar_girl_two_1795013173901.jpg';
import girl3Img from '../assets/images/avatar_girl_three_1795013175004.jpg';
import boy1Img from '../assets/images/avatar_boy_one_1795013190332.jpg';
import boy2Img from '../assets/images/avatar_boy_two_1795013175306.jpg';
import boy3Img from '../assets/images/avatar_boy_three_1795013177340.jpg';

export interface HumanAvatarPreset {
  id: string;
  presetValue: string;
  labelEn: string;
  labelBn: string;
  src: string;
}

export const HUMAN_AVATAR_PRESETS: HumanAvatarPreset[] = [
  {
    id: 'girl_1',
    presetValue: 'preset:girl_1',
    labelEn: '3D Girl 1 · Long Wavy Hair',
    labelBn: '৩ডি মেয়ে ১',
    src: girl1Img,
  },
  {
    id: 'girl_2',
    presetValue: 'preset:girl_2',
    labelEn: '3D Girl 2 · High Bun & Glasses',
    labelBn: '৩ডি মেয়ে ২',
    src: girl2Img,
  },
  {
    id: 'girl_3',
    presetValue: 'preset:girl_3',
    labelEn: '3D Girl 3 · Bob Cut & Hairclip',
    labelBn: '৩ডি মেয়ে ৩',
    src: girl3Img,
  },
  {
    id: 'boy_1',
    presetValue: 'preset:boy_1',
    labelEn: '3D Boy 1 · Curly Hair & Hoodie',
    labelBn: '৩ডি ছেলে ১',
    src: boy1Img,
  },
  {
    id: 'boy_2',
    presetValue: 'preset:boy_2',
    labelEn: '3D Boy 2 · Side Part & Glasses',
    labelBn: '৩ডি ছেলে ২',
    src: boy2Img,
  },
  {
    id: 'boy_3',
    presetValue: 'preset:boy_3',
    labelEn: '3D Boy 3 · Sporty Cap & Smile',
    labelBn: '৩ডি ছেলে ৩',
    src: boy3Img,
  },
];

const PRESET_MAP: Record<string, string> = Object.fromEntries(
  HUMAN_AVATAR_PRESETS.map((item) => [item.presetValue, item.src])
);

export function resolveAvatarSrc(
  customAvatar?: string,
  googlePhotoUrl?: string
): string {
  const trimmed = (customAvatar || '').trim();
  if (trimmed) {
    if (PRESET_MAP[trimmed]) {
      return PRESET_MAP[trimmed];
    }
    return trimmed;
  }
  return googlePhotoUrl || '';
}
