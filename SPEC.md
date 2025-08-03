AI-Powered Productivity Journal Specification
This document outlines the design and step-by-step implementation plan for an AI-powered productivity journal that transforms mental clutter into clear action plans.

The API will support unstructured thought capture, AI-powered parsing and analysis, intelligent follow-up questions, and personalized action plan generation. Users can dump their mental clutter into a "Mental Dump Zone" where AI processes their thoughts to identify tasks, emotions, and blockers, then guides them toward actionable clarity.

The system will be built using Cloudflare Workers with Hono as the API framework, Cloudflare D1 for data persistence, Drizzle ORM for database operations, and Cloudflare AI for intelligent processing.

1. Technology Stack
Edge Runtime: Cloudflare Workers
API Framework: Hono.js (TypeScript-based API framework)
Database: Cloudflare D1 (serverless SQLite)
ORM: Drizzle ORM for type-safe database operations
AI Processing: Cloudflare AI (@cf/meta/llama-3.1-8b-instruct for general processing, @cf/qwen/qwq-32b for reasoning-heavy tasks)
Authentication: Better Auth with Fiberplane OAuth provider

3. Database Schema Design
The database will store user sessions, mental dumps, AI-generated insights, follow-up questions, and action plans with their associated tasks and progress tracking.

2.1. Users Table
id (TEXT, Primary Key)
email (TEXT, Unique, Not Null)
name (TEXT)
created_at (INTEGER, Not Null)
updated_at (INTEGER, Not Null)
2.2. Mental Dumps Table
id (TEXT, Primary Key)
user_id (TEXT, Foreign Key to users.id, Not Null)
raw_content (TEXT, Not Null)
processed_at (INTEGER)
created_at (INTEGER, Not Null)
2.3. AI Insights Table
id (TEXT, Primary Key)
mental_dump_id (TEXT, Foreign Key to mental_dumps.id, Not Null)
identified_tasks (TEXT) // JSON array of task objects
identified_emotions (TEXT) // JSON array of emotion objects
identified_blockers (TEXT) // JSON array of blocker objects
energy_assessment (TEXT) // low, medium, high
urgency_signals (TEXT) // JSON array of urgency indicators
created_at (INTEGER, Not Null)
2.4. Follow Up Questions Table
id (TEXT, Primary Key)
mental_dump_id (TEXT, Foreign Key to mental_dumps.id, Not Null)
question_text (TEXT, Not Null)
question_type (TEXT, Not Null) // task_clarification, deadline_inquiry, priority_assessment, etc.
is_answered (INTEGER, Default 0) // boolean
answer_text (TEXT)
answered_at (INTEGER)
created_at (INTEGER, Not Null)
2.5. Action Plans Table
id (TEXT, Primary Key)
mental_dump_id (TEXT, Foreign Key to mental_dumps.id, Not Null)
title (TEXT, Not Null)
summary (TEXT)
energy_level_required (TEXT) // low, medium, high
estimated_duration (INTEGER) // minutes
priority_score (INTEGER) // 1-10
created_at (INTEGER, Not Null)
updated_at (INTEGER, Not Null)
2.6. Action Items Table
id (TEXT, Primary Key)
action_plan_id (TEXT, Foreign Key to action_plans.id, Not Null)
title (TEXT, Not Null)
description (TEXT)
estimated_duration (INTEGER) // minutes
deadline (INTEGER) // timestamp
is_completed (INTEGER, Default 0) // boolean
completed_at (INTEGER)
order_index (INTEGER, Not Null)
created_at (INTEGER, Not Null)
2.7. Progress Tracking Table
id (TEXT, Primary Key)
action_item_id (TEXT, Foreign Key to action_items.id, Not Null)
progress_note (TEXT)
energy_used (TEXT) // low, medium, high
actual_duration (INTEGER) // minutes
logged_at (INTEGER, Not Null)
3. API Endpoints
We will structure our API endpoints into logical groups for mental dump processing, AI analysis, follow-up management, and action plan generation.

3.1. Mental Dump Endpoints
POST /api/mental-dumps

Description: Create a new mental dump entry and trigger AI processing
Expected Payload:
{
  "content": "I have so many things to do and I'm feeling overwhelmed..."
}
Response: Mental dump object with initial AI insights
GET /api/mental-dumps

Description: Retrieve user's mental dumps with pagination
Query Params: limit, offset, include_processed
GET /api/mental-dumps/:id

Description: Get specific mental dump with all associated data
Includes: AI insights, follow-up questions, action plans
3.2. AI Processing Endpoints
POST /api/mental-dumps/:id/analyze

Description: Trigger or re-trigger AI analysis of a mental dump
Response: Updated AI insights including tasks, emotions, and blockers
POST /api/mental-dumps/:id/generate-questions

Description: Generate intelligent follow-up questions based on AI insights
Response: Array of contextual follow-up questions
3.3. Follow-up Question Endpoints
POST /api/questions/:id/answer

Description: Submit answer to a follow-up question
Expected Payload:
{
  "answer": "The project deadline is next Friday"
}
GET /api/mental-dumps/:id/questions

Description: Get all follow-up questions for a mental dump
Query Params: answered, unanswered
3.4. Action Plan Endpoints
POST /api/mental-dumps/:id/generate-plan

Description: Generate personalized action plan based on insights and answers
Response: Complete action plan with prioritized action items
GET /api/action-plans

Description: Retrieve user's action plans
Query Params: active, completed, energy_level
PUT /api/action-plans/:id

Description: Update action plan details
Expected Payload:
{
  "title": "Updated plan title",
  "priority_score": 8
}
3.5. Action Item Endpoints
PUT /api/action-items/:id/complete

Description: Mark action item as completed
Expected Payload:
{
  "actual_duration": 45,
  "energy_used": "medium",
  "completion_note": "Finished earlier than expected"
}
POST /api/action-items/:id/progress

Description: Log progress on an action item
Expected Payload:
{
  "progress_note": "Made good headway on research",
  "energy_used": "low",
  "actual_duration": 30
}
3.6. Analytics Endpoints
GET /api/analytics/productivity

Description: Get productivity insights and patterns
Query Params: timeframe, metric_type
GET /api/analytics/energy-patterns

Description: Analyze energy usage patterns over time
Response: Energy level trends and optimal working times
4. AI Processing Logic
The system will use Cloudflare AI models to process mental dumps through several stages:

4.1. Initial Analysis
Parse unstructured text to identify discrete tasks, emotional states, and potential blockers
Assess overall energy level and urgency signals
Use @cf/meta/llama-3.1-8b-instruct for general text processing
4.2. Smart Follow-ups
Generate contextual questions to fill in missing details (deadlines, priorities, dependencies)
Use @cf/qwen/qwq-32b for reasoning about what information is needed
Adapt question style based on user's emotional state
4.3. Action Plan Generation
Synthesize insights and answers into prioritized action plans
Consider user's energy level, deadlines, and mental load capacity
Break down complex tasks into manageable action items
Optimize task ordering based on energy requirements and dependencies
5. Integrations
Cloudflare AI: Primary AI processing engine for text analysis and plan generation
Better Auth: User authentication with Fiberplane OAuth provider
Cloudflare D1: Serverless database for data persistence
Drizzle ORM: Type-safe database operations and query building
6. Additional Notes
6.1. Authentication Configuration
The system requires the following environment bindings for Better Auth:

FP_AUTH_ISSUER
FP_CLIENT_ID
FP_CLIENT_SECRET
BETTER_AUTH_URL
BETTER_AUTH_SECRET
6.2. AI Model Selection Strategy
Use @cf/meta/llama-3.1-8b-instruct for general text processing and task identification
Use @cf/qwen/qwq-32b for complex reasoning tasks like priority assessment and plan optimization
Implement fallback logic in case of model availability issues
6.3. Data Privacy Considerations
All mental dump content should be treated as sensitive personal data
Implement proper data retention policies
Consider encryption for stored mental dump content
7. Further Reading
Take inspiration from the project template here: https://github.com/fiberplane/create-honc-app/tree/main/templates/d1
