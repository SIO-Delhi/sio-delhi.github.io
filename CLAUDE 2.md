# SIO Delhi

SIO Delhi website

## Technology Stack

- Language: Typescript, ES2025
- Animations: GSAP
- Smooth Scrolling: Lenis
- Frontend: React + Vite, preconfigured
- Rendering: Client-Side Rendering
- Styling: Tailwind CSS, preconfigured
- Components: ShadCN/UI, preconfigured
- Icons: Lucide React, preinstalled
- State: TanStack Query, preinstalled ❓
- Forms: React Hook Form, Zod, preinstalled
- Tables: TanStack Table, preinstalled
- CSV: PapaParse, preinstalled
- PDF: @react-pdf/renderer, preinstalled
- Date: date-fns, preinstalled
- Uploads: React Dropzone, preinstalled
- Videos: React Player, preinstalled
- Charts: Recharts, preinstalled ❓
- Notifications: Sonner, preinstalled
- Formatting: Prettier, preconfigured
- Linting: ESLint, preconfigured
- Package Manager: Bun.js, preinstalled

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
- UI must be having some serious GSAP animations, and consistent across all interactions.
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

### Navbar 
- Home
- About
- LeaderSHip
- Media
- Initiatives and Projects
- Contact Us