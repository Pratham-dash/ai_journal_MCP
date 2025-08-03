import { createFiberplane, createOpenAPISpec } from "@fiberplane/hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import { Hono } from "hono";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("AI-Powered Productivity Journal API");
});

// Create a new mental dump and trigger AI processing
app.post("/api/mental-dumps", async (c) => {
  const db = drizzle(c.env.DB);
  const { content, userId = "default-user" } = await c.req.json();

  if (!content || content.trim().length === 0) {
    return c.json({ error: "Content is required" }, 400);
  }

  try {
    // Create mental dump
    const [mentalDump] = await db.insert(schema.mentalDumps).values({
      userId,
      rawContent: content,
    }).returning();

    const analysisPrompt = `Analyze this mental dump and extract structured information:

Content: "${content}"

Please identify and return in JSON format:
1. Tasks (array of objects with title, description, estimatedDuration in minutes)
2. Emotions (array of objects with emotion, intensity: low/medium/high, context)
3. Blockers (array of objects with blocker, type: resource/skill/time/external/emotional, severity: low/medium/high)
4. Energy assessment (low/medium/high)
5. Urgency signals (array of objects with signal, urgencyLevel: low/medium/high)

Return only valid JSON.`;

    // Trigger AI analysis
    const aiResponse = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are an AI assistant that analyzes mental dumps and extracts structured information. Always respond with valid JSON." },
        { role: "user", content: analysisPrompt }
      ],
    });

    let aiAnalysis;
    try {
      // Handle Cloudflare Workers AI response format
      const responseText = (aiResponse as any).response || JSON.stringify(aiResponse);
      aiAnalysis = JSON.parse(responseText);
    } catch (parseError) {
      // Create a basic analysis from the content if AI parsing fails
      const contentLower = content.toLowerCase();
      aiAnalysis = {
        tasks: [
          { title: "Review mental dump", description: "Process the thoughts shared", estimatedDuration: 30 }
        ],
        emotions: contentLower.includes('overwhelm') || contentLower.includes('stress') ? 
          [{ emotion: "overwhelmed", intensity: "medium", context: "multiple tasks" }] : [],
        blockers: contentLower.includes('don\'t know') ? 
          [{ blocker: "unclear priorities", type: "skill", severity: "medium" }] : [],
        energyAssessment: "medium",
        urgencySignals: contentLower.includes('tomorrow') || contentLower.includes('deadline') ? 
          [{ signal: "time pressure", urgencyLevel: "high" }] : []
      };
    }

    // Store AI insights
    const [aiInsights] = await db.insert(schema.aiInsights).values({
      mentalDumpId: mentalDump.id,
      identifiedTasks: aiAnalysis.tasks || [],
      identifiedEmotions: aiAnalysis.emotions || [],
      identifiedBlockers: aiAnalysis.blockers || [],
      energyAssessment: aiAnalysis.energyAssessment || "medium",
      urgencySignals: aiAnalysis.urgencySignals || [],
    }).returning();

    // Update mental dump as processed
    await db.update(schema.mentalDumps)
      .set({ processedAt: new Date() })
      .where(eq(schema.mentalDumps.id, mentalDump.id));

    return c.json({
      mentalDump,
      aiInsights
    }, 201);

  } catch (error) {
    return c.json({ 
      error: "Failed to process mental dump",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get user's mental dumps with pagination
app.get("/api/mental-dumps", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.query("userId") || "default-user";
  const limit = Number.parseInt(c.req.query("limit") || "10");
  const offset = Number.parseInt(c.req.query("offset") || "0");
  const includeProcessed = c.req.query("include_processed") === "true";

  try {
    const conditions = [eq(schema.mentalDumps.userId, userId)];
    
    if (!includeProcessed) {
      conditions.push(eq(schema.mentalDumps.processedAt, null as any));
    }

    const mentalDumps = await db.select()
      .from(schema.mentalDumps)
      .where(and(...conditions))
      .orderBy(desc(schema.mentalDumps.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({ mentalDumps });
  } catch (error) {
    return c.json({ 
      error: "Failed to fetch mental dumps",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get specific mental dump with all associated data
app.get("/api/mental-dumps/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  try {
    const [mentalDump] = await db.select()
      .from(schema.mentalDumps)
      .where(eq(schema.mentalDumps.id, id));

    if (!mentalDump) {
      return c.json({ error: "Mental dump not found" }, 404);
    }

    // Get AI insights
    const [aiInsights] = await db.select()
      .from(schema.aiInsights)
      .where(eq(schema.aiInsights.mentalDumpId, id));

    // Get follow-up questions
    const followUpQuestions = await db.select()
      .from(schema.followUpQuestions)
      .where(eq(schema.followUpQuestions.mentalDumpId, id))
      .orderBy(desc(schema.followUpQuestions.createdAt));

    // Get action plans
    const actionPlans = await db.select()
      .from(schema.actionPlans)
      .where(eq(schema.actionPlans.mentalDumpId, id))
      .orderBy(desc(schema.actionPlans.createdAt));

    return c.json({
      mentalDump,
      aiInsights,
      followUpQuestions,
      actionPlans
    });
  } catch (error) {
    return c.json({ 
      error: "Failed to fetch mental dump",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Generate intelligent follow-up questions
app.post("/api/mental-dumps/:id/generate-questions", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  try {
    const [mentalDump] = await db.select()
      .from(schema.mentalDumps)
      .where(eq(schema.mentalDumps.id, id));

    if (!mentalDump) {
      return c.json({ error: "Mental dump not found" }, 404);
    }

    const [aiInsights] = await db.select()
      .from(schema.aiInsights)
      .where(eq(schema.aiInsights.mentalDumpId, id));

    if (!aiInsights) {
      return c.json({ error: "AI insights not found. Process the mental dump first." }, 404);
    }

    const questionPrompt = `Based on this mental dump analysis, generate 3-5 intelligent follow-up questions to gather missing information:

Original content: "${mentalDump.rawContent}"
Identified tasks: ${JSON.stringify(aiInsights.identifiedTasks)}
Identified emotions: ${JSON.stringify(aiInsights.identifiedEmotions)}
Identified blockers: ${JSON.stringify(aiInsights.identifiedBlockers)}

Generate questions that would help clarify:
- Task deadlines and priorities
- Resource requirements
- Dependencies between tasks
- Emotional support needs
- Energy planning

Return as JSON array with objects containing: questionText, questionType (task_clarification, deadline_inquiry, priority_assessment, resource_check, dependency_mapping, energy_planning)`;

    const response = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are an AI assistant that generates intelligent follow-up questions. Always respond with valid JSON." },
        { role: "user", content: questionPrompt }
      ],
    });

    let questions;
    try {
      // Handle Cloudflare Workers AI response format
      const responseText = (response as any).response || JSON.stringify(response);
      questions = JSON.parse(responseText);
      if (!Array.isArray(questions)) {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      questions = [
        { questionText: "What are the deadlines for these tasks?", questionType: "deadline_inquiry" },
        { questionText: "Which task should be prioritized first?", questionType: "priority_assessment" },
        { questionText: "What resources do you need to complete these tasks?", questionType: "resource_check" }
      ];
    }

    // Store questions in database
    const createdQuestions = [];
    for (const question of questions) {
      const [createdQuestion] = await db.insert(schema.followUpQuestions).values({
        mentalDumpId: id,
        questionText: question.questionText,
        questionType: question.questionType,
      }).returning();
      createdQuestions.push(createdQuestion);
    }

    return c.json({ questions: createdQuestions });
  } catch (error) {
    return c.json({ 
      error: "Failed to generate questions",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Answer a follow-up question
app.post("/api/questions/:id/answer", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const { answer } = await c.req.json();

  if (!answer || answer.trim().length === 0) {
    return c.json({ error: "Answer is required" }, 400);
  }

  try {
    const [updatedQuestion] = await db.update(schema.followUpQuestions)
      .set({
        answerText: answer,
        isAnswered: true,
        answeredAt: new Date(),
      })
      .where(eq(schema.followUpQuestions.id, id))
      .returning();

    if (!updatedQuestion) {
      return c.json({ error: "Question not found" }, 404);
    }

    return c.json({ question: updatedQuestion });
  } catch (error) {
    return c.json({ 
      error: "Failed to answer question",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get follow-up questions for a mental dump
app.get("/api/mental-dumps/:id/questions", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const answered = c.req.query("answered");
  const unanswered = c.req.query("unanswered");

  try {
    const conditions = [eq(schema.followUpQuestions.mentalDumpId, id)];

    if (answered === "true") {
      conditions.push(eq(schema.followUpQuestions.isAnswered, true));
    } else if (unanswered === "true") {
      conditions.push(eq(schema.followUpQuestions.isAnswered, false));
    }

    const questions = await db.select()
      .from(schema.followUpQuestions)
      .where(and(...conditions))
      .orderBy(desc(schema.followUpQuestions.createdAt));

    return c.json({ questions });
  } catch (error) {
    return c.json({ 
      error: "Failed to fetch questions",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Generate personalized action plan
app.post("/api/mental-dumps/:id/generate-plan", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  try {
    const [mentalDump] = await db.select()
      .from(schema.mentalDumps)
      .where(eq(schema.mentalDumps.id, id));

    if (!mentalDump) {
      return c.json({ error: "Mental dump not found" }, 404);
    }

    const [aiInsights] = await db.select()
      .from(schema.aiInsights)
      .where(eq(schema.aiInsights.mentalDumpId, id));

    const answeredQuestions = await db.select()
      .from(schema.followUpQuestions)
      .where(and(
        eq(schema.followUpQuestions.mentalDumpId, id),
        eq(schema.followUpQuestions.isAnswered, true)
      ));

    const planPrompt = `Create a personalized action plan based on this information:

Original mental dump: "${mentalDump.rawContent}"
AI insights: ${JSON.stringify(aiInsights)}
Answered questions: ${JSON.stringify(answeredQuestions.map(q => ({ question: q.questionText, answer: q.answerText })))}

Generate an action plan with:
1. Title (concise summary)
2. Summary (brief overview)
3. Energy level required (low/medium/high)
4. Estimated total duration in minutes
5. Priority score (1-10)
6. Action items (array of objects with title, description, estimatedDuration, orderIndex)

Consider the user's energy level, urgency signals, and blockers when creating the plan.
Return as valid JSON.`;

    const response = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are an AI assistant that creates personalized action plans. Always respond with valid JSON." },
        { role: "user", content: planPrompt }
      ],
    });

    let planData;
    try {
      // Handle Cloudflare Workers AI response format
      const responseText = (response as any).response || JSON.stringify(response);
      planData = JSON.parse(responseText);
    } catch (parseError) {
      // Create a basic action plan if AI parsing fails
      planData = {
        title: "Action Plan for Your Tasks",
        summary: "Prioritized plan based on your mental dump and answers",
        energyLevelRequired: "medium",
        estimatedDuration: 120,
        priorityScore: 7,
        actionItems: [
          { title: "Start with highest priority task", description: "Begin with the most urgent item", estimatedDuration: 60, orderIndex: 0 },
          { title: "Take a break", description: "Rest and recharge", estimatedDuration: 15, orderIndex: 1 },
          { title: "Continue with next task", description: "Move to the next priority", estimatedDuration: 45, orderIndex: 2 }
        ]
      };
    }

    // Create action plan
    const [actionPlan] = await db.insert(schema.actionPlans).values({
      mentalDumpId: id,
      title: planData.title,
      summary: planData.summary,
      energyLevelRequired: planData.energyLevelRequired,
      estimatedDuration: planData.estimatedDuration,
      priorityScore: planData.priorityScore,
    }).returning();

    // Create action items
    const createdActionItems: any[] = [];
    for (const item of planData.actionItems || []) {
      const [actionItem] = await db.insert(schema.actionItems).values({
        actionPlanId: actionPlan.id,
        title: item.title,
        description: item.description,
        estimatedDuration: item.estimatedDuration,
        orderIndex: item.orderIndex || createdActionItems.length,
      }).returning();
      createdActionItems.push(actionItem);
    }

    return c.json({
      actionPlan,
      actionItems: createdActionItems
    }, 201);
  } catch (error) {
    return c.json({ 
      error: "Failed to generate action plan",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get user's action plans
app.get("/api/action-plans", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.query("userId") || "default-user";
  const energyLevel = c.req.query("energy_level");

  try {
    // Get mental dumps for user first
    const userMentalDumps = await db.select({ id: schema.mentalDumps.id })
      .from(schema.mentalDumps)
      .where(eq(schema.mentalDumps.userId, userId));

    const mentalDumpIds = userMentalDumps.map(md => md.id);

    if (mentalDumpIds.length === 0) {
      return c.json({ actionPlans: [] });
    }

    let actionPlans;
    if (energyLevel && (energyLevel === "low" || energyLevel === "medium" || energyLevel === "high")) {
      actionPlans = await db.select()
        .from(schema.actionPlans)
        .where(eq(schema.actionPlans.energyLevelRequired, energyLevel));
    } else {
      actionPlans = await db.select()
        .from(schema.actionPlans);
    }

    return c.json({ actionPlans });
  } catch (error) {
    return c.json({ 
      error: "Failed to fetch action plans",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Update action plan
app.put("/api/action-plans/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const updateData = await c.req.json();

  try {
    const [updatedPlan] = await db.update(schema.actionPlans)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(schema.actionPlans.id, id))
      .returning();

    if (!updatedPlan) {
      return c.json({ error: "Action plan not found" }, 404);
    }

    return c.json({ actionPlan: updatedPlan });
  } catch (error) {
    return c.json({ 
      error: "Failed to update action plan",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Mark action item as completed
app.put("/api/action-items/:id/complete", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const { actual_duration, energy_used, completion_note } = await c.req.json();

  try {
    const [updatedItem] = await db.update(schema.actionItems)
      .set({
        isCompleted: true,
        completedAt: new Date(),
      })
      .where(eq(schema.actionItems.id, id))
      .returning();

    if (!updatedItem) {
      return c.json({ error: "Action item not found" }, 404);
    }

    // Log progress
    if (actual_duration || energy_used || completion_note) {
      await db.insert(schema.progressTracking).values({
        actionItemId: id,
        progressNote: completion_note,
        energyUsed: energy_used,
        actualDuration: actual_duration,
      });
    }

    return c.json({ actionItem: updatedItem });
  } catch (error) {
    return c.json({ 
      error: "Failed to complete action item",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Log progress on action item
app.post("/api/action-items/:id/progress", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const { progress_note, energy_used, actual_duration } = await c.req.json();

  try {
    const [progressEntry] = await db.insert(schema.progressTracking).values({
      actionItemId: id,
      progressNote: progress_note,
      energyUsed: energy_used,
      actualDuration: actual_duration,
    }).returning();

    return c.json({ progress: progressEntry }, 201);
  } catch (error) {
    return c.json({ 
      error: "Failed to log progress",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get productivity analytics
app.get("/api/analytics/productivity", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.query("userId") || "default-user";

  try {
    // Get user's mental dumps
    const userMentalDumps = await db.select()
      .from(schema.mentalDumps)
      .where(eq(schema.mentalDumps.userId, userId));

    // Get completed action items count
    const completedItems = await db.select()
      .from(schema.actionItems)
      .where(eq(schema.actionItems.isCompleted, true));

    // Get progress tracking entries
    const progressEntries = await db.select()
      .from(schema.progressTracking);

    const analytics = {
      totalMentalDumps: userMentalDumps.length,
      processedDumps: userMentalDumps.filter(md => md.processedAt).length,
      completedActionItems: completedItems.length,
      totalProgressEntries: progressEntries.length,
      averageEnergyUsage: progressEntries.length > 0 
        ? progressEntries.filter(p => p.energyUsed).length / progressEntries.length 
        : 0
    };

    return c.json({ analytics });
  } catch (error) {
    return c.json({ 
      error: "Failed to fetch analytics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get energy patterns analytics
app.get("/api/analytics/energy-patterns", async (c) => {
  const db = drizzle(c.env.DB);

  try {
    const progressEntries = await db.select()
      .from(schema.progressTracking)
      .orderBy(desc(schema.progressTracking.loggedAt));

    const energyPatterns = {
      lowEnergyTasks: progressEntries.filter(p => p.energyUsed === "low").length,
      mediumEnergyTasks: progressEntries.filter(p => p.energyUsed === "medium").length,
      highEnergyTasks: progressEntries.filter(p => p.energyUsed === "high").length,
      totalTrackedTasks: progressEntries.length
    };

    return c.json({ energyPatterns });
  } catch (error) {
    return c.json({ 
      error: "Failed to fetch energy patterns",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.get("/openapi.json", c => {
  return c.json(createOpenAPISpec(app, {
    info: {
      title: "AI-Powered Productivity Journal API",
      version: "1.0.0",
      description: "Transform mental clutter into clear action plans with AI-powered analysis"
    },
  }))
});

app.use("/fp/*", createFiberplane({
  app,
  openapi: { url: "/openapi.json" }
}));

export default app;
