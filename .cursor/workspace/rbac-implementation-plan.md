# RBAC Implementation Plan

_This document outlines the strategy and tasks for migrating the Desert Skies portal to a robust Role-Based Access Control (RBAC) system._

---

## **1. Objective**

Transition from a hard-coded, single-role system (with a JSONB workaround for multiple roles) to a flexible, database-driven RBAC architecture. This will improve security, simplify user management, and provide a scalable foundation for future permission-based features.

## **2. Codebase Audit Summary**

The current system relies on checking a `role` text column and a `metadata.additional_roles` JSONB array within the `profiles` table. This logic is spread across multiple critical areas:

- **Middleware (`middleware.ts`):** Enforces route protection based on role checks.
- **Layouts (`app/{admin,instructor,student}/layout.tsx`):** Perform role verification for their respective dashboard sections.
- **Login/Signup (`components/auth/*-form.tsx`, `app/api/auth/create-profile/route.ts`):** Handle initial role assignment and redirection.
- **Core Logic (`lib/user-service.ts`, `lib/supabase/server.ts`):** Contain helper functions to get or update a user's role.
- **UI Components (`components/shared/role-switcher.tsx`, `app/dashboard-picker/page.tsx`):** Provide UI for users with multiple roles.

This scattered approach is brittle and difficult to maintain. The new RBAC system will centralize this logic.

## **3. Implementation Checklist**

We will tackle this migration in phases to ensure a smooth transition.

### **Phase 1: Database & Backend Foundation**
- [ ] **SQL Migration:**
  - `[ ]` Create `roles`, `permissions`, `user_roles`, and `role_permissions` tables.
  - `[ ]` Populate with initial data (e.g., 'admin', 'instructor', 'student' roles and foundational permissions).
- [ ] **Data Migration:** Create a script to migrate existing users from `profiles.role` and `profiles.metadata.additional_roles` to the new `user_roles` table.
- [ ] **Database Functions:**
  - `[ ]` Create `get_user_roles(user_id)` function.
  - `[ ]` Create `has_role(user_id, role_name)` function.
  - `[ ]` Create `get_user_permissions(user_id)` function.
  - `[ ]` Create `has_permission(user_id, permission_name)` function.
- [ ] **Custom JWT Claims:** Update Supabase Auth to include user roles and permissions in the JWT for efficient client-side and server-side checks.
- [ ] **Row-Level Security (RLS):** Apply appropriate RLS policies to the new RBAC tables.

### **Phase 2: Service Layer Refactoring**
- [ ] **Authentication API:** Update `/api/auth/create-profile` to assign roles using the new `user_roles` table.
- [ ] **User Service:** Refactor `lib/user-service.ts` to manage roles via the new system, replacing functions like `updateUserRole`.
- [ ] **Supabase Helpers:** Deprecate `getUserRole` in `lib/supabase/server.ts` and replace its usage with new helper functions that leverage the JWT claims or database functions.

### **Phase 3: Application & Middleware Integration**
- [ ] **Middleware:** Refactor `middleware.ts` to use the new `has_role` and `has_permission` checks.
- [ ] **Layouts:** Update the `admin`, `instructor`, and `student` layouts to use the new authorization logic.
- [ ] **Dashboard Picker:** Update `app/dashboard-picker/page.tsx` to read roles from the new system.

### **Phase 4: Component & UI Cleanup**
- [ ] **Forms:** Update `login-form.tsx` and `signup-form.tsx` to align with the new role assignment and redirection logic.
- [ ] **Role-Aware Components:** Refactor `role-switcher.tsx` and other components that are aware of a user's role(s).
- [ ] **User Management UI:** Update the admin user management pages (`app/admin/users/*`) to display and manage roles using the new system.

### **Phase 5: Deprecation & Finalization**
- [ ] **Deprecate Old Columns:** Once the migration is complete and verified, mark the `role` and `metadata.additional_roles` columns in the `profiles` table as deprecated.
- [ ] **Documentation:** Update `documentation/auth_and_roles.md` to reflect the new, superior system.

---

## **Progress Notes**
- **[Date]:** Starting the RBAC implementation. First task: Phase 1 - Database & Backend Foundation. 