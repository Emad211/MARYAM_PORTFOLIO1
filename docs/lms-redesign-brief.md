# LMS Redesign Brief — Benchmark Synthesis (2026-08-31)

Sources: 4 parallel research lanes (TestDaF-native platforms; teacher-side LMS UX; TOEFL/IELTS exam-prep UX; Iranian DaF market) via local search stack. Lane 5 (Goethe/DW general platforms) failed on provider content filter — scope covered by other lanes.

## A. What the winners do (validated patterns)

### Information architecture
- **IA = the exam itself.** Every serious product organizes by Lesen/Hören/Schreiben/Sprechen, then by official task type (LT1-3, HT1-3, SA, MA1-7) — never by CEFR grammar curricula. [testdaf.de, DUO, PrepDaF, Prepilingo, Aktiv]
- **Modelltest in original format = anchor asset.** DUO's moat is a licensed Original-Modelltest; everyone else ships replicas with disclaimers. Simulation is the product, not a feature. [DUO, PrepDaF, SprechTrainer]
- **Free placement/diagnostic = entry gate** + B2-gating language. [PrepDaF, Prepilingo, GermanExamPro, Aktiv]
- **Transcripts + solutions ship with every listening asset.** Audio-once + transcript-after is standard review UX. [official, PrepDaF]

### Student loop (TOEFL/IELTS maturity)
- Home = **"what to do next"**: exam-date countdown, suggested lesson+drill, linear pathway checklist. [Magoosh, E2, PrepDaF]
- **Two practice modes**: study (instant per-question feedback + explanation) vs test (feedback withheld to end). [Magoosh]
- **Explanation quality is the moat** — why each distractor is wrong, not just the key. E2's answer-only explanations are its worst-reviewed feature. [Magoosh vs E2 reviews]
- **Sectional mocks = spine; full mock = event; separate question pools** (Magoosh's mocks reuse drill bank → its top criticism).
- **Human feedback = quantified SLA + official rubric verbatim + inline corrections on student's own text + forward-looking suggestion.** E2: 48h published, essay returned annotated. DUO: "5 feedback rounds" per course as pricing tier. [E2, DUO/DFH]
- **Score prediction: RANGE never single number**, cohort-anchored, min-volume stated (~50 questions), known-skew disclosed. [Magoosh, Manhattan, ieltsbiz ±0.5/94.2%]
- **No XP/badges/leaderboards in mature products.** Motivation = visible progress toward score goal + guarantees + human attention. Streaks appear only in weekly email summaries. [all 4 lanes]

### Teacher experience (the "effortless" bar)
- **Calendar IS the app**: schedule → attendance → auto-invoice. Lesson card = one page holding attendance + notes + homework + materials. [TutorBird, Teach 'n Go]
- **Action-alert strip first**: pending enrollments · unreviewed submissions · unread messages — each deep-links to queue. [Kajabi, Teach 'n Go]
- **Course creation from blueprints, never blank page.** Kajabi templates; Teachable AI-generates curriculum from prompt. [Kajabi, Teachable]
- **Nobody gives teachers authoring surfaces in exam-prep**: DUO tutors work on rails (fixed Lernpfade + correction queue + forum); content authored by platform teams. Single-tutor LMS must therefore make authoring 10× cheaper via templates/duplication/import. [DUO tutor handbook, g.a.s.t. freelance model]
- **Row-level ellipses actions**: reset quiz / complete on behalf / reset progress, auto-email on reset. [Teachable]
- **Flat noun-nav ≤5**: Today · Students · Content · Messages · Settings. [italki]
- **Everything ON by default; progressive disclosure via Advanced accordions** (Teachworks' 60-add-on model = documented anti-pattern).
- **Homework as lesson-end step with suggestions + Skip/Opt-out**. [Preply]
- **Pre-send review buffer for every automated outgoing message.** [TutorBird]
- **Purpose-grouped add-picker with pedagogical nouns** (Practice/Quiz/Video/Live/Homework), gradable badges, copy-permalink on every item. [Moodle 5.1]

### Iranian market reality
- **Only one local digital competitor: Prepino (prepino.ir)** — mock engine, new, free, German-first UI, no tutor, no curriculum. Beatable.
- Everything else = brochure sites + phone funnels (Felarise, Mellal), generic 1:1 marketplaces at 100–150k toman/session (Tikka), or offline workshops 4M–9.6M toman (DAL, Sepano).
- **Nobody combines tutor + mock engine + feedback loop.** Single-tutor brand = trust asset (face/credentials) vs anonymous marketplaces.
- Must-haves: fa-first RTL UI, rial gateway + e-namad + guarantee (USDT for diaspora), **Telegram notifications**, low-bandwidth delivery, evening-Tehran scheduling, exam-registration concierge (payment friction = biggest Iran pain).
- Learners literally substitute teacher feedback with ChatGPT → feedback scarcity = proven demand.

## B. Our LMS vs the bar (gap analysis)

| # | Gap | Severity |
|---|---|---|
| 1 | IA is class-centric (classes→modules→lessons), not exam/task-type-centric; mock engine buried in a tab | CRITICAL |
| 2 | No exam-date concept, no countdown, no daily plan, no "continue" — dashboard is widgets not a pathway | CRITICAL |
| 3 | No diagnostic placement entry | HIGH |
| 4 | Practice = study-mode only; no test-mode; no task-type drill selection; no separate mock pool tagging | HIGH |
| 5 | Questions have answer keys but NO explanations (why wrong) | HIGH |
| 6 | Feedback = textarea only; no inline annotation of student text; no published SLA/turnaround | HIGH |
| 7 | TDN shown per-mock only; no cumulative readiness range w/ confidence + min-volume | MED |
| 8 | Authoring heavy: manual trilingual ×N fields per question; no duplicate button; no bulk import; no blueprints | CRITICAL (teacher ease = owner's #1 ask) |
| 9 | Sessions = list, not week calendar; attendance separate from session context; no homework assignment flow from live sessions | HIGH |
| 10 | No Telegram notifications | MED (Iran) |
| 11 | Payments = manual bookkeeping (fine v1; rial PSP later) | LOW |
| 12 | Cold-start content volume: demo seeds only; official Modelltest structure not imported as blueprint | HIGH |

Strengths to keep: mock engine (timer/audio-once/TDN bands) already exists; submissions+rubric queue exists; SRS vocab exists; trilingual fa-first; RLS security; ops cockpit + grouped sidebar just shipped.

## C. Target shape — "TestDaF Cockpit" (single tutor brand)

Student: countdown → today's plan → skill tracks (4 sections × task types) → drills (2 modes, explained) → sectional/full mocks → human feedback loop → readiness range. Teacher: calendar-first home (alerts + week view + lesson cards) → blueprint-based authoring with duplicate/import → inline-annotating feedback editor → one-click homework.

## D. Build waves (proposal)

### Wave R1 — Teacher ease first (owner's stated priority)
R1.1 Week-calendar session view (drag-create/edit, conflict check) + **lesson card** (attendance+notes+homework+materials in one page)
R1.2 **Homework assignment flow**: from student/class/session → assign exercise-set/lesson with due date → appears in student pathway; skip/opt-out
R1.3 **Feedback editor v2**: select-text→comment inline annotations on student writing + rubric + template snippets (Korrekturzeichen) + SLA timestamp shown to student
R1.4 **Authoring accelerators**: duplicate lesson/question/module buttons; per-task-type blueprint forms (pre-shaped fields); CSV/paste bulk import for a Modelltest section; explanations field everywhere
R1.5 Automated messages outbox w/ pre-send review buffer (session reminders)

### Wave R2 — Student exam-centric IA
R2.1 Exam-date profile field + countdown header + readiness range (cumulative, min-volume note)
R2.2 Home → linear pathway checklist + "continue" CTA (replaces widget pile; vocab streak stays as chip)
R2.3 Skill-track pages /tracks/[lesen|hoeren|schreiben|sprechen] with task-type sections; re-tag questions with task_type; drill selector by task type + mode toggle (study/test)
R2.4 Explanations surfaced post-answer + in mock review
R2.5 Separate mock question pool flag; diagnostic mini-test entry (20q → baseline TDN)
R2.6 Mock engine UX parity: no-back-nav in sim mode (already), transcript-after for Hören review

### Wave R3 — Iran wedge
R3.1 Telegram bot notifications (feedback ready, session reminders, homework due)
R3.2 Payment tiers + feedback credits (E2 monetization pattern); Zarinpal/rial gateway + e-namad placeholder (business decision needed)
R3.3 Exam-registration concierge page (dates, payment how-to) — SEO + trust
R3.4 Performance pass: audio lazy-load, light pages

Open decisions for owner: (a) wave order R1→R2 confirmed? (b) Telegram bot yes/no; (c) rial gateway provider + pricing tiers; (d) default target exam = TestDaF digital.
