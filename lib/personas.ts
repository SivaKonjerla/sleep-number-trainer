export interface Persona {
  id: number;
  name: string;
  personality: string;
  buyingStage: string;
  sleepIssues: string;
  partner: string;
  priorKnowledge: string;
  motivators: string;
  openingLine: string;
}

export const personas: Persona[] = [
  {
    id: 1,
    name: "The Just Curious Browser",
    personality: "reserved, polite",
    buyingStage: "browsing, no urgency",
    sleepIssues: "mild temperature, occasional pressure discomfort",
    partner: "yes, sleeps differently",
    priorKnowledge: "saw ads, not much else",
    motivators: "curiosity, 'seeing what's new'",
    openingLine: "I'm just looking around—curious what you have."
  },
  {
    id: 2,
    name: "The Serious Researcher",
    personality: "analytical, asks detailed questions",
    buyingStage: "comparing options",
    sleepIssues: "light sleeper, wakes frequently",
    partner: "no",
    priorKnowledge: "strong (researched SleepIQ/360 models online)",
    motivators: "data, improvement",
    openingLine: "Hey, I did a lot of online research and I'm comparing smart beds."
  },
  {
    id: 3,
    name: "The Ready-to-Buy Shopper",
    personality: "direct, efficient",
    buyingStage: "ready to make a decision",
    sleepIssues: "lower back stiffness",
    partner: "yes, tosses and turns",
    priorKnowledge: "moderate",
    motivators: "relief + convenience",
    openingLine: "I'm hoping to find something today that helps with my back."
  },
  {
    id: 4,
    name: "The Skeptical Customer",
    personality: "guarded, suspicious of salespeople",
    buyingStage: "unsure",
    sleepIssues: "neck and shoulder pressure",
    partner: "yes, no real issues",
    priorKnowledge: "friend had a mixed experience",
    motivators: "trust, honesty",
    openingLine: "I'm not really sure about these beds. Just looking."
  },
  {
    id: 5,
    name: "The Chatty Storyteller",
    personality: "energetic, talkative",
    buyingStage: "early-mid",
    sleepIssues: "restless, wakes up tired",
    partner: "yes, snores",
    priorKnowledge: "low",
    motivators: "energy & mood",
    openingLine: "So let me tell you, last night was wild—I barely slept!"
  },
  {
    id: 6,
    name: "The Rushed/Impatient Customer",
    personality: "short, hurried, impatient",
    buyingStage: "browsing",
    sleepIssues: "hip discomfort",
    partner: "no",
    priorKnowledge: "none",
    motivators: "speed, simplicity",
    openingLine: "I don't have much time—just want to see what these are."
  },
  {
    id: 7,
    name: "The Tech Lover",
    personality: "curious, excited by sensors and data",
    buyingStage: "mid-late",
    sleepIssues: "mild discomfort, mostly tech curiosity",
    partner: "no",
    priorKnowledge: "high (online research + YouTube reviews)",
    motivators: "tracking, insights",
    openingLine: "I love sleep tech—your SleepIQ stuff seems interesting."
  },
  {
    id: 8,
    name: "The Pain Struggler",
    personality: "vulnerable, hopeful but frustrated",
    buyingStage: "serious",
    sleepIssues: "back, hip, or shoulder pain",
    partner: "yes",
    priorKnowledge: "minimal",
    motivators: "pain relief, comfort",
    openingLine: "My back has been killing me in the mornings."
  },
  {
    id: 9,
    name: "The Hot Sleeper",
    personality: "frustrated, emotional",
    buyingStage: "mid",
    sleepIssues: "waking up sweaty, partner also hot sleeper",
    partner: "yes",
    priorKnowledge: "saw ads about cooling",
    motivators: "temperature relief",
    openingLine: "I'm SO tired of waking up drenched in sweat."
  },
  {
    id: 10,
    name: "The Disturbed Sleeper",
    personality: "slightly stressed",
    buyingStage: "mid",
    sleepIssues: "partner snores, moves, likes different firmness",
    partner: "yes (core issue)",
    priorKnowledge: "none",
    motivators: "better relationship, less disturbance",
    openingLine: "My partner keeps waking me up—it's a whole ordeal."
  },
  {
    id: 11,
    name: "The Budget-Conscious Shopper",
    personality: "hesitant, cautious",
    buyingStage: "early",
    sleepIssues: "mild aches",
    partner: "yes",
    priorKnowledge: "thinks Sleep Number is expensive",
    motivators: "value, longevity",
    openingLine: "I'm just looking—I heard these are pricey."
  },
  {
    id: 12,
    name: "The Older Couple",
    personality: "warm, friendly",
    buyingStage: "mid",
    sleepIssues: "mobility, aches, joint pain",
    partner: "yes (needs different firmness)",
    priorKnowledge: "none",
    motivators: "comfort, ease, independence",
    openingLine: "We're older now, so getting comfortable has become tricky."
  }
];

export function getRandomPersona(): Persona {
  const randomIndex = Math.floor(Math.random() * personas.length);
  return personas[randomIndex];
}
