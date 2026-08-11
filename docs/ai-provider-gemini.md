# AI provider note — Gemini

Classification (and optionally Phase 2 receipts) uses **Google Gemini**, not AWS Bedrock.

| Concern | Decision |
|---------|----------|
| SDK | `@google/genai` |
| Default model | `gemini-2.5-flash-lite` (text category suggest) |
| Receipt vision (Phase 2) | Same model or `gemini-2.5-flash` — A/B later |
| Config | `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLASSIFICATION_HIGH_CONFIDENCE` |
| Isolation | Only `gemini-classification.client.ts` talks to Gemini; `transactions.service` calls `classification.service.suggestCategory` only |

Original plan chose Bedrock for Draftlee reuse of AWS IAM/patterns. Gemini trades that for cheaper multimodal path and simpler Phase 2 receipts option.
