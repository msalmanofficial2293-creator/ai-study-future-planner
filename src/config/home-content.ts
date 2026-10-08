export const heroPath = [
  { title: "Goal", detail: "Name the career outcome you are studying toward." },
  { title: "Roadmap", detail: "Get an ordered path of skills and milestones." },
  { title: "Study Plan", detail: "Turn the roadmap into tasks you can schedule." },
  { title: "Daily Tasks", detail: "Focus on the work due today." },
  { title: "Quiz", detail: "Practice what you just studied." },
  { title: "Progress", detail: "See scores, completion, and gaps." },
  { title: "Adapt", detail: "Adjust priorities from your results." },
  { title: "Tutor", detail: "Ask questions tied to your saved plan." },
  { title: "Personalize", detail: "Get focus and difficulty recommendations." },
] as const;

export const howItWorks = [
  {
    title: "Create Your Profile",
    body: "Share your education, field, skills, study time, learning style, and career goal during onboarding.",
  },
  {
    title: "Build Your Roadmap",
    body: "Generate a structured learning roadmap from your goal and current context on Future Planner.",
  },
  {
    title: "Plan Your Study",
    body: "Organize milestones into a study plan and daily tasks you can schedule and complete.",
  },
  {
    title: "Practice & Measure",
    body: "Use quizzes and performance tracking to see scores, completion, and where you are strong or weak.",
  },
  {
    title: "Adapt & Learn",
    body: "Apply adaptive recommendations, personalization insights, and tutor guidance that stay on your goal.",
  },
] as const;

export const features = [
  {
    title: "Personalized Future Planning",
    body: "Capture your career goal and learning context so every later step stays tied to the same destination.",
  },
  {
    title: "AI Future Roadmap",
    body: "Generate an ordered path of skills and milestones from your goal, education, and study preferences.",
  },
  {
    title: "Study Plan",
    body: "Turn roadmap stages into scheduled tasks with subjects, duration, and linked milestones.",
  },
  {
    title: "Daily Tasks",
    body: "See today’s work, upcoming sessions, and completed tasks in one focused list.",
  },
  {
    title: "AI Quiz",
    body: "Practice skills from your plan with scored attempts, explanations, and saved history.",
  },
  {
    title: "Performance Tracking",
    body: "Review task completion, quiz averages, trends, strong areas, and weak areas from saved activity.",
  },
  {
    title: "Adaptive Study Plan",
    body: "Get rule-based next steps from quiz results and apply recommended tasks to your current plan.",
  },
  {
    title: "AI Tutor",
    body: "Ask study questions in the context of your goal, stage, tasks, and recent results.",
  },
  {
    title: "AI Personalization",
    body: "See recommended focus, difficulty, learning style cues, and next steps based on your saved data.",
  },
  {
    title: "User Profile",
    body: "View and update identity, education, goals, password, and notification preferences in one place.",
  },
] as const;

export const reasons = [
  {
    title: "Goal-first learning",
    body: "Daily work exists because it moves a chosen career future forward.",
  },
  {
    title: "One connected journey",
    body: "Roadmap, plan, tasks, practice, and review belong to the same path.",
  },
  {
    title: "Personalized planning",
    body: "The path is shaped around the goal and context you save, not a generic course list.",
  },
  {
    title: "Daily execution",
    body: "A plan becomes a clear next session instead of another pile of intentions.",
  },
  {
    title: "Performance-based adaptation",
    body: "What you learn—and where you struggle—shapes what you study next.",
  },
  {
    title: "Guided study support",
    body: "Tutor and personalization stay on your goal and saved work, rather than open-ended chat.",
  },
] as const;

export const journeySteps = [
  {
    title: "Goal",
    summary: "Name the career outcome your studies are meant to reach.",
  },
  {
    title: "AI Future Roadmap",
    summary: "Turn that goal into an ordered path of skills and milestones.",
  },
  {
    title: "Study Plan",
    summary: "Shape the roadmap into scheduled tasks you can follow.",
  },
  {
    title: "Daily Tasks",
    summary: "Work in focused sessions for today, upcoming days, and completed work.",
  },
  {
    title: "AI Quiz",
    summary: "Check understanding with practice tied to skills on your plan.",
  },
  {
    title: "Performance Tracking",
    summary: "See progress, gaps, and consistency as the work accumulates.",
  },
  {
    title: "Adaptive Study Plan",
    summary: "Review recommended changes and apply them to your current plan.",
  },
  {
    title: "AI Tutor",
    summary: "Get guidance that stays connected to your goal and your work.",
  },
  {
    title: "AI Personalization",
    summary: "See focus, difficulty, and next-step recommendations from your results.",
  },
] as const;

export const benefits = [
  {
    title: "Know what to study",
    body: "Your roadmap orders skills and milestones instead of leaving the subject open-ended.",
  },
  {
    title: "Know what to do next",
    body: "Daily tasks name the next session, not a vague intention to study.",
  },
  {
    title: "Connect daily work to a bigger goal",
    body: "Each session stays linked to the career future you chose.",
  },
  {
    title: "Identify learning gaps",
    body: "Quizzes and performance show which skills are still unsteady.",
  },
  {
    title: "Build consistency",
    body: "A visible next step makes the following day easier to start.",
  },
  {
    title: "Adjust the plan based on progress",
    body: "Adaptive recommendations and personalization revise priorities when results change.",
  },
] as const;

export const faqs = [
  {
    question: "What is AI Study Future Planner?",
    answer:
      "It is a personalized learning platform that helps you turn a career goal into a connected journey: profile and goal setup, a future roadmap, study plan, daily tasks, quizzes, performance insights, adaptive recommendations, AI tutoring, and personalization.",
  },
  {
    question: "Who is it for?",
    answer:
      "Individual students who know a future they want and need a path from that outcome to daily study. It is not a school administration system, grade book, or classroom manager.",
  },
  {
    question: "How does the learning journey work?",
    answer:
      "After you create an account and complete onboarding, you set a goal, generate a roadmap, build study and daily tasks, practice with quizzes, review performance, apply adaptive updates, talk with the tutor, and use personalization insights. You take each step in the app; the product does not run the whole journey automatically.",
  },
  {
    question: "How does the AI functionality work?",
    answer:
      "The current development version uses structured, rule-based and mock AI features so the product can be tested and refined without requiring a paid AI API. Roadmap, quiz, tutor, adaptive, and personalization flows are designed so a secure live AI provider can be connected later.",
  },
  {
    question: "Does the planner save my progress?",
    answer:
      "Yes. Your profile, goals, roadmap, study plan, tasks, quiz activity, performance records, adaptive recommendations, tutor conversations, and personalization decisions are stored on your signed-in account so you can continue across sessions.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your account data is protected using authenticated access and database-level access controls. Passwords are handled by the authentication service. Only your signed-in session can reach your study records through the app.",
  },
  {
    question: "Is the platform free?",
    answer:
      "You can create an account and use the current product without a payment flow on this site. Pricing for a future public launch has not been decided, and nothing here is for sale today.",
  },
  {
    question: "Do I need a paid AI API key?",
    answer:
      "No. The study features you use after sign-in work in free development mode with local generators and rules. A paid provider key is optional for separate connectivity checks and is never required in the browser.",
  },
] as const;
