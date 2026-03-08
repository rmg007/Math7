# ADR-001: AI-Assisted Curriculum Generation

## Status

Proposed

## Context

We need to accelerate curriculum creation for the Questerix platform. Manually creating thousands of math problems and skills is a bottleneck for tenant onboarding.

## Decision

We will implement an AI-assisted generation pipeline using Google Gemini (Flash 1.5) via Supabase Edge Functions.

## Design Patterns

1. **Human-in-the-Loop**: AI generates drafts; Admins review and approve via a dedicated Review UI.
2. **Schema-First**: Use structured JSON output from Gemini to ensure valid curriculum nodes.
3. **Reference-Aware**: Feed existing curriculum patterns into the prompt to maintain pedagogical consistency.

## Consequences

### Positive

- Order of magnitude increase in content throughput.
- Better consistency in question difficulty and tone.

### Negative

- Requires robust validation to prevent "AI hallucinations" in math logic.
- Cost per generation (though mitigated by using Flash).

---

_Reference: AI_CURRICULUM_FEATURE_PLAN.md_
