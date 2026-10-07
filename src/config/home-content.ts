export const heroPath = [
  { title: "Goal", detail: "Name the future you are studying for." },
  { title: "Roadmap", detail: "Order the skills that lead there." },
  { title: "Study Plan", detail: "Turn the roadmap into a plan you can follow." },
  { title: "Daily Tasks", detail: "Give today a specific piece of work." },
  { title: "Practice", detail: "Check what you just studied." },
  { title: "Progress", detail: "See gaps, then adjust the path." },
] as const;

export const howItWorks = [
  {
    title: "Define Your Goal",
    body: "Name the future outcome your studies are meant to reach. The goal comes before the task list.",
  },
  {
    title: "Build Your Roadmap",
    body: "The roadmap is designed to turn that goal into skills and milestones, in an order you can follow.",
  },
  {
    title: "Follow Your Study Plan",
    body: "The study plan is designed to shape the roadmap into work you can schedule and finish.",
  },
  {
    title: "Practice & Measure",
    body: "Practice is designed to check what you studied. Performance is designed to show progress, gaps, and consistency.",
  },
  {
    title: "Adapt & Improve",
    body: "Later work is designed to change when results show what needs attention, without leaving the same goal.",
  },
] as const;

export const features = [
  {
    title: "AI Future Roadmap",
    body: "Designed to turn one goal into an ordered path of skills and milestones.",
  },
  {
    title: "Study Plan",
    body: "Designed to shape that roadmap into a plan a student can actually follow.",
  },
  {
    title: "Daily Tasks",
    body: "Designed to turn the plan into focused sessions instead of an open-ended list.",
  },
  {
    title: "AI Quiz",
    body: "Designed to check understanding with practice tied to what was just studied.",
  },
  {
    title: "Performance Tracking",
    body: "Designed to show progress, gaps, and consistency as the work accumulates.",
  },
  {
    title: "Adaptive Study Plan",
    body: "Designed to revise later work when results show what needs attention.",
  },
  {
    title: "AI Tutor",
    body: "Designed to give guidance that stays connected to the goal and the work already done.",
  },
] as const;

export const reasons = [
  {
    title: "Goal-first learning",
    body: "Daily work should exist because it moves a chosen future forward.",
  },
  {
    title: "One connected journey",
    body: "Roadmap, plan, tasks, practice, and review are meant to belong to the same path.",
  },
  {
    title: "Personalized planning",
    body: "The path is designed around the goal a student names, not a generic course list.",
  },
  {
    title: "Daily execution",
    body: "A plan should become a clear next session, not another pile of intentions.",
  },
  {
    title: "Performance-based adaptation",
    body: "What a student learns, and where they struggle, should shape what they study next.",
  },
  {
    title: "AI guidance",
    body: "Help is designed to stay on the goal and the work already done, rather than become a separate chat.",
  },
] as const;

export const journeySteps = [
  {
    title: "Goal",
    summary: "Name the future outcome your studies are meant to reach.",
  },
  {
    title: "AI Future Roadmap",
    summary: "Turn that goal into an ordered path of skills and milestones.",
  },
  {
    title: "Study Plan",
    summary: "Shape the roadmap into a plan you can actually follow.",
  },
  {
    title: "Daily Tasks",
    summary: "Work in focused sessions instead of an open-ended list.",
  },
  {
    title: "AI Quiz",
    summary: "Check understanding with practice tied to what you studied.",
  },
  {
    title: "Performance Tracking",
    summary: "See progress, gaps, and consistency as the work accumulates.",
  },
  {
    title: "Adaptive Study Plan",
    summary: "Adjust the plan when results show what needs attention.",
  },
  {
    title: "AI Tutor",
    summary: "Get guidance that stays connected to your goal and your work.",
  },
] as const;

export const benefits = [
  {
    title: "Know what to study",
    body: "The roadmap is designed to order skills instead of leaving the subject open.",
  },
  {
    title: "Know what to do next",
    body: "Daily tasks are designed to name the next session, not a vague intention to study.",
  },
  {
    title: "Connect daily work to a bigger goal",
    body: "Each session is meant to belong to the future the student chose.",
  },
  {
    title: "Identify learning gaps",
    body: "Practice and performance are designed to show what is still unsteady.",
  },
  {
    title: "Build consistency",
    body: "A visible next step is meant to make the following day easier to start.",
  },
  {
    title: "Adjust the plan based on progress",
    body: "The adaptive plan is designed to revise later work when results change.",
  },
] as const;

export const faqs = [
  {
    question: "What is AI Study Future Planner?",
    answer:
      "It is a study platform designed to turn one future goal into a connected learning journey: a roadmap, a study plan, daily tasks, practice, progress, and guidance. A signed-in student can save a development roadmap, study tasks, daily tasks, a development quiz, a performance view, and a rule-based adaptive update of the current study plan. Tutoring is not open yet.",
  },
  {
    question: "Who is it for?",
    answer:
      "Individual students who know a future they want and need a path from that outcome to daily study. It is not a school administration system, grade book, or classroom manager.",
  },
  {
    question: "How does the AI roadmap work?",
    answer:
      "The AI Future Roadmap turns one goal into an ordered set of skills and milestones. A signed-in student can generate a development roadmap from Future Planner. It does not call a paid AI provider.",
  },
  {
    question: "Can I create a personalized study plan?",
    answer:
      "A signed-in student can save study tasks from the current roadmap on the Study Plan page. A separate adaptive page can add tasks from saved quiz scores. It does not call a paid AI provider.",
  },
  {
    question: "Will the plan adapt to my progress?",
    answer:
      "A signed-in student can open Adaptive Study Plan, review rule-based changes from saved quiz scores, and apply those tasks to the current study plan. It does not call a paid AI provider.",
  },
  {
    question: "Is the platform free?",
    answer:
      "Pricing has not been decided. Nothing on this site is for sale. You can read this explanation without signing in. Creating an account does not start a paid plan.",
  },
  {
    question: "Will there be an AI tutor?",
    answer:
      "An AI tutor is planned. It is meant to answer in the context of your goal and the work already done, not as a separate general chat. It is not available yet.",
  },
  {
    question: "Is my data secure?",
    answer:
      "You can create an account and sign in. This site does not store a goal, plan, quiz result, or other study record. Passwords are handled by the authentication service. Study data will require sign-in before it is stored.",
  },
] as const;
