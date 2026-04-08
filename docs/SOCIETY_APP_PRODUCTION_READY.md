# Society App Production-Ready Blueprint

## Product Vision

This app is a transparent society fundraising and expense audit platform where:

- Any user can register and create a society.
- Users can search societies and request to join.
- Admins approve join requests.
- Members submit contribution payments.
- Admins/Finance Managers approve payments.
- Approved contributions appear in history and balance.
- Admins/Finance Managers can create expenses for society work.
- Expenses are approved by governance rules.
- Full financial history is visible to society members to build trust.
- Societies can run fundraising and community events.

## Current Core State (after this update)

- Fixed ledger/history loading path by removing invalid relation lookup from `ledger_entries`.
- Added stronger ledger hydration for both payment and expense references.
- Added society-required guards on dashboard/payment/history/settings pages.
- Added dedicated `Society` workspace tab where all society operations are centralized.
- Redesigned dashboard to be member-first (profile-centric with society financial snapshot).
- Added role management tools in management dashboard (Admin can assign Member/Finance/Admin).
- Added finance-manager access for approvals.
- Added expense workflow with multi-approval finalization rules:
  - 2 finance managers, or
  - 1 admin + 1 finance manager.
- Added schema hardening:
  - approval uniqueness indexes,
  - dashboard/history query indexes,
  - event/fundraising schema foundations,
  - transaction comments schema for public audit.

## Functional Requirements Matrix

### 1) Authentication and Profile

- [x] Register / login with Supabase Auth.
- [x] Auto/fallback profile creation.
- [ ] Add profile completion checks (phone, avatar, optional address).
- [ ] Add account recovery UX and password reset flow.

### 2) Society Lifecycle

- [x] Create society.
- [x] Search public societies.
- [x] Join via search or invite code.
- [x] Admin can approve pending joiners.
- [x] Society selector implemented.
- [x] Society screens gated by active society.

### 3) Roles and Permissions

- [x] Role model includes admin/finance manager/member.
- [x] Admin dashboard can change active member roles.
- [x] Finance manager can approve financial requests.
- [ ] Add RLS enforcement for role mutation (server-side guarantee).

### 4) Contributions

- [x] Members submit payment requests (with optional proof).
- [x] Admin/Finance manager approvals.
- [x] Verified payments write append-only ledger credit entries.
- [x] Payment history visible through ledger.

### 5) Expenses and Governance

- [x] Expense requests by managers.
- [x] Multi-approval logic before final expense approval.
- [x] Approved expenses write ledger debits.
- [ ] Move quorum logic to PostgreSQL function + trigger for tamper-proof enforcement.

### 6) Audit and Transparency

- [x] Ledger model is append-only.
- [x] Total received / spent / balance dashboard.
- [x] Public comments on payment/expense transactions (member-visible audit discussion).
- [ ] Add dedicated audit log writing on key state transitions.
- [ ] Add monthly downloadable statement export (CSV/PDF).

### 7) Events and Fundraising

- [x] Schema foundations added:
  - `society_events`
  - `event_contributions`
- [x] UI for creating/listing events.
- [ ] Event pledge/progress widgets and event-specific contribution mapping.
- [ ] Meeting invite attendance tracking.

### 8) Notifications and Reminders

- [ ] Monthly and weekly reminders for unpaid members (scheduled jobs).
- [ ] Manager-triggered payment reminder broadcast popup.
- [ ] Notification preferences per member.

## Production Readiness Checklist

## Backend and Data

- [ ] Move critical approval/quorum logic into DB functions.
- [ ] Add RLS policies for:
  - payment approvals,
  - expense approvals,
  - manager-only role updates,
  - event create/update.
- [ ] Add migration files and versioning (`supabase/migrations`).
- [ ] Add data retention policy for proof images.

## Performance

- [x] Added high-value indexes for growth paths.
- [ ] Add pagination for history and approvals lists.
- [ ] Add server-side aggregate endpoints/views for stats.
- [ ] Add cache invalidation strategy for heavy societies.

## Reliability and Observability

- [ ] Add error boundary + fallback UI per major route.
- [ ] Add remote logging (Sentry or equivalent).
- [ ] Add uptime check for Supabase project.
- [ ] Add alerting for failed scheduled reminders.

## Security

- [ ] Validate file upload mime/size in storage policies.
- [ ] Add brute-force protection strategy for login.
- [ ] Add stricter policy tests for role boundaries.
- [ ] Remove `.env` from git and rotate keys if leaked.

## Testing

- [ ] Unit tests for hook-level business rules.
- [ ] Integration tests for payment/expense approval state machine.
- [ ] E2E happy paths:
  - user joins society,
  - member submits payment,
  - manager approves,
  - ledger and balance update.

## Suggested Next Milestones

1. **M1 (Stability):** Move approval logic to DB + add policy tests.
2. **M2 (Features):** Build events module UI + contribution-to-event linking.
3. **M3 (Engagement):** Implement scheduled reminders and broadcast notifications.
4. **M4 (Scale):** Pagination, server aggregates, observability dashboards.
