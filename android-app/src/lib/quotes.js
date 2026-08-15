import { todayKey } from './dates';

// The same 36 quotes as the web app, picked by hashing the dateKey so the
// quote is stable all day and changes at the 4am rollover.
const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small, consistent steps move the needle further than big, rare ones.",
  "You don't have to feel motivated. You just have to show up.",
  "Today's effort is a deposit into a future you haven't met yet.",
  "Consistency turns ordinary effort into extraordinary results.",
  "The days you don't feel like it are the days that count the most.",
  "Progress is quiet. Trust the process even when it's boring.",
  "Every rep, every dose, every log — it all compounds.",
  "You're not starting over. You're continuing.",
  "Nobody regrets showing up for themselves.",
  "The best time to take care of yourself was yesterday. The next best time is now.",
  "One good day builds momentum. Stack a few together.",
  "Your future self is watching. Make them proud.",
  "Discomfort today, strength tomorrow.",
  "Habits are the compound interest of self-improvement.",
  "Small wins, tracked daily, become a life transformed.",
  "You don't need to be perfect. You need to be consistent.",
  "The tracker doesn't lie — and neither does your effort.",
  "Show up for the version of you that hasn't arrived yet.",
  "Slow progress is still progress.",
  "What gets measured gets managed.",
  "Discipline weighs ounces. Regret weighs tons.",
  "Every log is a promise kept to yourself.",
  "You are one decision away from a totally different day.",
  "Energy invested in yourself is never wasted.",
  "Momentum loves consistency.",
  "Today's checkbox is tomorrow's confidence.",
  "It's not about motivation. It's about identity — become the person who shows up.",
  "The comeback is always stronger than the setback.",
  "Small daily improvements are the key to staggering long-term results.",
  "Your only competition is who you were yesterday.",
  "Effort compounds quietly until one day it's obvious.",
  "Take care of your body. It's the only place you have to live.",
  "You don't have to see the whole staircase, just take the next step.",
  "The work you do today is invisible until suddenly it isn't.",
  "Keep the promise you made to yourself.",
];

export function quoteOfTheDay() {
  const dk = todayKey();
  let hash = 0;
  for (let i = 0; i < dk.length; i++) hash = (hash * 31 + dk.charCodeAt(i)) | 0;
  return QUOTES[Math.abs(hash) % QUOTES.length];
}
