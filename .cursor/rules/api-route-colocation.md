# API Route Colocation in Next.js App Directory

## Decision
We colocate API routes with the pages/components that use them in the `/app` directory (e.g., `/app/instructor/students/new/api/route.ts`).

## Rationale
- **Clarity:** Keeps API logic close to the UI/page that uses it, making it easier to maintain and understand.
- **Encapsulation:** Reduces the risk of accidental reuse or exposure of internal endpoints.
- **Modern Next.js Pattern:** This is a recommended approach in Next.js 13+ App Router for internal, page-specific actions.
- **No `/api/` Prefix:** These routes are not exposed under `/api/`, but are accessible at their colocated path (e.g., `/instructor/students/new/api`).

## When to Use
- Use colocated API routes for internal, page-specific actions (e.g., form submissions, server actions).
- Use `/app/api/...` for general, reusable, or public API endpoints.

## Example
```
/app/instructor/students/new/api/route.ts  // Handles POST for new student enrollment
/app/api/instructor/students/route.ts      // Handles GET for listing students
```

## Review
- This pattern is currently in use for the new student enrollment flow as of [date].
- Revisit if API needs become more complex or require broader reuse. 