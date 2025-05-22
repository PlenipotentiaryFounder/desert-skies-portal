# Ultimate Lesson Builder Roadmap

_Last updated: [2024-06-09]_

---

## **Schema & Backend**
- [x] Add rich lesson content fields to `syllabus_lessons`
- [x] Create tables: `core_topics`, `resources`, `skills`, `errors`, `what_to_bring`
- [x] Create join tables for lesson tagging
- [x] Enhance `maneuver_scores` for robust scoring/feedback
- [x] Create `lesson_feedback` table

## **API Endpoints**
- [x] CRUD endpoints for `core_topics`, `resources`, `skills`, `errors`, `what_to_bring`
- [x] CRUD endpoints for join tables (lesson tagging)
- [x] Endpoints for lesson JSON import/export
- [x] Endpoint for persistent lesson save/load (syllabus_lessons + tags)

## **UI/UX: Workstation Panels**
- [x] Scaffold workstation shell (sidebar, main area)
- [ ] Lesson Info panel (title, objectives, standards, email, etc.)
- [x] Maneuvers panel (taggable, scorable, commentable)
- [x] Core Topics panel (taggable, searchable)
- [ ] Resources panel (taggable, searchable)
- [ ] What to Bring panel (taggable, searchable)
- [ ] Preview/Email panel (live preview, email template)
- [x] JSON Import/Export panel (paste/upload/export lesson JSON)

## **Scoring & Feedback**
- [x] UI for scoring each maneuver (with instructor/student notes)
- [ ] UI for lesson feedback (overall notes, linked to session)

## **Polish & Testing**
- [ ] Responsive, accessible, beautiful UI
- [ ] Live validation, error handling, toasts
- [ ] Documentation and onboarding

---

## **Next Steps**
1. UI integration for persistent save/load (in progress)
2. Polish, test, and document

---

**Use this file to track progress and priorities as the lesson builder evolves.**

**Note:** Scoring rubric and feedback template support for maneuvers and lessons is now implemented in the builder UI. 