# COMMUTO — SYSTEM RULES & CONTEXT

Refer to [AGENTS.md](file:///c:/Users/joelj/OneDrive/Desktop/Commuto/AGENTS.md) and the master docs in [docs/](file:///c:/Users/joelj/OneDrive/Desktop/Commuto/docs/) for complete project specification, architecture, database schemas, and implementation cycle guidelines.

Always adhere strictly to:
1. Natural keys for `Department` (`_id: String`), `User` (`_id: collegeId`), and `Vehicle` (`_id: registrationNumber`).
2. String references for all foreign keys pointing to `User` and `Vehicle`.
3. Escrow wallet rules, atomic seat reservations, and roster lock cancellation lifecycle.
4. Pure deterministic matching engine and daily dynamic cost calculations.
5. 14-phase build cycle (Phase 0 to Phase 13).
