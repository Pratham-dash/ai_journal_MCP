import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const user = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const oauthApplication = sqliteTable("oauth_application", {
  id: text("id").primaryKey(),
  name: text("name"),
  icon: text("icon"),
  metadata: text("metadata"),
  clientId: text("client_id").unique(),
  clientSecret: text("client_secret"),
  redirectURLs: text("redirect_u_r_ls"),
  type: text("type"),
  disabled: integer("disabled", { mode: "boolean" }),
  userId: text("user_id"),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const oauthAccessToken = sqliteTable("oauth_access_token", {
  id: text("id").primaryKey(),
  accessToken: text("access_token").unique(),
  refreshToken: text("refresh_token").unique(),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  clientId: text("client_id"),
  userId: text("user_id"),
  scopes: text("scopes"),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const oauthConsent = sqliteTable("oauth_consent", {
  id: text("id").primaryKey(),
  clientId: text("client_id"),
  userId: text("user_id"),
  scopes: text("scopes"),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  consentGiven: integer("consent_given", { mode: "boolean" }),
});

export const mentalDumps = sqliteTable("mental_dumps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  rawContent: text("raw_content").notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const aiInsights = sqliteTable("ai_insights", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  mentalDumpId: text("mental_dump_id")
    .notNull()
    .references(() => mentalDumps.id, { onDelete: "cascade" }),
  identifiedTasks: text("identified_tasks", { mode: "json" }).$type<Array<{
    title: string;
    description?: string;
    estimatedDuration?: number;
  }>>(),
  identifiedEmotions: text("identified_emotions", { mode: "json" }).$type<Array<{
    emotion: string;
    intensity: "low" | "medium" | "high";
    context?: string;
  }>>(),
  identifiedBlockers: text("identified_blockers", { mode: "json" }).$type<Array<{
    blocker: string;
    type: "resource" | "skill" | "time" | "external" | "emotional";
    severity: "low" | "medium" | "high";
  }>>(),
  energyAssessment: text("energy_assessment", { enum: ["low", "medium", "high"] }),
  urgencySignals: text("urgency_signals", { mode: "json" }).$type<Array<{
    signal: string;
    urgencyLevel: "low" | "medium" | "high";
  }>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const followUpQuestions = sqliteTable("follow_up_questions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  mentalDumpId: text("mental_dump_id")
    .notNull()
    .references(() => mentalDumps.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type", { 
    enum: ["task_clarification", "deadline_inquiry", "priority_assessment", "resource_check", "dependency_mapping", "energy_planning"] 
  }).notNull(),
  isAnswered: integer("is_answered", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  answerText: text("answer_text"),
  answeredAt: integer("answered_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const actionPlans = sqliteTable("action_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  mentalDumpId: text("mental_dump_id")
    .notNull()
    .references(() => mentalDumps.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  energyLevelRequired: text("energy_level_required", { enum: ["low", "medium", "high"] }),
  estimatedDuration: integer("estimated_duration"),
  priorityScore: integer("priority_score"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const actionItems = sqliteTable("action_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actionPlanId: text("action_plan_id")
    .notNull()
    .references(() => actionPlans.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  estimatedDuration: integer("estimated_duration"),
  deadline: integer("deadline", { mode: "timestamp" }),
  isCompleted: integer("is_completed", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  orderIndex: integer("order_index").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const progressTracking = sqliteTable("progress_tracking", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actionItemId: text("action_item_id")
    .notNull()
    .references(() => actionItems.id, { onDelete: "cascade" }),
  progressNote: text("progress_note"),
  energyUsed: text("energy_used", { enum: ["low", "medium", "high"] }),
  actualDuration: integer("actual_duration"),
  loggedAt: integer("logged_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  mentalDumps: many(mentalDumps),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const mentalDumpsRelations = relations(mentalDumps, ({ one, many }) => ({
  user: one(user, {
    fields: [mentalDumps.userId],
    references: [user.id],
  }),
  aiInsights: one(aiInsights),
  followUpQuestions: many(followUpQuestions),
  actionPlans: many(actionPlans),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  mentalDump: one(mentalDumps, {
    fields: [aiInsights.mentalDumpId],
    references: [mentalDumps.id],
  }),
}));

export const followUpQuestionsRelations = relations(followUpQuestions, ({ one }) => ({
  mentalDump: one(mentalDumps, {
    fields: [followUpQuestions.mentalDumpId],
    references: [mentalDumps.id],
  }),
}));

export const actionPlansRelations = relations(actionPlans, ({ one, many }) => ({
  mentalDump: one(mentalDumps, {
    fields: [actionPlans.mentalDumpId],
    references: [mentalDumps.id],
  }),
  actionItems: many(actionItems),
}));

export const actionItemsRelations = relations(actionItems, ({ one, many }) => ({
  actionPlan: one(actionPlans, {
    fields: [actionItems.actionPlanId],
    references: [actionPlans.id],
  }),
  progressTracking: many(progressTracking),
}));

export const progressTrackingRelations = relations(progressTracking, ({ one }) => ({
  actionItem: one(actionItems, {
    fields: [progressTracking.actionItemId],
    references: [actionItems.id],
  }),
}));
