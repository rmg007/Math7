import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  uniqueIndex,
  unique,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["super_admin", "admin", "student", "mentor"]);
export const curriculumStatusEnum = pgEnum("curriculum_status", ["draft", "published", "live"]);
export const questionTypeEnum = pgEnum("question_type", ["multiple_choice", "mcq_multi", "text_input", "boolean", "reorder_steps"]);
export const groupTypeEnum = pgEnum("group_type", ["class", "family"]);
export const assignmentTypeEnum = pgEnum("assignment_type", ["skill_mastery", "time_goal", "custom"]);
export const assignmentScopeEnum = pgEnum("assignment_scope", ["mandatory", "suggested"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["pending", "completed", "late"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: userRoleEnum("role").default("student"),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
});

export const subjects = pgTable("subjects", {
  subjectId: uuid("subject_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
  displayOrder: integer("display_order").default(0),
  status: curriculumStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const apps = pgTable("apps", {
  appId: uuid("app_id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id").references(() => subjects.subjectId),
  subdomain: text("subdomain").notNull().unique(),
  appName: text("app_name").notNull(),
  displayName: text("display_name"),
  gradeNumber: integer("grade_number").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  branding: jsonb("branding").default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const domains = pgTable("domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  color: text("color"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  status: curriculumStatusEnum("status").default("draft"),
  appId: uuid("app_id").references(() => apps.appId),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  domainId: uuid("domain_id").references(() => domains.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  title: text("title"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  difficulty: integer("difficulty").default(1),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  status: curriculumStatusEnum("status").default("draft"),
  appId: uuid("app_id").references(() => apps.appId),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  skillId: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull(),
  content: jsonb("content").notNull(),
  options: jsonb("options"),
  solution: jsonb("solution").notNull(),
  explanation: text("explanation"),
  points: integer("points").default(1),
  sortOrder: integer("sort_order").default(0),
  isPublished: boolean("is_published").default(false),
  status: curriculumStatusEnum("status").default("draft"),
  appId: uuid("app_id").references(() => apps.appId),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  appId: uuid("app_id").references(() => apps.appId),
  name: text("name").notNull(),
  type: groupTypeEnum("type").default("class"),
  joinCode: text("join_code").notNull().unique(),
  allowAnonymous: boolean("allow_anonymous").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
  anonymousDeviceId: uuid("anonymous_device_id"),
  nickname: text("nickname"),
  joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => profiles.id, { onDelete: "cascade" }),
  targetId: uuid("target_id").notNull(),
  type: assignmentTypeEnum("type").notNull(),
  scope: assignmentScopeEnum("scope").default("mandatory"),
  status: assignmentStatusEnum("status").default("pending"),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "string" }),
  completionTrigger: jsonb("completion_trigger"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id"),
  answered: jsonb("answered").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").default(0),
  timeSpentMs: integer("time_spent_ms"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").references(() => skills.id),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true, mode: "string" }),
  totalQuestions: integer("total_questions").default(0),
  correctAnswers: integer("correct_answers").default(0),
  timeSpentMs: integer("time_spent_ms").default(0),
});

export const skillProgress = pgTable("skill_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  masteryLevel: numeric("mastery_level", { precision: 5, scale: 2 }).default("0"),
  totalAttempts: integer("total_attempts").default(0),
  correctAttempts: integer("correct_attempts").default(0),
  streakCurrent: integer("streak_current").default(0),
  streakBest: integer("streak_best").default(0),
  lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, (table) => [
  unique("skill_progress_user_skill_unique").on(table.userId, table.skillId),
]);

export const invitationCodes = pgTable("invitation_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  createdBy: uuid("created_by").references(() => profiles.id),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  maxUses: integer("max_uses").default(1),
  timesUsed: integer("times_used").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const curriculumMeta = pgTable("curriculum_meta", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: integer("version").notNull().default(1),
  lastPublishedAt: timestamp("last_published_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const curriculumSnapshots = pgTable("curriculum_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: integer("version").notNull(),
  content: jsonb("content").notNull().default({}),
  publishedBy: uuid("published_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const outbox = pgTable("outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const syncMeta = pgTable("sync_meta", {
  tableName: text("table_name").primaryKey(),
  lastUpdated: timestamp("last_updated", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const appLandingPages = pgTable("app_landing_pages", {
  landingPageId: uuid("landing_page_id").primaryKey().defaultRandom(),
  appId: uuid("app_id").notNull().unique().references(() => apps.appId, { onDelete: "cascade" }),
  heroHeadline: text("hero_headline"),
  heroSubtext: text("hero_subtext"),
  features: jsonb("features").default([]),
  testimonials: jsonb("testimonials").default([]),
  pricingInfo: jsonb("pricing_info").default({}),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  subscriptionId: uuid("subscription_id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  appId: uuid("app_id").notNull().references(() => apps.appId, { onDelete: "cascade" }),
  tier: text("tier").default("free"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  userId: uuid("user_id").references(() => profiles.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}),
  severity: text("severity").default("info"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const securityLogs = pgTable("security_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id),
  appId: uuid("app_id").references(() => apps.appId),
  eventType: text("event_type").notNull(),
  severity: text("severity").default("info"),
  metadata: jsonb("metadata").default({}),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const knownIssues = pgTable("known_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  errorMessage: text("error_message"),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  status: text("status").default("open"),
  severity: text("severity").default("medium"),
  sentryLink: text("sentry_link"),
  createdBy: uuid("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id),
  appId: uuid("app_id").references(() => apps.appId),
  platform: text("platform").notNull(),
  appVersion: text("app_version"),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  url: text("url"),
  userAgent: text("user_agent"),
  extraContext: jsonb("extra_context").default({}),
  status: text("status").default("new"),
  promotedToIssueId: uuid("promoted_to_issue_id").references(() => knownIssues.id),
  alertSent: boolean("alert_sent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" }),
});

export const sourceDocuments = pgTable("source_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  appId: uuid("app_id").references(() => apps.appId, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  status: text("status").default("pending"),
  errorMessage: text("error_message"),
  extractedText: text("extracted_text"),
  pageCount: integer("page_count"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
});

export const aiGenerationSessions = pgTable("ai_generation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  sourceDocumentId: uuid("source_document_id").references(() => sourceDocuments.id),
  skillId: uuid("skill_id").references(() => skills.id),
  modelUsed: text("model_used").notNull(),
  promptText: text("prompt_text").notNull(),
  difficultyDistribution: jsonb("difficulty_distribution"),
  rawResponse: jsonb("raw_response"),
  tokenCount: integer("token_count"),
  generationTimeMs: integer("generation_time_ms"),
  status: text("status").default("reviewing"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  questionsGenerated: integer("questions_generated").default(0),
  questionsImported: integer("questions_imported").default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
});

export const generationAuditLog = pgTable("generation_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => aiGenerationSessions.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const tenantQuotas = pgTable("tenant_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  appId: uuid("app_id").notNull().unique().references(() => apps.appId, { onDelete: "cascade" }),
  monthlyTokenLimit: bigint("monthly_token_limit", { mode: "number" }).default(1000000),
  currentTokenUsage: bigint("current_token_usage", { mode: "number" }).default(0),
  lastResetDate: timestamp("last_reset_date", { withTimezone: true, mode: "string" }).defaultNow(),
  isThrottled: boolean("is_throttled").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const contentValidationRules = pgTable("content_validation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  appId: uuid("app_id").references(() => apps.appId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(),
  params: jsonb("params").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const approvalWorkflows = pgTable("approval_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => aiGenerationSessions.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  status: text("status").default("pending"),
  assignedTo: uuid("assigned_to").references(() => profiles.id),
  comments: text("comments"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const specifications = pgTable("specifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  appId: uuid("app_id").notNull().references(() => apps.appId, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityName: text("entity_name").notNull(),
  scope: text("scope"),
  specContent: text("spec_content").notNull(),
  requirements: jsonb("requirements"),
  version: integer("version").default(1),
  status: text("status").default("active"),
  author: text("author"),
  sourceFile: text("source_file"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
});

export const specValidations = pgTable("spec_validations", {
  id: uuid("id").primaryKey().defaultRandom(),
  appId: uuid("app_id").notNull().references(() => apps.appId, { onDelete: "cascade" }),
  specId: uuid("spec_id").references(() => specifications.id),
  validationType: text("validation_type").notNull(),
  targetEntity: text("target_entity").notNull(),
  scope: text("scope"),
  status: text("status").notNull(),
  findings: jsonb("findings"),
  severity: text("severity"),
  totalChecks: integer("total_checks").default(0),
  passedChecks: integer("passed_checks").default(0),
  failedChecks: integer("failed_checks").default(0),
  gitCommit: text("git_commit"),
  gitBranch: text("git_branch"),
  prNumber: integer("pr_number"),
  triggeredBy: text("triggered_by"),
  triggeredByUser: uuid("triggered_by_user").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const kbRegistry = pgTable("kb_registry", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  platform: text("platform").notNull(),
  status: text("status").default("active"),
  liveUrl: text("live_url"),
  techStack: jsonb("tech_stack").default({}),
  lastDeployedAt: timestamp("last_deployed_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const kbMetrics = pgTable("kb_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectName: text("project_name").notNull().references(() => kbRegistry.name, { onDelete: "cascade" }),
  language: text("language").notNull(),
  linesOfCode: integer("lines_of_code").default(0),
  fileCount: integer("file_count").default(0),
  complexityScore: integer("complexity_score"),
  lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  groups: many(groups),
  groupMembers: many(groupMembers),
  assignments: many(assignments),
  attempts: many(attempts),
  sessions: many(sessions),
  skillProgress: many(skillProgress),
  invitationCodes: many(invitationCodes),
  curriculumSnapshots: many(curriculumSnapshots),
  userSubscriptions: many(userSubscriptions),
  securityEvents: many(securityEvents),
  securityLogs: many(securityLogs),
  knownIssues: many(knownIssues),
  errorLogs: many(errorLogs),
  sourceDocuments: many(sourceDocuments),
  aiGenerationSessions: many(aiGenerationSessions),
  approvalWorkflows: many(approvalWorkflows),
  specValidations: many(specValidations),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  apps: many(apps),
}));

export const appsRelations = relations(apps, ({ one, many }) => ({
  subject: one(subjects, { fields: [apps.subjectId], references: [subjects.subjectId] }),
  domains: many(domains),
  skills: many(skills),
  questions: many(questions),
  groups: many(groups),
  appLandingPages: many(appLandingPages),
  userSubscriptions: many(userSubscriptions),
  securityLogs: many(securityLogs),
  errorLogs: many(errorLogs),
  sourceDocuments: many(sourceDocuments),
  tenantQuotas: many(tenantQuotas),
  contentValidationRules: many(contentValidationRules),
  specifications: many(specifications),
  specValidations: many(specValidations),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  app: one(apps, { fields: [domains.appId], references: [apps.appId] }),
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  domain: one(domains, { fields: [skills.domainId], references: [domains.id] }),
  app: one(apps, { fields: [skills.appId], references: [apps.appId] }),
  questions: many(questions),
  sessions: many(sessions),
  skillProgress: many(skillProgress),
  aiGenerationSessions: many(aiGenerationSessions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  skill: one(skills, { fields: [questions.skillId], references: [skills.id] }),
  app: one(apps, { fields: [questions.appId], references: [apps.appId] }),
  attempts: many(attempts),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(profiles, { fields: [groups.ownerId], references: [profiles.id] }),
  app: one(apps, { fields: [groups.appId], references: [apps.appId] }),
  members: many(groupMembers),
  assignments: many(assignments),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(profiles, { fields: [groupMembers.userId], references: [profiles.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  group: one(groups, { fields: [assignments.groupId], references: [groups.id] }),
  student: one(profiles, { fields: [assignments.studentId], references: [profiles.id] }),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  user: one(profiles, { fields: [attempts.userId], references: [profiles.id] }),
  question: one(questions, { fields: [attempts.questionId], references: [questions.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(profiles, { fields: [sessions.userId], references: [profiles.id] }),
  skill: one(skills, { fields: [sessions.skillId], references: [skills.id] }),
}));

export const skillProgressRelations = relations(skillProgress, ({ one }) => ({
  user: one(profiles, { fields: [skillProgress.userId], references: [profiles.id] }),
  skill: one(skills, { fields: [skillProgress.skillId], references: [skills.id] }),
}));

export const invitationCodesRelations = relations(invitationCodes, ({ one }) => ({
  creator: one(profiles, { fields: [invitationCodes.createdBy], references: [profiles.id] }),
}));

export const curriculumSnapshotsRelations = relations(curriculumSnapshots, ({ one }) => ({
  publisher: one(profiles, { fields: [curriculumSnapshots.publishedBy], references: [profiles.id] }),
}));

export const appLandingPagesRelations = relations(appLandingPages, ({ one }) => ({
  app: one(apps, { fields: [appLandingPages.appId], references: [apps.appId] }),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(profiles, { fields: [userSubscriptions.userId], references: [profiles.id] }),
  app: one(apps, { fields: [userSubscriptions.appId], references: [apps.appId] }),
}));

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(profiles, { fields: [securityEvents.userId], references: [profiles.id] }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  user: one(profiles, { fields: [securityLogs.userId], references: [profiles.id] }),
  app: one(apps, { fields: [securityLogs.appId], references: [apps.appId] }),
}));

export const knownIssuesRelations = relations(knownIssues, ({ one, many }) => ({
  creator: one(profiles, { fields: [knownIssues.createdBy], references: [profiles.id] }),
  errorLogs: many(errorLogs),
}));

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  user: one(profiles, { fields: [errorLogs.userId], references: [profiles.id] }),
  app: one(apps, { fields: [errorLogs.appId], references: [apps.appId] }),
  promotedToIssue: one(knownIssues, { fields: [errorLogs.promotedToIssueId], references: [knownIssues.id] }),
}));

export const sourceDocumentsRelations = relations(sourceDocuments, ({ one, many }) => ({
  uploader: one(profiles, { fields: [sourceDocuments.uploadedBy], references: [profiles.id] }),
  app: one(apps, { fields: [sourceDocuments.appId], references: [apps.appId] }),
  aiGenerationSessions: many(aiGenerationSessions),
}));

export const aiGenerationSessionsRelations = relations(aiGenerationSessions, ({ one, many }) => ({
  creator: one(profiles, { fields: [aiGenerationSessions.createdBy], references: [profiles.id] }),
  sourceDocument: one(sourceDocuments, { fields: [aiGenerationSessions.sourceDocumentId], references: [sourceDocuments.id] }),
  skill: one(skills, { fields: [aiGenerationSessions.skillId], references: [skills.id] }),
  reviewer: one(profiles, { fields: [aiGenerationSessions.reviewedBy], references: [profiles.id] }),
  generationAuditLogs: many(generationAuditLog),
  approvalWorkflows: many(approvalWorkflows),
}));

export const generationAuditLogRelations = relations(generationAuditLog, ({ one }) => ({
  session: one(aiGenerationSessions, { fields: [generationAuditLog.sessionId], references: [aiGenerationSessions.id] }),
}));

export const tenantQuotasRelations = relations(tenantQuotas, ({ one }) => ({
  app: one(apps, { fields: [tenantQuotas.appId], references: [apps.appId] }),
}));

export const contentValidationRulesRelations = relations(contentValidationRules, ({ one }) => ({
  app: one(apps, { fields: [contentValidationRules.appId], references: [apps.appId] }),
}));

export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one }) => ({
  session: one(aiGenerationSessions, { fields: [approvalWorkflows.sessionId], references: [aiGenerationSessions.id] }),
  assignee: one(profiles, { fields: [approvalWorkflows.assignedTo], references: [profiles.id] }),
}));

export const specificationsRelations = relations(specifications, ({ one, many }) => ({
  app: one(apps, { fields: [specifications.appId], references: [apps.appId] }),
  specValidations: many(specValidations),
}));

export const specValidationsRelations = relations(specValidations, ({ one }) => ({
  app: one(apps, { fields: [specValidations.appId], references: [apps.appId] }),
  spec: one(specifications, { fields: [specValidations.specId], references: [specifications.id] }),
  triggeredByProfile: one(profiles, { fields: [specValidations.triggeredByUser], references: [profiles.id] }),
}));

export const kbRegistryRelations = relations(kbRegistry, ({ many }) => ({
  metrics: many(kbMetrics),
}));

export const kbMetricsRelations = relations(kbMetrics, ({ one }) => ({
  registry: one(kbRegistry, { fields: [kbMetrics.projectName], references: [kbRegistry.name] }),
}));

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type App = typeof apps.$inferSelect;
export type InsertApp = typeof apps.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type InsertDomain = typeof domains.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;
export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = typeof attempts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type SkillProgress = typeof skillProgress.$inferSelect;
export type InsertSkillProgress = typeof skillProgress.$inferInsert;
export type InvitationCode = typeof invitationCodes.$inferSelect;
export type InsertInvitationCode = typeof invitationCodes.$inferInsert;
export type CurriculumMeta = typeof curriculumMeta.$inferSelect;
export type InsertCurriculumMeta = typeof curriculumMeta.$inferInsert;
export type CurriculumSnapshot = typeof curriculumSnapshots.$inferSelect;
export type InsertCurriculumSnapshot = typeof curriculumSnapshots.$inferInsert;
export type Outbox = typeof outbox.$inferSelect;
export type InsertOutbox = typeof outbox.$inferInsert;
export type SyncMeta = typeof syncMeta.$inferSelect;
export type InsertSyncMeta = typeof syncMeta.$inferInsert;
export type AppLandingPage = typeof appLandingPages.$inferSelect;
export type InsertAppLandingPage = typeof appLandingPages.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = typeof securityLogs.$inferInsert;
export type KnownIssue = typeof knownIssues.$inferSelect;
export type InsertKnownIssue = typeof knownIssues.$inferInsert;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
export type SourceDocument = typeof sourceDocuments.$inferSelect;
export type InsertSourceDocument = typeof sourceDocuments.$inferInsert;
export type AiGenerationSession = typeof aiGenerationSessions.$inferSelect;
export type InsertAiGenerationSession = typeof aiGenerationSessions.$inferInsert;
export type GenerationAuditLog = typeof generationAuditLog.$inferSelect;
export type InsertGenerationAuditLog = typeof generationAuditLog.$inferInsert;
export type TenantQuota = typeof tenantQuotas.$inferSelect;
export type InsertTenantQuota = typeof tenantQuotas.$inferInsert;
export type ContentValidationRule = typeof contentValidationRules.$inferSelect;
export type InsertContentValidationRule = typeof contentValidationRules.$inferInsert;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = typeof approvalWorkflows.$inferInsert;
export type Specification = typeof specifications.$inferSelect;
export type InsertSpecification = typeof specifications.$inferInsert;
export type SpecValidation = typeof specValidations.$inferSelect;
export type InsertSpecValidation = typeof specValidations.$inferInsert;
export type KbRegistry = typeof kbRegistry.$inferSelect;
export type InsertKbRegistry = typeof kbRegistry.$inferInsert;
export type KbMetric = typeof kbMetrics.$inferSelect;
export type InsertKbMetric = typeof kbMetrics.$inferInsert;
