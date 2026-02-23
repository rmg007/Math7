# Questerix Terminology Standard

To ensure consistency across the codebase and UI, the following terms are standardized:

## 1. Tenancy Model

- **Tenant**: Refers to the organizational entity (e.g., a school or business). Use this in high-level business logic and security discussions (e.g., "Multi-tenant Isolation").
- **App**: The concrete implementation of a tenant in the database (`app_id`). In the UI, we refer to these as **"Apps"** (e.g., "Questerix Math").
- **Subdomain**: The unique URL prefix assigned to an App (e.g., `math.questerix.com`).

## 2. Platform Roles

- **Super Admin**: Global owner of the platform. Can manage all Apps, Subjects, and Global Settings.
- **Admin** (or **App Admin**): Manage curriculum and users within a single App.
- **Mentor**: Manage student groups and assignments within an App.
- **Student**: Consumer of the learning content.

## 3. Curriculum Hierarchy

- **Subject**: Broad academic area (e.g., Mathematics).
- **Domain**: A thematic area within a subject (e.g., Algebra).
- **Skill**: A specific learning objective (e.g., Factoring Quadratics).
- **Question**: An individual assessment item.

## 4. UI Standards

- **Wait/Loading**: Use "Initializing" for splash screens, "Syncing" for background data.
- **Actions**: Use "Architect" or "Initialize" for creation, "Refine" or "Commit" for updates in certain advanced contexts.

---

Last Updated: 2026-02-16
