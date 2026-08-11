
Software Requirements Specification
Personal & Household Expense Tracking Platform
(Working name: ExpenseFlow)
Document Version: 1.0
Status: Draft for Review
Prepared: August 2026
Classification: Internal / Confidential



Table of Contents
Table of Contents	2
Revision History	4
1. Introduction	5
1.1 Purpose	5
1.2 Scope	5
1.3 Definitions, Acronyms, and Abbreviations	5
1.4 References	6
1.5 Document Overview	6
2. Overall Description	7
2.1 Product Perspective	7
2.2 Product Functions (Summary)	7
2.3 User Classes and Characteristics	7
2.4 Operating Environment	8
2.5 Design and Implementation Constraints	8
2.6 Assumptions and Dependencies	8
3. System Features (Functional Requirements)	9
3.1 Authentication & Household Management	9
3.2 Transaction Management	9
3.3 Category Management & AI-Assisted Categorization	10
3.4 Debt Ledger	11
3.5 Budget Management	11
3.6 Dashboard & Reporting	12
3.7 Receipt Capture & OCR	12
3.8 SMS / Notification-Based Capture (Android)	13
3.9 CSV Import / Spreadsheet Migration	13
3.10 Billing & Subscription Management	14
3.11 Notifications	14
3.12 Bank Sync - Phase 3 / Future Scope	15
4. External Interface Requirements	16
4.1 User Interfaces	16
4.2 Hardware Interfaces	16
4.3 Software Interfaces	16
4.4 Communication Interfaces	16
5. Non-Functional Requirements	17
5.1 Performance	17
5.2 Security	17
5.3 Usability	17
5.4 Reliability & Availability	18
5.5 Scalability	18
5.6 Maintainability	18
5.7 Compliance & Legal	18
6. Data Requirements	20
6.1 Core Entities	20
6.2 Data Retention	20
6.3 Data Migration	20
7. Other Requirements	21
7.1 Legal & Account Deletion SLA	21
7.2 Localization	21
7.3 Licensing	21
Appendix A: Requirements Traceability Matrix (Template)	22
Appendix B: Priority Definitions	22
Appendix C: Glossary	22



Revision History
VersionDateDescriptionAuthor0.12026-08-11Initial draft derived from feasibility study and technical build planProduct/Engineering1.02026-08-11First complete draft for stakeholder reviewProduct/Engineering

1. Introduction
1.1 Purpose
This Software Requirements Specification (SRS) defines the functional and non-functional requirements for a SaaS expense-tracking platform that replaces a manually maintained spreadsheet-based system with a multi-tenant, AI-assisted application. The document is intended for the engineering team building the product, for design and QA in deriving test cases, and for the product owner in validating that the specified system matches business intent. It follows the general structure of IEEE 830 / ISO/IEC/IEEE 29148, adapted for a small-team SaaS delivery context.
1.2 Scope
The system in scope is a household-level personal finance application ("the Product") covering: manual and AI-assisted transaction logging, category management, an interpersonal debt ledger, budget-vs-actual tracking, dashboards and reporting, receipt capture with OCR, SMS/notification-based transaction capture, CSV import for migration from spreadsheets, subscription billing, and notifications. Bank-account aggregation (Plaid-based auto-sync) is included as a Phase 3 / future-scope capability, gated on markets where open-banking infrastructure exists, and is marked as such throughout this document. The Product is delivered as a responsive web application plus an installable mobile-first PWA; a native mobile app is out of scope for the version covered by this SRS but is discussed in Section 2.5 as a future direction.
Out of scope for this version: investment/portfolio tracking, tax preparation and filing, direct bill payment or money movement, credit score monitoring, and lending/credit decisioning.
1.3 Definitions, Acronyms, and Abbreviations
TermDefinitionHouseholdThe core tenancy unit of the system - one or more Users sharing a single set of accounts, categories, budgets, and a debt ledger.TransactionA single recorded movement of money: Income, Expense, Saving, Debt Given, or Debt Received.CategoryA user- or system-defined label used to classify a Transaction (e.g. Transport/Petrol, Utilities).Debt LedgerThe subsystem tracking informal money owed to or by a person outside the Household, distinct from formal bank debt.OCROptical Character Recognition - automated extraction of text/structured data from an image (e.g. a receipt photo).AI CategorizationThe subsystem that suggests a Category for a Transaction using a large language model, given the transaction description and household-specific history.PWAProgressive Web App - an installable, offline-capable web application.MVPMinimum Viable Product - the smallest feature set that delivers standalone value (Section 2.2, Phase 1).Bank SyncAutomated import of transactions directly from a linked bank account via a third-party aggregator (e.g. Plaid). Phase 3 / future scope.RLSRow-Level Security - a database-enforced access control mechanism restricting query results to rows the requesting tenant is authorized to see.SLAService Level Agreement / Service Level Objective - a target for system availability or performance.1.4 References
• Feasibility Study: "From Spreadsheet to SaaS: Feasibility Study for an Expense Tracking Product" (companion document).
• Technical Build Plan: "Technical Build Plan - Expense Tracker SaaS" (companion document).
• Source artifact: "2026 Personal Expense Tracker" Google Sheet - the existing manual system this Product replaces; its Categories, Transactions, Debts, Budget, and Dashboard sheets are the primary source of current-state business logic referenced throughout Section 3.
• IEEE 830-1998 / ISO/IEC/IEEE 29148:2018 - structural reference for this SRS.
1.5 Document Overview
Section 2 describes the product at a high level: perspective, user classes, environment, and constraints. Section 3 specifies functional requirements grouped by subsystem, each requirement uniquely identified and prioritized. Section 4 specifies external interfaces. Section 5 specifies non-functional requirements. Section 6 specifies data requirements and retention policy. Section 7 covers other requirements (legal, licensing, localization). Appendices provide the data model, a requirements traceability matrix template, and a glossary.


2. Overall Description
2.1 Product Perspective
The Product is a new, standalone multi-tenant SaaS system. It is not an extension of an existing platform, but its business logic is directly derived from - and intended to fully replace - a spreadsheet-based expense tracker currently maintained manually by an individual user. That spreadsheet's sheet structure (Transactions, Categories, Debts, Budget, Dashboard) is treated as the de facto requirements baseline for core functional behavior, and is referenced by name where relevant so that behavior parity can be verified against known-good manual calculations during acceptance testing.
The system comprises: a web application (dashboard, transaction management, budgets, debts, settings), a mobile-first installable PWA optimized for rapid transaction capture, a backend API and business-logic layer, a data store, an AI-assisted categorization pipeline, an OCR pipeline for receipt capture, and integrations with a subscription billing provider and (Phase 3) a bank-data aggregator.
2.2 Product Functions (Summary)
At a high level, the Product allows a Household to:
• Record income, expense, saving, and debt-related transactions manually or via receipt photo, SMS/notification capture, or CSV import.
• Receive an AI-suggested category for each transaction and confirm or correct it with minimal friction.
• Maintain a running ledger of informal debts owed to or by named individuals, with automatic reconciliation against repayment transactions.
• Set monthly budgets per category and see live budget-vs-actual variance and a savings-rate calculation.
• View a dashboard summarizing income, expense, saving, net balance, category breakdown, and multi-month trend for a selected month.
• Share a Household's data with other invited members, with real-time updates across members.
• Subscribe to a paid plan via a freemium billing model.
• (Phase 3 / future) Link a bank account for automatic transaction import in supported markets.
Functions are grouped into delivery phases in the Technical Build Plan; this SRS specifies requirements for all phases and marks Phase 3 items explicitly as future scope where relevant.
2.3 User Classes and Characteristics
User ClassDescriptionTechnical ProficiencyPrimary user (Household owner)Creates the Household, invites members, has full read/write access, manages billing.Low to moderate - must not require spreadsheet or accounting literacy.Household memberInvited user with read/write access to shared transactions, budgets, and debts within a Household.Low to moderate.Administrator (internal)Internal support/operations role with access to an admin dashboard for support, billing troubleshooting, and classification-quality monitoring. Not a customer-facing role.High.2.4 Operating Environment
• Server-side: containerized NestJS services on AWS ECS Fargate; Postgres (Neon) as the primary data store; AWS S3 for object storage (receipts); AWS Bedrock and Textract for AI/OCR processing.
• Client-side (web): current versions of Chrome, Safari, Firefox, and Edge on desktop and mobile, at a minimum viewport width of 360px.
• Client-side (mobile capture): installable PWA on Android and iOS; Android additionally supports optional notification-listener-based SMS capture (Section 3.8), which is not available on iOS due to platform restrictions.
• Third-party dependencies: Auth0 (authentication), Stripe (billing), AWS Bedrock/Textract (AI/OCR), and, in Phase 3 only, Plaid or an equivalent aggregator (bank sync).
2.5 Design and Implementation Constraints
• Bank-account aggregation (Plaid or equivalent) has no coverage in the initial target market (Sri Lanka / South Asia) as of this writing; consequently automated bank sync MUST NOT be a dependency of any Phase 1 or Phase 2 requirement. See FR-BANK-* in Section 3.12 for the explicitly scoped exception.
• SMS/notification-based capture (Section 3.8) is an Android-only capability due to iOS platform restrictions on reading other apps' notifications; the system MUST degrade gracefully to manual/receipt-based capture on iOS.
• The system MUST support multi-tenancy at the Household level from the first release; retrofitting shared access after single-user data models are in production is explicitly avoided as a design risk.
• The backend MUST be implemented in NestJS/TypeORM and the web frontend in Next.js, consistent with the organization's existing engineering stack and operational tooling.
• A native mobile application is not required for the version covered by this SRS; the PWA MUST fulfill all mobile capture requirements without it.
2.6 Assumptions and Dependencies
• It is assumed that initial users are individuals or households already maintaining a manual spreadsheet or no formal tracking at all, and that CSV import from a spreadsheet is a primary onboarding path (see FR-IMP-*).
• It is assumed that AWS Bedrock, Textract, Auth0, and Stripe remain available and within acceptable pricing for the AI, OCR, authentication, and billing functions respectively; a provider outage in any of these degrades but does not fully block core manual-entry functionality (see NFR-REL-002).
• It is assumed that currency handling for the initial release is single-currency per Household (see Section 2.5 of the Technical Build Plan); multi-currency is a Phase 3 dependency, not a Phase 1 requirement.


3. System Features (Functional Requirements)
Each requirement is uniquely identified, stated as a single testable statement, and assigned a priority: High (must be present for MVP / Phase 1 launch), Medium (targeted for Phase 2), or Low (Phase 3 / future scope). Requirement identifiers are stable across document revisions and are intended for direct use in a requirements-traceability matrix and in QA test-case naming.
3.1 Authentication & Household Management
Covers user identity, Household creation, and multi-member access.
IDRequirementPriorityFR-AUTH-001The system shall allow a new user to register and authenticate via Auth0, including email/password and Google Sign-In.HighFR-AUTH-002The system shall create exactly one default Household automatically upon a new user's first successful registration.HighFR-AUTH-003The system shall allow a Household owner to invite additional members by email; an invited member shall gain access only after accepting the invitation.HighFR-AUTH-004The system shall support at least two Household roles: Owner (full access including billing and member management) and Member (read/write on shared financial data, no billing access).HighFR-AUTH-005The system shall allow a user to belong to more than one Household and to switch the active Household context without re-authenticating.MediumFR-AUTH-006The system shall allow a Household owner to remove a member, immediately revoking that member's access to the Household's data.HighFR-AUTH-007The system shall enforce that every data-access request is scoped to a Household the requesting user is currently a member of, with no cross-Household data leakage under any request path.High3.2 Transaction Management
Covers the core Transaction record - the direct functional equivalent of the existing spreadsheet's Transactions sheet.
IDRequirementPriorityFR-TXN-001The system shall allow a user to create a Transaction with, at minimum: date, type (Income, Expense, Saving, Debt Given, Debt Received), category, amount, and an optional free-text description, payee, and notes field.HighFR-TXN-002The system shall allow a Transaction to be created in two taps or fewer from the mobile capture UI for the common case of amount + category with no other fields ("quick-add").HighFR-TXN-003The system shall allow a user to edit or delete any Transaction they have permission to view, subject to Household role.HighFR-TXN-004The system shall record, for every Transaction, an immutable creation timestamp, the creating user, and a source field indicating how it was captured (manual, receipt_ocr, sms_parsed, csv_import, or bank_sync).HighFR-TXN-005The system shall allow filtering and searching of Transactions by date range, type, category, payee, and free-text description.HighFR-TXN-006The system shall support amounts in the Household's base currency with at least two decimal places of precision and shall never lose precision due to floating-point rounding in storage or calculation (i.e., monetary values shall be stored as fixed-point/decimal, not binary float).HighFR-TXN-007The system shall allow a single receipt with multiple line items to be split across more than one category as more than one Transaction, linked to the same source receipt (see FR-RCPT-004).MediumFR-TXN-008The system shall allow bulk deletion or bulk re-categorization of a filtered set of Transactions.Low3.3 Category Management & AI-Assisted Categorization
Directly addresses the categorization-decay problem identified in the source spreadsheet, where a majority of logged expenses fell into a single catch-all category.
IDRequirementPriorityFR-CAT-001The system shall seed every new Household with a default category list covering common Income, Expense, Saving, Debt Given, and Debt Received types, editable thereafter.HighFR-CAT-002The system shall allow a user to create, rename, deactivate, and reorder custom categories, and to nest a category under a parent category.HighFR-CAT-003The system shall, upon Transaction creation with a free-text description and no category selected, return an AI-suggested category with an associated confidence score before the Transaction is saved.HighFR-CAT-004The system shall pre-select the AI-suggested category automatically when its confidence score exceeds a configurable high-confidence threshold, requiring only a single confirming tap from the user.HighFR-CAT-005The system shall present at least two alternative category suggestions as quick-select options when the AI suggestion's confidence score falls below the high-confidence threshold.HighFR-CAT-006The system shall record whether a user accepted or overrode the AI-suggested category for every categorized Transaction (user_confirmed_category), and shall use accepted/overridden examples from that Household as few-shot context to improve future suggestions for that Household specifically.HighFR-CAT-007The system shall allow a user to re-categorize a previously saved Transaction at any time, and that correction shall be included in the household-specific feedback loop described in FR-CAT-006.MediumFR-CAT-008The system shall surface a periodic (at minimum monthly) summary of transactions whose category was AI-assigned at low confidence and not subsequently reviewed by the user, prompting review.Medium3.4 Debt Ledger
Directly ports the behavior of the source spreadsheet's Debts sheet, which reconciles informal debts against repayment transactions using date-windowed lookups.
IDRequirementPriorityFR-DEBT-001The system shall allow a user to record a debt entry specifying: person name, direction ("I Owe" or "Owed to Me"), principal amount, and date opened.HighFR-DEBT-002The system shall automatically link any Transaction of type Debt Repayment or Debt Received to the corresponding open debt entry for the same person and direction, based on the transaction falling within that debt's active date window.HighFR-DEBT-003The system shall compute, for every debt entry, a running "repaid so far" and "remaining" amount derived from all linked repayment/receipt transactions, without requiring manual re-entry of a running balance.HighFR-DEBT-004The system shall automatically close a debt entry's active window when a new debt entry is opened for the same person and the same direction, mirroring the source spreadsheet's date-boundary logic, so that repayments are attributed to the correct, most-recent debt instance.HighFR-DEBT-005The system shall classify each debt entry's status as Outstanding, Partially Paid, or Settled based on the computed remaining amount.HighFR-DEBT-006The system shall allow a user to add free-text notes to a debt entry (e.g. reason for the debt).MediumFR-DEBT-007The system shall compute and display, at the Household level, total amount owed by the Household and total amount owed to the Household, aggregated across all debt entries.HighFR-DEBT-008The system shall (Medium priority, Phase 2) send an optional reminder notification when a debt has been Outstanding for longer than a user-configurable number of days.Medium3.5 Budget Management
Ports the behavior of the source spreadsheet's Budget sheet, including variance and savings-rate calculations.
IDRequirementPriorityFR-BUD-001The system shall allow a user to set a monthly budget amount per category, scoped to a specific month.HighFR-BUD-002The system shall compute actual spend per budgeted category for the selected month by summing all Expense-type transactions in that category and month, updating automatically as transactions are added, edited, or removed.HighFR-BUD-003The system shall compute and display variance (actual minus budgeted) and percent-of-budget-used per category.HighFR-BUD-004The system shall visually flag a category's budget health (e.g. under, near, or over budget) using a distinct visual indicator, consistent with the traffic-light pattern used in the source spreadsheet.HighFR-BUD-005The system shall compute a savings-rate summary comparing Household income for the month against both budgeted total expense and actual total expense.MediumFR-BUD-006The system shall allow a user to copy a prior month's budget as the starting point for a new month rather than requiring re-entry from zero.Medium3.6 Dashboard & Reporting
Ports the behavior of the source spreadsheet's Dashboard sheet.
IDRequirementPriorityFR-DASH-001The system shall provide a month-selectable dashboard showing total income, total expense, total saving, and net balance for the selected month.HighFR-DASH-002The system shall provide a category-level expense breakdown for the selected month, sorted by amount descending.HighFR-DASH-003The system shall provide a multi-month trend view (minimum 12 months) of income versus expense.HighFR-DASH-004The system shall display a Household-level "net financial position" combining savings balance, total owed to the Household, and total owed by the Household into a single net figure.MediumFR-DASH-005The system shall allow export of a selected date range's transactions to CSV.MediumFR-DASH-006The system shall refresh all dashboard figures without requiring a manual page reload when the underlying data changes (e.g. a household member adds a transaction from another device).Medium3.7 Receipt Capture & OCR
New capability not present in the source spreadsheet, addressing the entry-friction problem identified in the feasibility study.
IDRequirementPriorityFR-RCPT-001The system shall allow a user to capture or upload a photo of a receipt from the mobile capture UI.MediumFR-RCPT-002The system shall extract, at minimum, vendor name, transaction date, line items, and total amount from an uploaded receipt image using a structured OCR extraction step.MediumFR-RCPT-003The system shall present the extracted data to the user for confirmation before creating a Transaction, with all fields editable prior to save.MediumFR-RCPT-004The system shall allow a receipt with multiple distinguishable line items to be split into multiple Transactions, each independently categorized, all linked to the same source receipt image (see FR-TXN-007).MediumFR-RCPT-005The system shall retain the original receipt image, associated with its resulting Transaction(s), for later reference.MediumFR-RCPT-006The system shall report a clear failure state and allow manual entry as a fallback when OCR extraction confidence is too low to auto-populate fields reliably.Medium3.8 SMS / Notification-Based Capture (Android)
New capability addressing bank-sync infeasibility in markets without open-banking coverage; identified in the feasibility study as the highest-leverage differentiator for the initial target market.
IDRequirementPriorityFR-SMS-001The system shall provide an explicit, revocable opt-in permission flow before enabling notification-listener access on Android; the feature shall be fully disabled by default.MediumFR-SMS-002The system shall parse bank- and telecom-originated debit/credit alert notifications to extract amount, merchant/payee, and date where the notification format is recognized.MediumFR-SMS-003The system shall route every parsed notification through the same AI categorization pipeline used for manual entry (FR-CAT-003 through FR-CAT-006) before creating a draft Transaction.MediumFR-SMS-004The system shall present parsed transactions to the user as drafts requiring a single confirming action before being saved as final Transactions, never saving a parsed transaction silently without user confirmation.HighFR-SMS-005The system shall allow a user to correct a misparsed amount, merchant, or date on a draft transaction before confirming it.MediumFR-SMS-006The system shall clearly indicate to the user, in-app, which notification formats are currently supported and degrade gracefully (no crash, no silent data loss) on unrecognized formats.MediumFR-SMS-007The system shall document, and the mobile client shall enforce, that this capability is unavailable on iOS due to platform restrictions, and shall not present the opt-in flow on iOS devices.High3.9 CSV Import / Spreadsheet Migration
First-class onboarding path given that the primary source of new Household data is expected to be an existing manually maintained spreadsheet.
IDRequirementPriorityFR-IMP-001The system shall allow a user to upload a CSV file and map its columns to Transaction fields (date, type, category, amount, description, payee) via an interactive mapping step.HighFR-IMP-002The system shall detect and surface unmapped or unrecognized category values during import, offering the user a one-time mapping to an existing or new category rather than silently discarding or mis-bucketing them.HighFR-IMP-003The system shall show a preview of the transactions to be created, including any rows that failed to parse, before committing the import.HighFR-IMP-004The system shall tag all transactions created via import with source = csv_import and shall not run them through the AI categorization suggestion flow if a category was already successfully mapped.HighFR-IMP-005The system shall support import of at least 5,000 rows in a single operation without failure or timeout.MediumFR-IMP-006The system shall allow a user to undo a completed import within a limited time window, removing all transactions created by that import batch.Medium3.10 Billing & Subscription Management
IDRequirementPriorityFR-BILL-001The system shall offer a free tier with defined usage limits and at least one paid tier with expanded limits and premium features (e.g. receipt OCR, SMS capture, extended trend history), consistent with the freemium model established in the feasibility study.HighFR-BILL-002The system shall process subscription payments via Stripe, supporting monthly and annual billing cycles.HighFR-BILL-003The system shall apply Stripe webhook idempotency and signature verification to all billing state changes, preventing duplicate processing of a single billing event.HighFR-BILL-004The system shall gracefully handle payment failures with a defined retry/dunning sequence and a clear in-app indication of subscription status.HighFR-BILL-005The system shall allow a Household owner to cancel a subscription, with access to paid features continuing through the end of the current paid period.HighFR-BILL-006The system shall void or refund outstanding invoices upon a verified account-deletion request, consistent with the account-deletion handling pattern established for the organization's other products.MediumFR-BILL-007The system shall enforce free-tier usage limits (e.g. transaction count, OCR scans per month) server-side, not only in the client UI.High3.11 Notifications
IDRequirementPriorityFR-NOTIF-001The system shall notify a user when their spend in a budgeted category crosses a configurable threshold (e.g. 90% of budget) within the current month.MediumFR-NOTIF-002The system shall notify Household members in real time when another member adds, edits, or deletes a shared transaction.MediumFR-NOTIF-003The system shall notify a user of an approaching or overdue debt per FR-DEBT-008.MediumFR-NOTIF-004The system shall allow a user to configure which notification categories they receive and via which channel (in-app, email, push).Low3.12 Bank Sync - Phase 3 / Future Scope
Explicitly deferred pending market validation of Phase 1-2 retention, per the Technical Build Plan. Included here to establish requirements ahead of implementation, not to imply Phase 1 scope.
IDRequirementPriorityFR-BANK-001(Future) The system shall allow a user in a supported market (initially US/UK/EU) to link a bank account via a third-party aggregator (e.g. Plaid) as a premium-tier feature.LowFR-BANK-002(Future) The system shall automatically import and de-duplicate transactions from linked bank accounts on a recurring schedule.LowFR-BANK-003(Future) The system shall route bank-synced transactions through the same AI categorization pipeline as manual entries.LowFR-BANK-004(Future) The system shall never store raw banking credentials; only aggregator-issued access tokens, held via a secrets-manager-backed encrypted field.LowFR-BANK-005(Future) The system shall allow a user to unlink a bank account at any time, immediately halting further automated import from that account.Low

4. External Interface Requirements
4.1 User Interfaces
• A responsive web application covering full dashboard, transaction management, budgets, debts, categories, and settings functionality, targeting desktop and tablet viewports.
• A mobile-first installable PWA optimized for the quick-add capture flow (FR-TXN-002), receipt capture (Section 3.7), and, on Android, SMS/notification capture (Section 3.8).
• All monetary values shall be displayed with the Household's base currency symbol and consistent decimal formatting throughout every screen.
• Color-coded status indicators (budget health, debt status) shall be accompanied by a non-color cue (icon or label) to remain usable for color-vision-deficient users.
4.2 Hardware Interfaces
• Camera access on the client device for receipt capture (Section 3.7); the system shall function fully without camera access via manual upload or manual entry as a fallback.
• No other hardware interfaces are required.
4.3 Software Interfaces
InterfacePurposePhaseAuth0User authentication, session management, Google Sign-In.Phase 1StripeSubscription billing, invoicing, payment method management, webhooks.Phase 1AWS BedrockAI-assisted category suggestion (FR-CAT-003+) and receipt category-mapping reasoning (FR-RCPT-002).Phase 1AWS TextractStructured OCR extraction from receipt images (FR-RCPT-002).Phase 2AWS S3 / CloudFrontReceipt image storage and delivery.Phase 2Plaid (or equivalent aggregator)Bank account linking and transaction import (FR-BANK-*).Phase 3 / future4.4 Communication Interfaces
• All client-server communication shall occur over HTTPS/TLS 1.2 or higher.
• Real-time Household updates (FR-DASH-006, FR-NOTIF-002) shall use a persistent WebSocket connection with automatic reconnection and graceful fallback to polling if a WebSocket connection cannot be established.


5. Non-Functional Requirements
5.1 Performance
IDRequirementPriorityNFR-PERF-001The quick-add transaction flow (FR-TXN-002) shall complete a save operation, including AI category suggestion, within 2 seconds under normal network conditions at the 95th percentile.HighNFR-PERF-002Dashboard aggregation queries (FR-DASH-001 through FR-DASH-003) shall return within 1.5 seconds for a Household with up to 50,000 transactions.HighNFR-PERF-003Receipt OCR processing (FR-RCPT-002) shall complete within 10 seconds at the 95th percentile, with a clear in-progress indicator shown to the user throughout.MediumNFR-PERF-004CSV import (FR-IMP-005) of 5,000 rows shall complete within 60 seconds.Medium5.2 Security
IDRequirementPriorityNFR-SEC-001All Household-scoped data access shall be enforced at both the application layer (guard/interceptor) and the database layer (row-level security) as independent, redundant controls.HighNFR-SEC-002Debt amounts, account balances, and any linked-account access tokens shall be encrypted at rest at the column level, independent of whole-disk encryption.HighNFR-SEC-003The system shall never log or transmit raw banking credentials in any form; only aggregator-issued tokens (Phase 3) shall be persisted, and only in encrypted form.HighNFR-SEC-004All third-party billing webhook events (Stripe) shall be signature-verified before processing, and shall be processed idempotently to prevent duplicate side effects from a single event delivered more than once.HighNFR-SEC-005The system shall support account deletion that removes or irreversibly anonymizes all personal financial data associated with the requesting user within a defined SLA (see Section 7.1).HighNFR-SEC-006The system shall not sell or share personal financial data with third parties for advertising purposes; this commitment shall be stated in the public-facing privacy policy.High5.3 Usability
IDRequirementPriorityNFR-USAB-001A first-time user shall be able to record their first transaction without consulting help documentation, verified via unmoderated usability testing with a target task-success rate of 90% or higher.HighNFR-USAB-002The system shall be operable and legible at a minimum viewport width of 360px without horizontal scrolling.HighNFR-USAB-003Every AI-suggested category shall be visually distinguishable from a user-confirmed category until the user takes a confirming action.High5.4 Reliability & Availability
IDRequirementPriorityNFR-REL-001The system shall target 99.5% monthly uptime for the core transaction-logging and dashboard functionality.HighNFR-REL-002Manual transaction entry (FR-TXN-001) shall remain fully functional if the AI categorization service (AWS Bedrock) is unavailable, degrading only the category-suggestion step to a plain manual category picker.HighNFR-REL-003The system shall retain automated daily backups of the primary data store with a minimum 30-day retention window and a documented, tested restore procedure.High5.5 Scalability
IDRequirementPriorityNFR-SCAL-001The system architecture shall support horizontal scaling of the API layer independent of the data store, consistent with the existing ECS Fargate deployment pattern.MediumNFR-SCAL-002The data model shall support at least 100,000 Households and an average of 10,000 transactions per Household without requiring a schema migration.Medium5.6 Maintainability
IDRequirementPriorityNFR-MAINT-001AI categorization prompts shall be versioned, with the ability to roll back to a prior prompt version without a code deployment, consistent with the prompt-versioning pattern already established in the organization's other AI-classification systems.MediumNFR-MAINT-002The system shall expose structured logs sufficient to trace a given Transaction's full lifecycle (creation source, categorization decision, any edits) for support and debugging purposes.Medium5.7 Compliance & Legal
IDRequirementPriorityNFR-COMP-001The system shall publish a privacy policy and terms of service prior to public launch, covering data collection, storage location, retention, and the no-data-resale commitment (NFR-SEC-006).HighNFR-COMP-002If and when Phase 3 bank-sync (FR-BANK-*) is implemented, the system shall comply with the data-handling and consent requirements of the relevant aggregator's terms and applicable open-banking regulation in each supported market.LowNFR-COMP-003The system shall comply with applicable data-protection law in each market it operates in, including data-subject access and deletion rights where applicable.High

6. Data Requirements
6.1 Core Entities
The full entity-relationship model is provided in Appendix A of the Technical Build Plan and is summarized here for completeness.
EntityPurposeHouseholdThe tenancy root; owns all financial data.UserAn authenticated individual, potentially a member of multiple Households.AccountA named money source/destination within a Household (manual or, in Phase 3, bank-linked).CategoryA classification label for transactions, household-editable, seeded with defaults.TransactionThe core record of a money movement; see FR-TXN-*.DebtAn informal debt entry with a person, direction, and principal; see FR-DEBT-*.BudgetA monthly budget target per category; see FR-BUD-*.ReceiptAn uploaded receipt image and its OCR extraction result; see FR-RCPT-*.SubscriptionA Household's billing/plan state; see FR-BILL-*.6.2 Data Retention
• Transaction, Debt, and Budget data shall be retained for the lifetime of the Household unless deletion is explicitly requested.
• Receipt images shall be retained for the lifetime of their linked Transaction(s) unless deletion is explicitly requested.
• Upon a verified account-deletion request, personal financial data shall be deleted or irreversibly anonymized within the SLA defined in Section 7.1, consistent with NFR-SEC-005.
6.3 Data Migration
As specified in FR-IMP-001 through FR-IMP-006, CSV import is the primary supported migration path from an existing spreadsheet-based system. The source spreadsheet referenced in Section 1.4 shall be used as the acceptance-test fixture for import behavior, including its known category-mapping edge cases (unmapped/migrated labels).


7. Other Requirements
7.1 Legal & Account Deletion SLA
An account-deletion request shall be fully processed, including data deletion/anonymization per NFR-SEC-005 and invoice voiding per FR-BILL-006, within 30 calendar days of a verified request, consistent with common data-protection deletion-request timelines.
7.2 Localization
• The initial release shall support English as the primary UI language, with the underlying architecture (externalized strings) supporting future localization without a rewrite.
• The initial release shall support a single configurable base currency per Household; multi-currency support is Phase 3 scope (see Section 2.6).
7.3 Licensing
Third-party services integrated per Section 4.3 (Auth0, Stripe, AWS Bedrock/Textract, and, in Phase 3, Plaid or equivalent) shall be used under their respective commercial terms of service; no requirement in this document presumes open-source licensing obligations beyond those already applicable to the organization's existing NestJS/Next.js stack.


Appendix A: Requirements Traceability Matrix (Template)
To be populated during test planning. One row per requirement ID; Test Case ID references the QA test suite.
Requirement IDTest Case ID(s)StatusFR-TXN-001TBDNot startedFR-CAT-003TBDNot startedFR-DEBT-002TBDNot started.........Appendix B: Priority Definitions
PriorityMeaningHighRequired for MVP / Phase 1 launch. The product is not viable for release without this requirement.MediumTargeted for Phase 2. Materially improves the product but does not block an initial launch.LowPhase 3 or later / future scope. Explicitly deferred pending validation of earlier phases.Appendix C: Glossary
See Section 1.3 for the primary definitions list. Additional terms are defined inline where first used.
