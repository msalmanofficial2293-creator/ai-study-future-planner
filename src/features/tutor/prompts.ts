export const SUGGESTED_PROMPTS = [
  "Explain this topic to me",
  "Help me understand my weak area",
  "Give me practice questions",
  "Create a study plan for this topic",
  "Explain this concept with a simple example",
] as const;

export const QUICK_ACTIONS = [
  { label: "Explain Topic", prompt: "Explain the current study topic" },
  { label: "Practice Questions", prompt: "Give me practice questions" },
  { label: "Review Weak Areas", prompt: "Help me understand my weak area" },
  { label: "Study Today's Tasks", prompt: "What should I study today?" },
  { label: "Explain Quiz Mistake", prompt: "Explain my latest quiz mistake" },
  { label: "What Should I Study Next?", prompt: "What should I study next?" },
] as const;

export const TUTOR_MESSAGE_MAX = 2000;
