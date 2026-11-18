import { HolidayItem } from '../types/note';

// Curated Bangladesh National, Cultural & Religious Holidays (2025 - 2027)
// Merged at runtime with any live Google Calendar holiday events.
export const CURATED_BANGLADESH_HOLIDAYS: HolidayItem[] = [
  // 2025
  { id: 'bd-2025-02-21', date: '2025-02-21', nameEn: 'Shaheed Day & Int. Mother Language Day', nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস', emoji: '🕊️', type: 'national', accentColor: 'indigo' },
  { id: 'bd-2025-03-26', date: '2025-03-26', nameEn: 'Independence & National Day', nameBn: 'স্বাধীনতা ও জাতীয় দিবস', emoji: '🇧🇩', type: 'national', accentColor: 'teal' },
  { id: 'bd-2025-04-14', date: '2025-04-14', nameEn: 'Pohela Boishakh (Bengali New Year)', nameBn: 'পহেলা বৈশাখ (বাংলা নববর্ষ)', emoji: '🌸', type: 'cultural', accentColor: 'rose' },
  { id: 'bd-2025-05-01', date: '2025-05-01', nameEn: 'May Day', nameBn: 'মে দিবস', emoji: '🛠️', type: 'national', accentColor: 'amber' },
  { id: 'bd-2025-12-16', date: '2025-12-16', nameEn: 'Victory Day', nameBn: 'বিজয় দিবস', emoji: '🇧🇩', type: 'national', accentColor: 'teal' },
  { id: 'bd-2025-12-25', date: '2025-12-25', nameEn: 'Christmas Day', nameBn: 'বড়দিন', emoji: '🎄', type: 'religious', accentColor: 'indigo' },

  // 2026
  { id: 'bd-2026-01-01', date: '2026-01-01', nameEn: "New Year's Day", nameBn: 'ইংরেজি নববর্ষ', emoji: '✨', type: 'cultural', accentColor: 'indigo' },
  { id: 'bd-2026-02-04', date: '2026-02-04', nameEn: 'Shab-e-Barat (Observed)', nameBn: 'শবে বরাত', emoji: '🕯️', type: 'religious', accentColor: 'indigo' },
  { id: 'bd-2026-02-21', date: '2026-02-21', nameEn: 'Shaheed Day & Int. Mother Language Day', nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস', emoji: '🕊️', type: 'national', accentColor: 'indigo' },
  { id: 'bd-2026-03-17', date: '2026-03-17', nameEn: 'Shab-e-Qadr (Observed)', nameBn: 'শবে কদর', emoji: '🌙', type: 'religious', accentColor: 'indigo' },
  { id: 'bd-2026-03-20', date: '2026-03-20', nameEn: 'Jumatul Wida', nameBn: 'জুমাতুল বিদা', emoji: '🕌', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2026-03-21', date: '2026-03-21', nameEn: 'Eid-ul-Fitr (Holiday)', nameBn: 'ঈদুল ফিতর', emoji: '🌙', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2026-03-22', date: '2026-03-22', nameEn: 'Eid-ul-Fitr Holiday', nameBn: 'ঈদুল ফিতরের ছুটি', emoji: '✨', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2026-03-26', date: '2026-03-26', nameEn: 'Independence & National Day', nameBn: 'স্বাধীনতা ও জাতীয় দিবস', emoji: '🇧🇩', type: 'national', accentColor: 'teal' },
  { id: 'bd-2026-04-14', date: '2026-04-14', nameEn: 'Pohela Boishakh (Bengali New Year)', nameBn: 'পহেলা বৈশাখ (বাংলা নববর্ষ)', emoji: '🌸', type: 'cultural', accentColor: 'rose' },
  { id: 'bd-2026-05-01', date: '2026-05-01', nameEn: 'May Day & Buddha Purnima', nameBn: 'মে দিবস ও বুদ্ধ পূর্ণিমা', emoji: '🪷', type: 'national', accentColor: 'amber' },
  { id: 'bd-2026-05-27', date: '2026-05-27', nameEn: 'Eid-ul-Adha (Holiday)', nameBn: 'ঈদুল আযহা', emoji: '🐑', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2026-05-28', date: '2026-05-28', nameEn: 'Eid-ul-Adha Holiday', nameBn: 'ঈদুল আযহার ছুটি', emoji: '🌙', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2026-06-26', date: '2026-06-26', nameEn: 'Ashura (Observed)', nameBn: 'আশুরা', emoji: '🕯️', type: 'religious', accentColor: 'indigo' },
  { id: 'bd-2026-08-05', date: '2026-08-05', nameEn: 'July Uprising Day', nameBn: 'জুলাই গণঅভ্যুত্থান দিবস', emoji: '🇧🇩', type: 'national', accentColor: 'teal' },
  { id: 'bd-2026-08-26', date: '2026-08-26', nameEn: 'Eid-e-Milad-un-Nabi', nameBn: 'ঈদে মিলাদুন্নবী (সা.)', emoji: '🕌', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2026-09-04', date: '2026-09-04', nameEn: 'Janmashtami', nameBn: 'জন্মাষ্টমী', emoji: '🪈', type: 'religious', accentColor: 'amber' },
  { id: 'bd-2026-10-20', date: '2026-10-20', nameEn: 'Durga Puja (Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', emoji: '🪔', type: 'religious', accentColor: 'rose' },
  { id: 'bd-2026-12-16', date: '2026-12-16', nameEn: 'Victory Day', nameBn: 'বিজয় দিবস', emoji: '🇧🇩', type: 'national', accentColor: 'teal' },
  { id: 'bd-2026-12-25', date: '2026-12-25', nameEn: 'Christmas Day', nameBn: 'বড়দিন', emoji: '🎄', type: 'religious', accentColor: 'indigo' },

  // 2027
  { id: 'bd-2027-01-01', date: '2027-01-01', nameEn: "New Year's Day", nameBn: 'ইংরেজি নববর্ষ', emoji: '✨', type: 'cultural', accentColor: 'indigo' },
  { id: 'bd-2027-02-21', date: '2027-02-21', nameEn: 'Shaheed Day & Int. Mother Language Day', nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস', emoji: '🕊️', type: 'national', accentColor: 'indigo' },
  { id: 'bd-2027-03-10', date: '2027-03-10', nameEn: 'Eid-ul-Fitr (Observed)', nameBn: 'ঈদুল ফিতর', emoji: '🌙', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2027-03-26', date: '2027-03-26', nameEn: 'Independence & National Day', nameBn: 'স্বাধীনতা ও জাতীয় দিবস', emoji: '🇧🇩', type: 'national', accentColor: 'teal' },
  { id: 'bd-2027-04-14', date: '2027-04-14', nameEn: 'Pohela Boishakh (Bengali New Year)', nameBn: 'পহেলা বৈশাখ (বাংলা নববর্ষ)', emoji: '🌸', type: 'cultural', accentColor: 'rose' },
  { id: 'bd-2027-05-01', date: '2027-05-01', nameEn: 'May Day', nameBn: 'মে দিবস', emoji: '🛠️', type: 'national', accentColor: 'amber' },
  { id: 'bd-2027-05-17', date: '2027-05-17', nameEn: 'Eid-ul-Adha (Observed)', nameBn: 'ঈদুল আযহা', emoji: '🐑', type: 'religious', accentColor: 'teal' },
  { id: 'bd-2027-10-09', date: '2027-10-09', nameEn: 'Durga Puja (Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', emoji: '🪔', type: 'religious', accentColor: 'rose' },
  { id: 'bd-2027-12-16', date: '2027-12-16', nameEn: 'Victory Day', nameBn: 'বিজয় দিবস', emoji: '🇧🇩', type: 'national', accentColor: 'teal' },
  { id: 'bd-2027-12-25', date: '2027-12-25', nameEn: 'Christmas Day', nameBn: 'বড়দিন', emoji: '🎄', type: 'religious', accentColor: 'indigo' },
];

export function inferHolidayEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('independence') || lower.includes('victory') || lower.includes('uprising')) return '🇧🇩';
  if (lower.includes('language') || lower.includes('shaheed')) return '🕊️';
  if (lower.includes('boishakh') || lower.includes('spring')) return '🌸';
  if (lower.includes('eid') && lower.includes('adha')) return '🐑';
  if (lower.includes('eid') || lower.includes('ramadan') || lower.includes('qadr')) return '🌙';
  if (lower.includes('puja') || lower.includes('diwali')) return '🪔';
  if (lower.includes('buddha')) return '🪷';
  if (lower.includes('christmas')) return '🎄';
  if (lower.includes('may day') || lower.includes('labour')) return '🛠️';
  if (lower.includes('new year')) return '✨';
  return '🎉';
}

export function mergeHolidays(googleHolidays: HolidayItem[]): HolidayItem[] {
  const map = new Map<string, HolidayItem>();
  for (const h of CURATED_BANGLADESH_HOLIDAYS) {
    map.set(`${h.date}::${h.nameEn.toLowerCase()}`, h);
  }
  for (const gh of googleHolidays) {
    // Avoid duplicating exact date if curated already exists for that date with similar topic
    const sameDateExisting = Array.from(map.values()).find((x) => x.date === gh.date);
    if (!sameDateExisting) {
      map.set(`${gh.date}::${gh.nameEn.toLowerCase()}`, gh);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
