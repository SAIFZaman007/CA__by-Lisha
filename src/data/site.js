/** Brand constants used across the marketing pages. */

const SAME_AS = String(import.meta.env.VITE_SAME_AS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => /^https:\/\/\S+$/.test(value))

export const SITE = {
  brand: 'Coach Auto',
  business: 'Autonomy Health and Fitness',

  alternateNames: [
    'Autonomy Fitness',
    'Autonomy Health and Fitness',
    'Autonomy Health & Fitness',
    'Coach Auto Fitness',
    'Coach Auto by Lisha Chesson',
  ],
  tagline: 'Train · Build · Transform',
  slogan: 'Built on discipline. Delivered with results.',
  description:
    'Coach Auto (Autonomy Health and Fitness, also called Autonomy Fitness) is an online strength, bodybuilding and nutrition coaching service run by certified coach Lisha Chesson. Personalised training programmes, meal plans and weekly progress reviews — beginner to advanced, worldwide.',
  // The home page title. Leads with the two brand names people type, then
  // the coach, inside ~60 characters so Google does not truncate it.
  defaultTitle: 'Coach Auto — Autonomy Fitness | Online Coaching by Lisha Chesson',
  email: 'coachauto2026@gmail.com',
  // The coach behind the brand, shown on the About page and in Person
  // structured data so a search for her name finds this site. Set `name` to
  // '' to keep her name off the site entirely.
  coach: {
    name: 'Lisha Chesson',
    // She trades publicly as "Coach Auto"; the alias ties the two together.
    alternateName: 'Coach Auto',
    jobTitle: 'Certified Strength & Bodybuilding Coach',
    description:
      'Lisha Chesson is a certified strength and bodybuilding coach and the founder of Coach Auto (Autonomy Health and Fitness), coaching clients online with personalised training programmes, meal plans and weekly progress reviews.',
    credential: 'CPD-accredited Strength & Bodybuilding Coach certification',
    image: '/images/hero-portrait.png',
  },
  sameAs: SAME_AS,
  url: (import.meta.env.VITE_SITE_URL || 'https://autonomyfitness.press').replace(/\/$/, ''),
}

/**
 * The searches each public page is written to answer. Google ignores the
 * keywords meta tag for ranking; these exist so titles, headings and copy on
 * each page stay aimed at one cluster instead of all pages competing for the
 * same words. Bing still reads the tag as a weak hint.
 */
export const KEYWORDS = {
  home: [
    'Coach Auto',
    'Autonomy Fitness',
    'Autonomy Health and Fitness',
    'Lisha Chesson',
    'online strength coaching',
    'online fitness coach',
  ],
  about: [
    'Lisha Chesson',
    'Lisha Chesson coach',
    'Coach Auto',
    'female strength coach',
    'certified bodybuilding coach',
  ],
  programs: [
    'online strength training programme',
    'online personal training with meal plan',
    'beginner strength coaching',
    'bodybuilding coaching online',
    'Coach Auto programmes',
  ],
  contact: ['contact Coach Auto', 'free fitness consultation', 'online coach consultation'],
}

export const STATS = [
  { value: '30+', label: 'Years under the bar' },
  { value: '200+', label: 'Coached sessions delivered' },
  { value: '3', label: 'Levels, beginner to advanced' },
  { value: '100%', label: 'Programmes written by hand' },
]

export const FAQS = [
  {
    question: 'What is online strength coaching?',
    answer:
      'You train in your own gym on a programme written for you. Coach Auto sets your sessions, sets and rep ranges, reviews the logs you enter each week, and adjusts the plan based on what your numbers and measurements actually do.',
  },
  {
    question: 'How many days a week will I train?',
    answer:
      'Level 1 is three days a week, Level 2 is four, and Level 3 is five to six. You start where your training history puts you, and move up when your technique and recovery can carry the extra work.',
  },
  {
    question: 'Do I need a gym membership?',
    answer:
      'A standard commercial gym covers every programme. If you train at home, tell Coach Auto what equipment you have and your sessions will be written around it.',
  },
  {
    question: 'What is included with coaching?',
    answer:
      'A personalised training programme, a meal plan with macro targets, the full exercise video library, weekly check-ins with weight, tape measurements and photos, sleep and cardio tracking, and direct messaging with your coach.',
  },
  {
    question: 'How do I track my progress?',
    answer:
      'Everything lives in your client portal. You log your sets, weight, tape measurements, sleep and cardio as you go, and the dashboard shows the trend over time so nothing is left to memory.',
  },
  {
    question: 'Can I start as a complete beginner?',
    answer:
      'Yes. Level 1 assumes no experience. It teaches the movement patterns before it loads them, and every exercise has a video showing exactly how it should look.',
  },
]

export const PROCESS = [
  {
    step: 'Assessment',
    detail:
      'You send height, weight, tape measurements and starting photos. Coach Auto reads them and places you at the right level.',
  },
  {
    step: 'Your programme',
    detail:
      'Training days, sets and rep ranges written for you, with a meal plan and macro targets to match your phase.',
  },
  {
    step: 'The work',
    detail:
      'You train and log it. Sets, weight, sleep and cardio go into the portal as you go, not from memory a week later.',
  },
  {
    step: 'Weekly review',
    detail:
      'Coach Auto reads your logs and check-in, then adjusts. Progressive overload only works when someone is watching the numbers.',
  },
]