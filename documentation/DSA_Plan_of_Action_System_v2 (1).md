# ✈️ Desert Skies Aviation – Plan of Action System (v1.1)

**Author:** Thomas Ferrier  
**Project:** DSA.Plan of Action  
**Purpose:**  
This document defines the standardized format, structure, and operational logic for generating “Plan of Action” entries for student flights at **Desert Skies Aviation**.  
Each plan is a dynamic entry written directly to the student, automatically integrating prior debrief data (if available) and producing a clear, cohesive plan for their upcoming flight.

---

## 🧭 Overview

The Plan of Action system listens to spoken or written input describing the next flight—such as departure direction, maneuvers, destination, tail number, and focus areas—and builds a complete, student-facing flight plan.

If the system has access to prior **debriefs** for that student, it will automatically incorporate relevant performance notes such as:
- Areas that need reinforcement or correction  
- Skills the student demonstrated well  
- Any carry-over objectives for continued improvement  

This enables continuity between lessons, ensuring each Plan of Action connects directly to the student’s current progress.

---

## ⚙️ General Rules and Defaults

- **Flight Duration:** Defaults to **2.0 hours** unless otherwise specified.  
- **Departure:** Always from **Falcon Field (KFFZ)** — only the *direction* (East, South, West, etc.) is variable.  
- **Route:** Specify only the *focus airport* or *practice area*.  
- **Voice:** All entries are written directly **to the student** (second-person tone).  
- **Video and Resource Verification:**  
  - All YouTube links must be checked for validity before use.  
  - All FAA links should come directly from official FAA domains and be verified active.  
- **Debrief Integration:**  
  - When debriefs exist, key strengths and focus areas are merged into the “Student Focus Notes” section.  
  - When no debrief exists, focus defaults to core performance and safety objectives for that flight profile.

---

## 📋 Plan of Action Template

### 📅 Flight #[Flight Number] – [Student Name]  
**Date/Time:** [Insert time]  
**Instructor:** Thomas Ferrier  
**Aircraft:** [Tail Number]  
**Departure:** [Departure Direction]  
**Destination / Focus Airport:** [Airport Identifier / Name]  
**Duration:** 2.0 hrs  

---

### 🔹 Mission Overview  
We’ll depart Falcon Field via a [Departure Direction] and proceed toward [Practice Area / region].  
We’ll begin with [specific maneuvers – e.g., slow flight (dirty), power-off stalls] to build awareness of aircraft handling, then transition to [primary training task – e.g., short-field landings] at [Destination Airport].  
You’ll focus on maintaining precision, flow, and situational awareness throughout each phase of flight.

---

### 🎯 Training Objectives  
- [Objective 1 – skill-based goal]  
- [Objective 2 – procedural or decision-making focus]  
- [Objective 3 – performance consistency focus]  
- [Optional additional objectives as needed]  

---

### ⚙️ Student Focus Notes  
These are your primary areas of attention for this flight:  

- [Focus Note 1 – use recent debrief insights or instructor emphasis]  
- [Focus Note 2 – example: smooth coordination through stall recovery]  
- [Focus Note 3 – example: earlier flare awareness on narrow runways]  

If debrief data exists, this section dynamically includes:  
- Areas the student struggled with previously  
- Strengths demonstrated on the last flight  
- Continuity goals for skill reinforcement  

---

### 🧠 Pre-Flight Study Material  

#### **Video Resources (auto-searched and verified):**  
1. [Video Title 1] — [Full YouTube URL]  
2. [Video Title 2] — [Full YouTube URL]  
3. [Video Title 3] — [Full YouTube URL]  

*(Videos are automatically selected from up-to-date Piper Archer/Warrior (PA-28) tutorials and verified before posting.)*

---

#### **FAA and Reference Materials (auto-linked):**  
- **Airplane Flying Handbook (FAA-H-8083-3C)** — https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook  
- **Private Pilot Airman Certification Standards (FAA-S-ACS-6C)** — https://www.faa.gov/training_testing/testing/acs/media/private_airplane_acs.pdf  
- **Pilot’s Handbook of Aeronautical Knowledge (PHAK)** — https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak  

*(Additional links may be added automatically if specific maneuvers reference unique FAA resources.)*

---

### ✅ Student Prep Checklist  
Before arriving, make sure you’ve:  
- Completed a **full pre-flight action** (weather, weight & balance, aircraft inspection, fuel planning).  
- Reviewed the assigned **videos** and **FAA resources** above.  
- Familiarized yourself with the **destination airport** (runway width, orientation, elevation).  
- Mentally rehearsed your approach flows and go-around decision points.  
- Arrived 10–15 minutes early for pre-brief and flight setup.

---

## 🧩 Generation Instructions

### Input Parameters  
When prompted to generate a Plan of Action, provide:  
- Student name  
- Flight number  
- Departure direction  
- Focus airport or practice area  
- Maneuvers or training objectives  
- Aircraft tail number  
- Optional: notes or debrief summary for that student  

### Generation Logic  
1. **Listen to Input:** The system listens to the instructor’s verbal or written description of the upcoming flight.  
2. **Extract Key Elements:** Departure direction, maneuvers, objectives, tail number, destination, and focus topics.  
3. **Integrate Past Data:**  
   - Pulls in highlights from the most recent debrief (if accessible).  
   - Prior strengths become reinforcement notes.  
   - Prior weaknesses become specific “Student Focus Notes.”  
4. **Build Final Output:**  
   - Auto-inserts verified FAA links.  
   - Searches and verifies 2–3 new YouTube training videos related to the maneuvers.  
   - Writes all content in a clean, second-person tone addressed to the student.  
5. **Output:**  
   - Returns a clean Markdown or plain-text entry ready for Google Calendar or email.  

---

## 🧱 Future Automation

When integrated into DSA’s main system, this process will:  
- Pull **student names and prior debriefs** from Supabase or a dedicated student database.  
- Use **voice recognition** or **typed input** to generate each Plan of Action automatically.  
- Deliver a formatted calendar-ready output, optionally attaching the most recent **debrief** for reference.  

---

**End of Document**  
*Version 1.1 – October 2025*  
