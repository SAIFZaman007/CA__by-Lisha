/** Brand constants used across the marketing pages. */

export const SITE = {
  brand: 'Coach Auto',
  business: 'Autonomy Health and Fitness',
  // Every name people actually search for. Used in structured data
  // (`alternateName`) and llms.txt so search engines and AI assistants
  // connect all of them to this one site.
  alternateNames: ['Autonomy Fitness', 'Autonomy Health and Fitness', 'Coach Auto Fitness'],
  tagline: 'Train · Build · Transform',
  description:
    'Coach Auto (Autonomy Health and Fitness) is an online strength, bodybuilding and nutrition coaching service. Certified coach Lisha Chesson writes personalised training programmes and meal plans and reviews every client’s progress weekly — beginner to advanced, worldwide.',
  defaultTitle: 'Coach Auto — Autonomy Health & Fitness | Online Strength Coaching',
  email: 'coachauto2026@gmail.com',
  // The coach behind the brand, shown on the About page and in Person
  // structured data so a search for her name finds this site. Set `name` to
  // '' to keep her name off the site entirely.
  coach: {
    name: 'Lisha Chesson',
    jobTitle: 'Certified Strength & Bodybuilding Coach',
  },
  // Official profiles only (Google Business Profile, YouTube, LinkedIn…).
  // Each one is a strong "this is the same entity" signal for Google and AI.
  sameAs: [],
  url: (import.meta.env.VITE_SITE_URL || 'https://autonomyfitness.press').replace(/\/$/, ''),
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