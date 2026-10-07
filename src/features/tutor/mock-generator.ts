import { formatTutorReply } from "@/features/tutor/format";
import type { TutorContext, TutorSkillScore, TutorTaskBrief } from "@/features/tutor/types";

const ATTACK_REQUEST =
  /\b(exploit|payload|reverse shell|sql injection|hack into|break into|bypass authentication|privilege escalation)\b/i;

export function generateMockTutorReply(question: string, context: TutorContext): string {
  const asked = question.trim();

  if (ATTACK_REQUEST.test(asked)) {
    return reply({
      explanation:
        "I can help you study the idea at a high level. I will not give attack steps, payloads, or instructions for breaking into a system.",
      points: [
        "Name the concept in your own words.",
        "Practice only in a lab you are allowed to use.",
        "Write down the defensive check, not an attack.",
      ],
      example: "A safe note lists the concept, the risk in plain words, and one control a team would use.",
      practice: [
        "Define the concept in one sentence.",
        "Name one defensive control and why it exists.",
      ],
      next: `${styleStep(context)} Ask for a simple explanation of the concept if you want to keep going.`,
    });
  }

  switch (intent(asked)) {
    case "weak":
      return weakReply(context);
    case "mistake":
      return mistakeReply(context);
    case "today":
      return todayReply(context);
    case "next":
      return nextReply(context);
    case "plan":
      return planReply(asked, context);
    case "roadmap":
      return roadmapReply(context);
    case "practice":
      return practiceReply(asked, context);
    case "example":
      return exampleReply(asked, context);
    case "simplify":
      return explainReply(asked, context, true);
    case "revision":
      return revisionReply(context);
    default:
      return explainReply(asked, context, false);
  }
}

function intent(question: string): string {
  const q = question.toLowerCase();

  if (/weak area|why am i weak|weak in|struggle/.test(q)) {
    return "weak";
  }

  if (/mistake|incorrect|wrong answer|missed question/.test(q)) {
    return "mistake";
  }

  if (/\btoday\b/.test(q)) {
    return "today";
  }

  if (/study next|what next|what should i study/.test(q)) {
    return "next";
  }

  if (/study plan|daily task/.test(q)) {
    return "plan";
  }

  if (/roadmap|milestone|current stage/.test(q)) {
    return "roadmap";
  }

  if (/practice question|quiz me|practice/.test(q)) {
    return "practice";
  }

  if (/example/.test(q)) {
    return "example";
  }

  if (/simplif|simple|easier|plain words/.test(q)) {
    return "simplify";
  }

  if (/revis/.test(q)) {
    return "revision";
  }

  return "explain";
}

function weakReply(context: TutorContext): string {
  const weak = weakest(context.scores);
  const strong = strongest(context.scores);

  if (context.scores.length === 0) {
    const note = context.performanceNote
      ? ` A saved performance note exists, and I will not turn it into a score. It says: ${context.performanceNote}`
      : "";

    return reply({
      explanation: `I do not have submitted quiz answers for you, so I cannot name a weak topic.${note}`,
      points: [
        "A weak area needs saved correct and incorrect answers.",
        "Finish a quiz on the AI Quiz page, then ask again.",
      ],
      example: "After a submitted quiz, I can say which skill was below 80% and how many answers were correct.",
      practice: ["Complete one saved practice quiz.", "Ask again: Help me understand my weak area."],
      next: styleStep(context),
    });
  }

  if (!weak) {
    const best = strong ?? context.scores[0];
    return reply({
      explanation: best
        ? `None of your saved quiz skills are below 80%. The strongest saved skill is "${best.skill}" at ${best.percent}% (${best.correct} of ${best.total} correct).`
        : "None of your saved quiz skills are below 80%.",
      points: [
        "I am not marking a weak area from this evidence.",
        "Keep moving with the next saved task instead of repeating a high score.",
      ],
      example: context.todayTasks[0]
        ? `Your pending task "${context.todayTasks[0].title}" is a better use of this session than another repeat.`
        : "Open the study plan and continue the next unfinished skill.",
      practice: ["Restate the strong skill in one sentence.", "Start the next pending task."],
      next: styleStep(context),
    });
  }

  return reply({
    explanation: `Your saved answers are lowest on "${weak.skill}": ${weak.percent}% (${weak.correct} of ${weak.total} correct). That is the weak area I can support from your quizzes.`,
    points: [
      "Below 50% means revise the idea before new work.",
      "From 50% to 79%, practice the same skill in a shorter task.",
      "I am not adding other weak topics, because those scores are not saved.",
    ],
    example: `Take "${weak.skill}" and write what you can explain today, then mark the part you still mix up.`,
    practice: [
      `Define "${weak.skill}" without looking at notes.`,
      "Check that definition against your study task or quiz explanation.",
    ],
    next: `${styleStep(context)} The adaptive plan page can turn this score into a task if you want it on the plan.`,
  });
}

function mistakeReply(context: TutorContext): string {
  const miss = context.misses[0];

  if (miss) {
    const stored = miss.explanation
      ? ` The saved explanation says: ${miss.explanation}`
      : " This question has no saved explanation, so I will not invent the correct choice.";

    return reply({
      explanation: `On "${miss.skill}", a saved answer was incorrect. The question was: ${miss.prompt}${stored}`,
      points: [
        "Read the question again before looking for a trick.",
        "Compare your last choice with the saved explanation when one exists.",
        "Practice the same skill once more, then stop.",
      ],
      example: "Cover the choices, answer in your own words, then reveal the explanation.",
      practice: [
        "Rewrite the question as a statement you can check.",
        `Name one fact you need before answering a "${miss.skill}" question.`,
      ],
      next: styleStep(context),
    });
  }

  if (context.latestQuiz) {
    return reply({
      explanation: `Your latest submitted quiz has no incorrect answer I can explain. It scored ${context.latestQuiz.percent}% on "${context.latestQuiz.title}" for "${context.latestQuiz.skill}".`,
      points: [
        "There is no missed question to unpack.",
        "Use the next study task instead of reviewing a perfect attempt.",
      ],
      example: "If a later quiz has a wrong answer, ask again and I will use that saved question.",
      practice: ["Open the next pending task.", "Take a quiz on a skill you have not scored yet."],
      next: styleStep(context),
    });
  }

  return reply({
    explanation: "I do not have a submitted quiz, so I cannot explain a mistake.",
    points: ["Submit a quiz first.", "I will not guess which question you missed."],
    example: "After you submit, ask: Explain my latest quiz mistake.",
    practice: ["Finish one practice quiz.", "Ask about that attempt."],
    next: styleStep(context),
  });
}

function todayReply(context: TutorContext): string {
  if (!context.planTitle) {
    return missingPlan("today's tasks");
  }

  if (context.todayTasks.length === 0) {
    const upcoming = context.upcomingTasks[0];
    return reply({
      explanation: upcoming
        ? `No task is scheduled for today on "${context.planTitle}". The next saved task is "${upcoming.title}" on ${upcoming.scheduledOn}.`
        : `No pending task is saved on "${context.planTitle}".`,
      points: ["I am only listing tasks already on your plan.", "I am not creating a new task from this chat."],
      example: "Open Daily Tasks to confirm the list matches what you see here.",
      practice: ["If the list is empty, add one task on the study plan.", "Then ask again what to study today."],
      next: styleStep(context),
    });
  }

  return reply({
    explanation: `Study the pending work already scheduled for today on "${context.planTitle}".`,
    points: context.todayTasks.slice(0, 3).map((task) => taskLine(task)),
    example: "Start with the first pending task and finish it before opening a new topic.",
    practice: ["Do the first task for its saved duration.", "Mark it complete only after you finish it."],
    next: styleStep(context),
  });
}

function nextReply(context: TutorContext): string {
  const today = context.todayTasks[0];
  const weak = weakest(context.scores);

  if (today) {
    return reply({
      explanation: `Study "${today.title}" next. It is pending on ${today.scheduledOn} for the skill "${today.skill}".`,
      points: [
        weak
          ? `A saved weak skill is "${weak.skill}" at ${weak.percent}% (${weak.correct} of ${weak.total}). Use it only if it is the same skill as this task.`
          : "No saved quiz skill is below 80%.",
        context.adaptiveNote
          ? `Your latest adaptive note says: ${context.adaptiveNote}`
          : "There is no saved adaptive recommendation to add.",
      ],
      example: "Stay on this task until it is done. Do not skip to a later roadmap stage.",
      practice: [`Work on "${today.skill}" once.`, "Check the task off when the work is actually finished."],
      next: styleStep(context),
    });
  }

  if (weak) {
    return reply({
      explanation: `No task is pending today. The weakest saved quiz skill is "${weak.skill}" at ${weak.percent}% (${weak.correct} of ${weak.total} correct).`,
      points: [
        "Revise that skill before adding a brand-new topic.",
        context.adaptiveNote
          ? `Saved adaptive note: ${context.adaptiveNote}`
          : "No adaptive recommendation is saved.",
      ],
      example: `Write a short explanation of "${weak.skill}" and compare it with your notes.`,
      practice: ["Add a revision task on the study plan if you want it scheduled.", "Retake a quiz on that skill after the revision."],
      next: styleStep(context),
    });
  }

  if (context.upcomingTasks[0]) {
    const upcoming = context.upcomingTasks[0];
    return reply({
      explanation: `Nothing is pending for today, and no saved quiz skill is below 80%. The next scheduled task is "${upcoming.title}" on ${upcoming.scheduledOn}.`,
      points: ["I am not inventing a new topic.", "You can start that task early if you have time."],
      example: "Keep the session short and stop when the task is done.",
      practice: ["Read the task title and skill.", "Do one pass, then stop."],
      next: styleStep(context),
    });
  }

  return reply({
    explanation: "I do not have a pending task, a weak quiz skill, or a later scheduled task to recommend.",
    points: [
      context.planTitle ? `Your current plan is "${context.planTitle}", and its pending list is empty.` : "No current study plan is saved.",
      context.scores.length === 0 ? "No submitted quiz answers are saved." : "Saved quiz skills are all at 80% or above.",
    ],
    example: "Add a task on the study plan, or take a quiz, then ask again.",
    practice: ["Save one concrete task.", "Ask what to study next after it exists."],
    next: styleStep(context),
  });
}

function planReply(question: string, context: TutorContext): string {
  const topic = topicFrom(question, context);

  if (!context.planTitle) {
    return missingPlan(topic ? `"${topic}"` : "this topic");
  }

  const focus = topic ?? context.stageTitle;

  return reply({
    explanation: focus
      ? `Your current plan is "${context.planTitle}". For ${focus}, use the tasks already saved instead of a second plan.`
      : `Your current plan is "${context.planTitle}". Tell me a topic if you want a study sequence for it.`,
    points: [
      ...context.todayTasks.slice(0, 2).map((task) => `Today: ${taskLine(task)}`),
      context.todayTasks.length === 0 ? "No task is scheduled for today." : "Finish today's task before adding another.",
    ].slice(0, 3),
    example: focus
      ? `A short sequence for ${focus}: recall the idea, try one example, then check it against the task notes.`
      : "Name the topic and I can outline a short sequence. I will not save a new plan from this chat.",
    practice: [
      "Open the study plan and confirm the task is still pending.",
      "Add a task there if this topic is missing.",
    ],
    next: styleStep(context),
  });
}

function roadmapReply(context: TutorContext): string {
  if (!context.roadmapTitle || !context.stageTitle) {
    return reply({
      explanation: "I do not have a current roadmap stage saved, so I cannot tell you where you are on the path.",
      points: ["Generate a roadmap from the Future Planner first.", "I will not invent stages."],
      example: "After a roadmap is saved, ask how the current stage fits your goal.",
      practice: ["Open the Future Planner.", "Save the roadmap, then return here."],
      next: styleStep(context),
    });
  }

  const skills = context.stageSkills.slice(0, 3);

  return reply({
    explanation: `Your current roadmap is "${context.roadmapTitle}". The stage in front of you is "${context.stageTitle}".${context.goalTitle ? ` It supports your goal, ${context.goalTitle}.` : ""}`,
    points: skills.length > 0 ? skills.map((skill) => `Skill in this stage: ${skill}`) : ["This stage has no saved skills."],
    example: "Stay inside this stage until its pending tasks are done.",
    practice: ["Name the stage in one sentence.", "Pick the first skill and connect it to today's task."],
    next: styleStep(context),
  });
}

function practiceReply(question: string, context: TutorContext): string {
  const topic = topicFrom(question, context);

  if (!topic) {
    return needTopic("practice questions");
  }

  const miss = context.misses[0];

  return reply({
    explanation: `Here are practice questions for "${topic}". ${learnerLine(context)} They are study prompts, not a saved quiz score.`,
    points: [
      "Answer without notes first.",
      "Then check your notes or a saved explanation.",
      miss ? `You also missed a saved question on "${miss.skill}".` : "No incorrect saved question is attached to this prompt.",
    ],
    example: `Work one question at a time. Stop after two if you cannot explain the answer.`,
    practice: [
      `What is the main idea of "${topic}", in one or two sentences?`,
      `Give one example of "${topic}" from ${context.field ?? "your field"}, then say what would make that example fail.`,
      miss ? `Retry this saved question in your own words: ${miss.prompt}` : `What should you do next after you understand "${topic}"?`,
    ].slice(0, 3),
    next: styleStep(context),
  });
}

function exampleReply(question: string, context: TutorContext): string {
  const topic = topicFrom(question, context);

  if (!topic) {
    return needTopic("an example");
  }

  return reply({
    explanation: `${beginnerLead(context)}A simple example of "${topic}" is enough. You do not need the whole subject at once.`,
    points: [
      "One concrete case beats a long definition.",
      context.goalTitle ? `Keep the case inside your goal, ${context.goalTitle}.` : "I do not have a career goal saved, so the example stays general.",
    ],
    example: exampleText(topic, context),
    practice: [
      `Change one detail in the example and say what happens.`,
      `Write your own example of "${topic}" in two sentences.`,
    ],
    next: styleStep(context),
  });
}

function revisionReply(context: TutorContext): string {
  const weak = weakest(context.scores);
  const task = context.todayTasks[0];

  if (weak && weak.percent < 80) {
    return reply({
      explanation: `Revise "${weak.skill}" first. Your saved score is ${weak.percent}% (${weak.correct} of ${weak.total} correct).`,
      points: [
        "Recall without notes.",
        "Check the part you missed.",
        "Stop after one short pass.",
      ],
      example: "Close the notes, explain the skill, then open the notes and mark one gap.",
      practice: ["Write three facts you are sure about.", "Write one fact you still mix up."],
      next: styleStep(context),
    });
  }

  if (task) {
    return reply({
      explanation: `No saved quiz skill is below 80%. Revise the pending task "${task.title}" and its skill "${task.skill}".`,
      points: ["Use the task you already saved.", "Do not add a new topic for this revision."],
      example: "Spend the task's saved time on recall, then one check.",
      practice: ["Restate the skill.", "Mark the task complete only if the revision is done."],
      next: styleStep(context),
    });
  }

  return reply({
    explanation: "I do not have a weak quiz skill or a pending task to revise.",
    points: ["Take a quiz or add a task first.", "I will not invent a revision list."],
    example: "A useful revision always names a saved skill.",
    practice: ["Submit a quiz or save a task.", "Ask for revision guidance again."],
    next: styleStep(context),
  });
}

function explainReply(question: string, context: TutorContext, forceSimple: boolean): string {
  const topic = topicFrom(question, context);
  const simple = forceSimple || context.skillLevel === "beginner";

  if (!topic) {
    return needTopic("an explanation");
  }

  const lead = simple
    ? `In plain words, "${topic}" is the idea you can explain to someone who is just starting.`
    : `"${topic}" is the idea to understand before you add more detail.`;

  return reply({
    explanation: `${beginnerLead(context)}${lead} ${contextLine(context)}`,
    points: [
      "Say what it is.",
      "Say why it matters for the work in front of you.",
      simple ? "Ignore extra terms until this version is clear." : "Add one precise term only after the simple version is clear.",
    ],
    example: exampleText(topic, context),
    practice: [
      `Explain "${topic}" in two sentences without notes.`,
      "Point to the part you still cannot say.",
    ],
    next: styleStep(context),
  });
}

function missingPlan(subject: string): string {
  return reply({
    explanation: `I do not have a current study plan, so I cannot walk through ${subject}.`,
    points: ["Create the plan on the study plan page.", "This chat does not save tasks for you."],
    example: "Once a plan exists, ask again and I will use its pending tasks.",
    practice: ["Open the study plan.", "Save one task tied to your roadmap."],
    next: "Return here after the plan is saved.",
  });
}

function needTopic(kind: string): string {
  return reply({
    explanation: `I need a topic before I can give you ${kind}. No current study focus is saved.`,
    points: ["Name the concept in your question.", "Or save a study task so I can use its skill."],
    example: "You can ask: Explain two-factor authentication with a simple example.",
    practice: ["Type the topic you want.", "Send the question again."],
    next: "I will stay on that topic and will not guess one.",
  });
}

function reply(parts: {
  explanation: string;
  points: string[];
  example: string;
  practice: string[];
  next: string;
}): string {
  return formatTutorReply({
    explanation: parts.explanation,
    points: parts.points.filter((point) => point.trim().length > 0).slice(0, 4),
    example: parts.example,
    practice: parts.practice.slice(0, 3),
    next: parts.next,
  });
}

function topicFrom(question: string, context: TutorContext): string | null {
  const named = namedTopic(question);
  if (named) {
    return named;
  }

  return (
    context.todayTasks[0]?.skill ??
    context.stageSkills[0] ??
    context.stageTitle ??
    context.field ??
    null
  );
}

function namedTopic(question: string): string | null {
  const patterns = [
    /explain (.+?) to me/i,
    /explain (.+)/i,
    /what is (?:a |an |the )?(.+)/i,
    /simplify (.+)/i,
    /example of (.+)/i,
    /practice questions (?:on|about|for) (.+)/i,
    /study plan for (.+)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    const value = cleanupTopic(match?.[1] ?? "");

    if (value) {
      return value;
    }
  }

  return null;
}

function cleanupTopic(value: string): string | null {
  const cleaned = value
    .replace(/\b(this topic|this concept|the current study topic|a simple example|with a simple example|to me|please)\b/gi, "")
    .replace(/[?.!]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 3 || /^(it|that|me|to me|topic|concept)$/i.test(cleaned)) {
    return null;
  }

  return cleaned.slice(0, 140);
}

function weakest(scores: TutorSkillScore[]): TutorSkillScore | null {
  return scores
    .filter((score) => score.percent < 80)
    .sort((left, right) => left.percent - right.percent)[0] ?? null;
}

function strongest(scores: TutorSkillScore[]): TutorSkillScore | null {
  return [...scores].sort((left, right) => right.percent - left.percent)[0] ?? null;
}

function taskLine(task: TutorTaskBrief): string {
  return `${task.title} (${task.skill}, scheduled ${task.scheduledOn})`;
}

function learnerLine(context: TutorContext): string {
  if (context.skillLevel === "beginner") {
    return "The wording stays short because your skill level is beginning.";
  }

  if (context.skillLabel) {
    return `Your skill level is ${context.skillLabel.toLowerCase()}.`;
  }

  return "Your skill level is not saved, so this stays direct.";
}

function beginnerLead(context: TutorContext): string {
  return context.skillLevel === "beginner" ? "I will keep this short. " : "";
}

function contextLine(context: TutorContext): string {
  const bits = [
    context.field ? `Your field is ${context.field}.` : null,
    context.goalTitle ? `Your goal is ${context.goalTitle}.` : "I do not have a career goal saved.",
    context.stageTitle ? `Your current stage is ${context.stageTitle}.` : null,
  ].filter((bit): bit is string => Boolean(bit));

  return bits.join(" ");
}

function exampleText(topic: string, context: TutorContext): string {
  const place = context.field ?? "your studies";
  const wantsCode = /\b(code|function|sql|javascript|python|algorithm)\b/i.test(topic);

  if (!wantsCode) {
    return `Suppose you are working in ${place}. You meet one case of "${topic}", you say what you notice, and you write the one decision that case forces. That is the whole example.`;
  }

  return [
    `In ${place}, a tiny check is enough to see the idea of "${topic}":`,
    "```",
    "function ready(note) {",
    "  return note.trim().length > 0;",
    "}",
    "```",
    "The function only checks that a note exists. It is a study sketch, not a system to deploy.",
  ].join("\n");
}

function styleStep(context: TutorContext): string {
  switch (context.learningStyle) {
    case "reading":
      return "Next, write the idea in a short note.";
    case "practice":
      return "Next, try the idea on one small task.";
    case "video":
      return "Next, restate the idea out loud in one sentence.";
    case "mixed":
      return "Next, write one note and try one short practice.";
    default:
      return "Next, restate the idea in your own words.";
  }
}
