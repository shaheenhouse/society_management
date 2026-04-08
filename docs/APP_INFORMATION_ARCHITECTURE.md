# App Information Architecture

## Navigation Model

- `Dashboard`: member-focused home (user card, society balance, quick stats, recent activity).
- `Pay`: contribution submission flow for selected society.
- `History`: immutable ledger timeline + public audit comments.
- `Society`: single workspace for society operations:
  - society switch/select,
  - invite/share,
  - members and join requests,
  - payment/expense approvals,
  - role assignments,
  - events/fundraising.
- `Settings`: user/account preferences only.

## Governance and Trust

- Society management is centralized in the `Society` workspace.
- Expense approvals require quorum before final approval.
- Ledger remains append-only for auditability.
- Members can post public comments on transactions for transparent community audit.

## Remaining Production Items

- Reminder automation (monthly + weekly) via scheduled jobs.
- Manager broadcast notifications/popup reminders.
- DB-level enforcement of approval quorum (function + trigger).
- Event contribution linking from approved payment requests.
- Pagination and server-side aggregates for large societies.
