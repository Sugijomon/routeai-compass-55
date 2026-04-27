# Legacy — Shadow AI Scan (pre-V8.1)

Deze bestanden en tabellen zijn legacy. Ze mogen worden gelezen voor historische data,
maar nieuwe V8.1-code schrijft hier NOOIT naar.

## Legacy database-tabellen (niet uitbreiden, niet droppen zonder besluit)
- shadow_survey_runs
- tool_discoveries
- shadow_survey_reports
- legacy_survey_participation_view

## Legacy frontend-bestanden (niet uitbreiden)
- src/lib/shadowSurveyEngine.ts
- src/lib/riskEngine.ts
- src/components/shadow-survey/RiskProfileStep.tsx
- src/components/shadow-survey/ShadowSurveyResults.tsx

## Out of scope voor huidige release
- Scoreboard UI
- Badges
- Dashboard UI (datalaag mag wel worden aangemaakt)

## Leidende documenten
- database-schema-shadow-ai.md (datamodel)
- Shadow_AI_Scan_Scoring_V8_1.md (scorelogica)
