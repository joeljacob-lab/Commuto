# COMMUTO — SYSTEM RULES & CONTEXT

Refer to [AGENTS.md](file:///c:/Users/joelj/OneDrive/Desktop/Commuto/AGENTS.md) and the master docs in [docs/](file:///c:/Users/joelj/OneDrive/Desktop/Commuto/docs/) for complete project specification, architecture, database schemas, and implementation cycle guidelines.

Always adhere strictly to:
1. Natural keys for `User` (`_id: collegeId`) and `Vehicle` (`_id: registrationNumber`). `Department` uses standard auto-generated `ObjectId` (without `deptCode`).
2. String references for foreign keys pointing to `User` and `Vehicle`; ObjectId references for `Department` (`deptId`).
3. Escrow wallet rules, atomic seat reservations, and roster lock cancellation lifecycle.
4. Pure deterministic matching engine and daily dynamic cost calculations.
5. 14-phase build cycle (Phase 0 to Phase 13).
6. Strict ES Modules (ESM) Only: Always generate `import` / `export` syntax for all backend and frontend code. Never use CommonJS (`require`, `module.exports`). Ensure explicit `.js` extensions on relative imports in backend.
