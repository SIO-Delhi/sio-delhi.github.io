# SIO Delhi 

SIO Delhi is an organization that works for the development of the students across Delhi. We are developing a system where each member has their own credentials (phone number + password) to login to their dashboard, view their info, and update whatever is required. The admin is able to track all members across the zone.

## Hierarchy

```
Admin (system-level)
 └─ Zonal Secretary (zone head — can assign zonal-level titles)
     ├─ Zonal Titled Positions (Zonal President, Media Secretary, etc.)
     └─ Regional President (oversees a group of units within the zone)
         └─ Unit President (unit head — can assign unit-level titles)
             ├─ Unit Titled Positions (Joint Secretary, JAC Secretary, etc.)
             └─ Member (base level)
```

Each level can see everything below it. Messaging flows both up and down the hierarchy. The Zonal Secretary can message all unit presidents, members, or specific individuals, as well as broadcast to all. Unit presidents can do the same within their unit. Regional presidents can message unit presidents and members within their region.

## Titles & Designations

Titles are additional designations assigned to users by higher-ups. They do **not** change the user's base role but grant additional UI access and permissions via RBAC.

- **Zonal-level titles**: Assigned by the Zonal Secretary (e.g., Zonal President, Media Secretary, Education Secretary, Cultural Secretary).
- **Unit-level titles**: Assigned by the Unit President to members within their unit (e.g., Joint Secretary, JAC Secretary, Treasurer, IT Secretary).
- A user retains their base role (e.g., `member`) and gains an optional `title` that appears next to their name and may grant elevated permissions.
- Title names are free-text — the assigning authority types the title (no fixed list).

## Access Control (RBAC)

The system uses Role-Based Access Control. Each role has a fixed set of default permissions. Titles can optionally grant additional permissions on top of the base role.

### Permissions

| Permission            | Admin | Zonal Sec | Regional Pres | Unit Pres | Titled Member | Member |
|----------------------|-------|-----------|---------------|-----------|---------------|--------|
| View all units        | ✓     | ✓         | Own region     | Own unit  | Own unit      | —      |
| Manage units (CRUD)   | ✓     | —         | —             | —         | —             | —      |
| View all users        | ✓     | ✓         | Own region     | Own unit  | Own unit      | —      |
| Manage users (CRUD)   | ✓     | —         | —             | —         | —             | —      |
| Assign titles         | ✓     | Zonal     | —             | Unit      | —             | —      |
| Approve migrations    | ✓     | ✓         | —             | —         | —             | —      |
| Initiate migrations   | ✓     | ✓         | ✓             | —         | —             | ✓ Own  |
| View performance      | ✓     | ✓         | Own region     | Own unit  | Own unit      | Own    |
| Send messages         | ✓     | ✓         | ✓             | Own unit  | Own unit      | Unit pres, Zonal sec only |
| Broadcast messages    | ✓     | ✓         | Own region     | Own unit  | Own unit      | —      |
| View own profile      | ✓     | ✓         | ✓             | ✓         | ✓             | ✓      |
| Edit own profile      | ✓     | ✓         | ✓             | ✓         | ✓             | ✓      |

> "Unit pres, Zonal sec only" means the member can message **only** their unit president or the zonal secretary (not regional president or other members).
> "Titled Member" means a member with an assigned title — they get the same view as their unit president for read-only access within the unit, plus the ability to message within the unit.

This thing is to keep track of the members, their performance, and if they are migrating to other zones etc.

### Circles

**Circles** are at the same level as **Units** and **Campuses**: they are a separate grouping. Each user can belong to one **unit** (required in practice; admin/zonal/regional are assigned to e.g. "SIO Delhi HQ") and optionally to one **circle**. Circles have their own list and CRUD (Add/Manage) under Admin; Zonal can view circles. Members are assigned to a circle via the user’s `circle_id` (and `circle_name` in the UI).

### Campuses

**Campuses** are at the same level as **Units** and **Circles**: a separate grouping. Each user can optionally belong to one **campus**. Campuses have their own list and CRUD (Add/Manage) under Admin; Zonal can view campuses. Members are assigned to a campus via the user's `campus_id` (and `campus_name` in the UI).

### Everyone in a unit

Every user (including Admin, Zonal Secretary, Regional President) is assigned to a **unit**. Zone-level roles use a dedicated unit such as **SIO Delhi HQ**. Unit is required when creating/editing users; the backend and seed reflect this.

### Permission overrides (admin toggles)

The **admin** can override what any user can do (**Powers**), regardless of role. Each user has an optional `permission_overrides` JSON: keys are permission names, values are `true`/`false`. If a key is present, it overrides the role default. The Edit User dialog (admin only) includes a **Powers (override role)** section with a checkbox per permission. Use `canUser(role, permission, permission_overrides)` in the frontend to compute effective permission.

## Authentication & Login

The portal uses **Clerk** for authentication — the same Clerk instance used for the main site's `/admin` login. There is no separate login system; all users sign in via Clerk's standard sign-in flow (phone number, email, or any method configured in Clerk).

**How it works:**

1. The Admin pre-registers users in the `portal_users` MySQL table with **first name, middle name (optional), last name**, phone number, role, unit, and password (password stored for legacy reference; not used for auth).
2. When a user visits `/portal`, they sign in through Clerk (standard Clerk `<SignIn>` component).
3. After Clerk authenticates them, the portal looks up their **phone number** in the `portal_users` table via `POST /api/portal/auth/me`.
4. If a matching `portal_users` record is found, the user's role, unit, title, and other data are loaded into the app context.
5. The role determines which dashboard, navigation items, routes, and data the user can access (enforced by `RoleGuard` in the router).
6. If no matching record is found, the user sees: *"Your account is not registered in the portal. Contact your administrator."*

**Default password and change password:**
- When the Admin adds a user (e.g. via bulk CSV), the initial password can be left empty. The system then generates a **default password**: first name (lowercase, letters only) + last 4 digits of mobile. Example: Adnan, 8447097627 → `adnan7627`.
- Users are expected to sign in with this default once and then **change their password** from the portal: Profile → "Account settings & password", which opens Clerk's account management (security / password).
- If a custom password is provided in the CSV, that is used instead of the generated one.

**Name fields and username:**
- User names are stored as **first_name**, **middle_name** (optional), and **last_name**. The API returns a computed **full_name** for display. Username for login is generated as first name (lowercase, alphanumeric) + birth year (e.g. `adnan1998`); duplicates get a suffix (`_2`, `_3`, …).

**Key points:**
- Clerk handles authentication (identity verification). The `portal_users` table handles authorization (role, unit, permissions).
- The Admin must add a user to `portal_users` before they can access the portal — simply having a Clerk account is not enough.
- Phone number or username is the linking key between Clerk and `portal_users` (phone stripped of `+91` prefix for matching).
- All API requests include the Clerk JWT token in the `Authorization` header; the PHP backend verifies it via Clerk's JWKS endpoint.

## Development Philosophy

### Simplicity & Pragmatism

- Follow DRY, KISS, YAGNI, and SOLID principles.
- Prefer the simplest readable solution; clever code is a defect.
- Never add code for hypothetical future requirements.
- Prefer deleting code over adding abstractions.
- If two solutions are equivalent, choose the more boring one.

### Code Organization

- Keep files small, focused, and with clear single responsibilities.
- All reusable logic must live in hooks, lib, or helper files.
- UI components must be purely presentational with no business logic.
- Avoid prop drilling; use composition patterns instead.
- Prefer ShadCN components over custom implementations.

### Reliability & Safety

- Handle loading and error states explicitly in every async operation.
- Errors must be visible, actionable, and never silent.
- Validate inputs and avoid unsafe assumptions about data shape or timing.
- Guard against race conditions and stale data in async logic.
- Never allow side effects during render.
- Eliminate stored derived state and unnecessary useEffect hooks.

### Maintenance

- Use meaningful names and write code that requires minimal explanation.
- Remove unused code immediately when discovered.
- Refactor only when it improves readability or maintainability.
- Do not introduce new dependencies without strong justification.

## Design Philosophy

### Core Principles

- Clarity and predictability are more important than visual appeal or delight.
- UI must be minimal, serious, and consistent across all interactions.
- Optimize for first-time and low-literacy users; assume no prior training.
- Responsiveness is mandatory across all common device sizes.

### Visual System

- Define and enforce a fixed design system for spacing, typography, and colors.
- Colors must communicate state (error, success, warning, disabled), not decoration.
- No animations beyond essential micro-feedback (button press, loading spinner).
- Maintain generous whitespace; avoid visual clutter.

### Feedback & Communication

- Every action must produce immediate, visible feedback.
- Errors must be inline, specific, and suggest resolution.
- Loading states must be explicit; never leave users guessing.
- Empty states must explain what's missing and how to proceed.

### Forms & Inputs

- Forms must be short, forgiving, and explicit about requirements.
- Labels must always be visible; never rely solely on placeholders.
- Validate inline on blur; summarize errors on submit.
- Use appropriate input types (date pickers, dropdowns) to reduce errors.

### Tables & Data

- Tables must be searchable and sortable by default.
- Paginate large datasets; never render unbounded lists.
- Provide clear column headers and alignment (numbers right, text left).

### Actions & Permissions

- UI must never expose actions the user cannot perform.
- Destructive actions must require explicit confirmation.
- Primary actions must be visually distinct; limit one per context.
- Disabled states must explain why the action is unavailable.

### File Handling

- Uploads must show progress, success, and failure states.
- Display file name, size, and type after selection.
- Provide clear options to retry or remove failed uploads.

## User Roles

### Admin

- `/admin/login` - Ability to login with phone number and password.
- `/admin/dashboard` - Collapsible menu on the left with logout option and a dashboard on the right showing total units, total members, members by status [active, inactive, migrated], and overall performance summary for the Delhi zone.
- `/admin/units/add` - Ability to add units in bulk via CSV [check `units.csv` below] with format examples shown on upload page.
- `/admin/units/manage` - Ability to view, update, and delete units with search and filter functionality, and export to CSV functionality.
- `/admin/campuses/add` - Ability to add campuses in bulk (or one-by-one) with format examples on upload page.
- `/admin/campuses/manage` - Ability to view, update, and delete campuses with search and filter functionality, and export to CSV functionality.
- `/admin/zonal-secretaries/add` - Ability to add zonal secretary accounts in bulk via CSV [check `zonal-secretaries.csv` below] with format examples shown on upload page.
- `/admin/zonal-secretaries/manage` - Ability to view zonal secretary accounts, update via inline edit dialogs, delete with confirmation dialogs, search and filter, and export to CSV functionality.
- `/admin/regional-presidents/add` - Ability to add regional president accounts in bulk via CSV [check `regional-presidents.csv` below] with format examples shown on upload page.
- `/admin/regional-presidents/manage` - Ability to view regional president accounts, update via inline edit dialogs, delete with confirmation dialogs, search and filter, and export to CSV functionality.
- `/admin/unit-presidents/add` - Ability to add unit president accounts in bulk via CSV [check `unit-presidents.csv` below] with format examples shown on upload page. Unit presidents are mapped to their unit via `Unit Name` column.
- `/admin/unit-presidents/manage` - Ability to view unit president accounts, update via inline edit dialogs, delete with confirmation dialogs, search and filter, and export to CSV functionality.
- `/admin/members/add` - Ability to add member accounts in bulk via CSV [check `members.csv` below] with format examples shown on upload page. Members are mapped to their unit via `Unit Name` column.
- `/admin/members/manage` - Ability to view member accounts, update via inline edit dialogs, delete with confirmation dialogs, search and filter, and export to CSV functionality. Title column shows any assigned designation.
- `/admin/titles` - Ability to view all title assignments across the zone with search and filter. Admin can also assign or revoke titles for any user.
- `/admin/performance` - Ability to create and manage performance evaluation forms for the entire zone or specific units. Can design forms with custom fields (MCQ, MSQ, Subjective, Checkbox, Number, Rating), view all responses, and delete forms.
- `/admin/migrations` - Ability to view all member migration requests [unit-to-unit transfers], approve or reject pending requests, and view migration history with search and filter functionality.
- `/admin/messages/compose` - Ability to send messages to the zonal secretary, all unit presidents, all members, specific individuals, or broadcast to everyone.
- `/admin/messages/inbox` - Ability to view all sent and received messages with search functionality.

### Zonal Secretary

- `/zonal/login` - Ability to login with phone number and password.
- `/zonal/dashboard` - Collapsible menu on the left with logout option and a dashboard on the right showing total units, total members, members by status [active, inactive, migrated], and performance summary. The zonal secretary can see everything down the hierarchy [all regional presidents, unit presidents, and members across all units].
- `/zonal/units` - Ability to view all units with member counts, search and filter functionality, and export to CSV functionality.
- `/zonal/regional-presidents` - Ability to view all regional president accounts with search and filter functionality, and export to CSV functionality.
- `/zonal/unit-presidents` - Ability to view all unit president accounts with search and filter functionality, and export to CSV functionality.
- `/zonal/members` - Ability to view all members across all units with search and filter functionality, and export to CSV functionality. Includes performance indicators, title, and migration status for each member.
- `/zonal/titles` - Ability to assign zonal-level titles (e.g., Zonal President, Media Secretary, Education Secretary) to any user below them. View and manage all zonal title assignments.
- `/zonal/performance` - Ability to create performance evaluation forms and view responses. Can create zone-wide or unit-scoped forms with custom fields (MCQ, MSQ, Subjective, Checkbox, Number, Rating).
- `/zonal/migrations` - Ability to view member migration requests [unit-to-unit transfers] and initiate migration requests for members moving between units.
- `/zonal/messages/compose` - Ability to send messages to all unit presidents, all members, specific individuals, or broadcast to everyone.
- `/zonal/messages/inbox` - Ability to view all sent and received messages with search functionality.

### Regional President

- `/regional/login` - Ability to login with phone number and password.
- `/regional/dashboard` - Collapsible menu on the left with logout option and a dashboard on the right showing units in their region, total members in those units, members by status, and performance summary for the region.
- `/regional/units` - Ability to view all units within their region with member counts, search and filter functionality, and export to CSV.
- `/regional/unit-presidents` - Ability to view unit president accounts within their region with search and filter functionality.
- `/regional/members` - Ability to view all members across units in their region with search, filter, title, and export.
- `/regional/performance` - Ability to create performance evaluation forms scoped to their region's units and view responses from members within their region.
- `/regional/migrations` - Ability to initiate migration requests for members within their region.
- `/regional/messages/compose` - Ability to send messages to unit presidents and members within their region, or to specific individuals.
- `/regional/messages/inbox` - Ability to view all sent and received messages with search functionality.

### Unit President

- `/unit/login` - Ability to login with phone number and password.
- `/unit/dashboard` - Collapsible menu on the left with logout option and a dashboard on the right showing total members in their unit, members by status [active, inactive, migrated], and performance summary for the unit.
- `/unit/members` - Ability to view all members within their unit with search and filter functionality, and export to CSV functionality. Includes performance indicators, title, and activity status for each member.
- `/unit/titles` - Ability to assign unit-level titles to members within their unit (e.g., Joint Secretary, JAC Secretary, Treasurer, IT Secretary). View and manage all unit title assignments.
- `/unit/performance` - Ability to create performance evaluation forms for their unit and view responses from members. Forms can have custom fields of any type (MCQ, MSQ, Subjective, Checkbox, Number, Rating).
- `/unit/messages/compose` - Ability to send messages to all members within their unit or to specific individual members.
- `/unit/messages/inbox` - Ability to view all sent and received messages with search functionality.

### Member

- `/member/login` - Ability to login with phone number and password.
- `/member/dashboard` - Collapsible menu on the left with logout option and a dashboard on the right showing personal info summary **including the member's full name**, current unit, title/designation (if any), activity status, and any pending updates requested by admin or unit president.
- `/member/profile` - Ability to **view** own profile (full name, phone number, unit, title, profile photo, and any additional fields). **Members cannot edit their name, phone, unit, or other profile details** — only profile photo (avatar) and password/account settings (via Clerk) are editable by the member. The profile overview at the top of the page must display the member's **full name** prominently.
- `/member/performance` - Ability to view and fill out performance evaluation forms assigned to their unit or zone. Can submit one response per form.
- `/member/messages/compose` - Ability to send messages **only** to their unit president or zonal secretary (not to regional president or other members).
- `/member/messages/inbox` - Ability to view all sent and received messages with read/unread status and search functionality.

## Sample Data

Pre-seed units, admin accounts, zonal secretary accounts, regional president accounts, unit president accounts, and member accounts to the MySQL database. The zone is Delhi [single zone, not configurable].

```units.csv
Unit Name
Jamia Unit
Okhla Unit
Laxmi Nagar Unit
Chandni Chowk Unit
Rohini Unit
```

```admins.csv
Full Name,Phone,Password
Ankit Singh,9397395704,8tE3mrK#l7Y
Preeti Verma,8204572942,OT8j9#i9aZU
```

```zonal-secretaries.csv
Full Name,Phone,Password
Ramesh Gautam,9847263851,37LmZ#FdzLE
Sunita Sharma,9429593922,VeL46Rbt0Q#
```

```regional-presidents.csv
Full Name,Phone,Password
Vikram Tandon,9312456780,rP4#mKz8vXw
Neha Kapoor,9456123780,nK7#qLs3bYt
```

```unit-presidents.csv
Full Name,Unit Name,Phone,Password
Priya Jain,Jamia Unit,9652748391,ghMlCiih9#Y
Aadhya Yadav,Okhla Unit,9894716385,e5ymEKMOcU#
Aanya Choudhary,Laxmi Nagar Unit,7014829637,#eUIO2cn7wr
```

```members.csv
Full Name,Unit Name,Phone,Date of Birth (DDMMYYYY),Password
Nandini Bhatt,Jamia Unit,8546392500,25031999,2#Lhg7J24wr
Myra Choudhary,Jamia Unit,7113719303,15062001,(leave empty for default)
Kabir Malik,Okhla Unit,9234567890,08051998,kM9#xPq2rTw
Ishaan Verma,Laxmi Nagar Unit,8765432109,12041997,(leave empty for default)
```
(Password is optional; if empty, default is first name + last 4 digits of mobile.)

Sample title assignments (pre-seeded):
- Sunita Sharma (Zonal Secretary) → title: "Zonal President"
- Nandini Bhatt (Member, Jamia Unit) → title: "Joint Secretary" (assigned by Unit President)
- Kabir Malik (Member, Okhla Unit) → title: "JAC Secretary" (assigned by Unit President)

## Additional Notes

- How is member performance tracked? -> Performance is tracked via dynamic forms. Admins, Zonal Secretaries, Regional Presidents, and Unit Presidents can create custom evaluation forms with fields of various types (MCQ, MSQ, Subjective, Checkbox, Number, Rating). Forms can be zone-wide or scoped to a specific unit. Members fill out these forms; responses are stored and viewable by authorized users. Each member can submit one response per form (subsequent submissions update the previous one).
- Can a member belong to multiple units? -> No, a member belongs to exactly one unit at a time. Transfers between units are handled via migration requests.
- What happens when a member migrates to another unit? -> A migration request is created and must be approved by the admin. Once approved, the member is reassigned to the new unit and marked as migrated from the previous one.
- Can unit presidents see members outside their unit? -> No, unit presidents can only view and manage members within their own unit.
- Is this system multi-zone? -> No, the current scope is Delhi zone only. Support for other zones [e.g., Mumbai] may be added in the future but is not part of the current design.
- What is a title? -> A title is an honorary designation (free-text string) assigned by a higher-up. It appears next to the user's name and may grant additional read-only access within their scope. It does not change their base role.
- Can a user have multiple titles? -> No, a user has at most one active title at a time. Assigning a new title replaces the previous one.
- Who can assign titles? -> The Admin can assign titles to anyone. The Zonal Secretary can assign zonal-level titles. The Unit President can assign unit-level titles to members within their unit.
- What is a Regional President? -> A Regional President oversees a group of units within the zone. They sit between the Zonal Secretary and Unit Presidents in the hierarchy. They can view data and initiate migrations within their region but cannot manage users or approve migrations.
- How are regions defined? -> Regions are not separate entities; a Regional President is simply assigned to oversee specific units. The mapping is managed by the Admin.
- What is a campus? -> A campus is a grouping at the same level as a unit and a circle. Each user can optionally be assigned to one campus. Admin can add/manage campuses; Zonal can view them. Use `campus_id` / `campus_name` in the user record and UI.
- Do users have profile photos? -> Yes, every user has an optional `avatar_url` field. Users can upload their profile photo from the `/member/profile` page. Avatars are stored on the server (`/uploads/avatars/`). When no avatar is uploaded, the UI displays the user's first initial on a colored background as a fallback. Avatars appear in the sidebar, top bar, profile page, and message views.
- What can members edit on their profile? -> Members can only update their profile photo (avatar) and password/account settings (via Clerk). They cannot change their name, phone, unit, or any other profile details; those are managed by admin or unit president. The profile overview (on dashboard and profile page) must always display the member's full name prominently.
- What is the backend architecture? -> The backend is a PHP API with MySQL/MariaDB database, hosted at `api.siodelhi.org`. Authentication uses Clerk JWT (RS256). The frontend communicates via REST endpoints (`/api/portal/*`). All portal routes are authenticated via Clerk tokens. API routes are defined in `api/routes/portal.php` and registered in `api/index.php`.
- How do performance forms work? -> Authorized users (Admin, Zonal Secretary, Regional President, Unit President) can create performance evaluation forms via `/performance/create`. Each form has a title, optional description, optional period (e.g., "2026-01"), and a scope (zone-wide or specific unit). Forms contain custom fields of types: MCQ (single choice), MSQ (multiple choice), Subjective (free text), Checkbox (yes/no), Number, and Rating (score out of N). Members see applicable forms on their `/member/performance` page and can fill them out. Authorized users can view all responses to forms they've created or have access to.
- Do users have a date of birth? -> Yes. `portal_users` has an optional `date_of_birth` field stored as **DDMMYYYY** (e.g. 25031999 for 25 March 1999). It is used for username generation (first name + year) and can be shown/edited in member profile and manage flows. The members CSV includes a "Date of Birth (DDMMYYYY)" column. Default password is first name + last 4 digits of mobile, not DOB.
- Can admins or leaders review performance responses? -> Yes. Admin, Zonal Secretary, Regional President, and Unit President can **review** a member's performance response: they can add a **comment** and a **rating** (e.g. 1–5) per response. Each reviewer has at most one review per response (adding again updates it). Reviews are shown on the response detail view when viewing responses for a form. Unit Presidents can only review responses from members in their unit; Regional Presidents only for members in their region; Zonal and Admin for all.