# Research Report: TestDaF Prep Landscape, Mock-Exam Design & Spaced Repetition

> **Purpose:** Distill competitor/prep-resource research and algorithmic design into concrete, implementable recommendations for this codebase (Next.js 16 + Supabase, no ML infrastructure).
> **Method:** Web search + primary-source fetches (Aug 2026). Every factual claim carries a URL.
> **Convention:** Sections labeled **FACTS** report what sources say. Sections labeled **RECOMMENDATIONS** are our synthesis for this project.

---

## 1. Competitor / Prep-Resource Scan

### 1.1 TestDaF-Institut (official) — testdaf.de

**FACTS**
- Official prep page offers task-strategy tips per exam part ("Welche Strategien helfen bei der Bearbeitung von Aufgabe 1 im Leseverstehen?"), **two full official Modelltests**, each with a tutorial of hints/tips per task type; plus paid partner courses by Deutsch-Uni Online (DUO): "Express-Training", "Training", "Training mit Voice-Chats" (B2/C1), all working "im Original-Testformat und mit einem Original-Modelltest". https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/vorbereitung-auf-den-papierbasierten-testdaf/
- Same page notes **five Musterprüfungen with original TestDaF-Institut tasks are sold commercially via Hueber** — official-quality mock content is a scarce, licensed asset.
- Digital TestDaF prep via DUO likewise trains in original test format. https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/vorbereitung-auf-den-digitalen-testdaf/
- **Scoring model (official):** four parts scored independently as TDN 3/4/5; no aggregate score. Lesen/Hören are item-counted (max 30 and 25 points). Cut scores are **re-derived statistically per test form**: Lesen TDN 5 requires ≥24 *or* 25 *or* 26 points depending on form difficulty; TDN 4 ≥20/21/22; TDN 3 ≥14/15/16. Hören: TDN 5 ≥19–21, TDN 4 ≥15–17, TDN 3 ≥10–12. Schreiben/Sprechen are rated by trained raters against published criteria (effect on reader/listener, task fulfillment incl. graph description, language range/coherence/error tolerance); Sprechen has 7 tasks each pre-mapped to a TDN level. https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/auswertung-des-papierbasierten-testdaf/
- Third-party explainers confirm: no average/total grade; most universities require TDN 4 in all four parts. https://www.zertifly.com/de/blog/tdn-seviyeleri

### 1.2 Goethe-Institut — free practice materials & apps

**FACTS**
- Per-exam free practice pages organized **by skill** (Hören, Lesen, Schreiben, Sprechen), including accessible Modellsätze; example B1: https://www.goethe.de/ins/de/de/prf/prf/gzb1/ueb.html
- Interactive **online** model exams hosted on Goethe infrastructure (e.g., accessible B2 Modellsatz with screen-reader support at `bfu.goethe.de/b2_mod_2MX6/index.php`) — browser-based full mock exams, not just PDFs.
- Practice flow on Goethe's DtZ material: exercise → immediate check after every task ("Nach jeder Aufgabe erhalten Sie eine Kontrolle"). https://www.goethe.de/de/spr/mig/deu.html
- Note: goethe.de blocks automated fetching from this network; facts above come from indexed snippets and third-party mirrors (e.g., Klett hosts downloadable Modelltests keyed to book codes: https://www.klett-sprachen.de/downloads/goethe-zertifikat-b1-neu-modelltest/c-936).

### 1.3 Deutsche Welle — Nicos Weg / DW Deutsch lernen

**FACTS**
- Free story-based video course in **three courses: A1, A2, B1**; produced by DW with Germany's Federal Employment Agency; multilingual UI (incl. Persian). Each course ≈ 2 hours of video split into **~76 short episodes (~2-min clips)**; **each episode carries interactive exercises**; each level ends with a **final test + DW certificate**. https://www.lingoclub.com/nicos-weg/
- Dual access structure: watch as one coherent film or jump to individual clips by topic; exercises accompany every clip. https://www.transmitter-berlin.de/en/learning-tips/learning-videos-nicos-weg-by-deutsche-welle/
- Community-made spaced-repetition decks exist for Nicos Weg vocabulary (Brainscape) — demand exists for vocab drilling layered onto course content. https://www.brainscape.com/subjects/nicos-weg

### 1.4 Lingoda

**FACTS**
- Live online school: 60-minute classes, native-level teachers, small-group or private formats, CEFR-aligned curriculum A1–C1, certificates, 24/7 scheduling. https://www.lingoda.com/en/german/
- Curriculum granularity: **each CEFR sublevel = 50 classes** (A1.1, A1.2, …); fixed structured curriculum rather than free-form tutoring. https://lingoda-students.elevio.help/en/articles/379-my-course-overview-of-levels-and-curriculum
- Reviewers position it as "structured school" vs. tutor marketplaces. https://onlinecourseing.com/lingoda-review/

### 1.5 italki / Preply (exam-prep marketplaces)

**FACTS**
- Both expose dedicated **TestDaF tutor filters**: italki lists TestDaF prep tutors with sample lesson plans; Preply advertises tutors sharing "interactive materials and sample tests" targeting weak areas. https://www.italki.com/en/teachers/german-testdaf · https://preply.com/en/online/tutors-testdaf
- Comparison reviews: Preply adds a placement test, structured lesson plans, and between-lesson "Daily Exercises / Scenario Practice" driven by performance data; italki's between-lesson materials depend entirely on the individual tutor. https://preply.com/en/blog/italki-and-preply-review/ · https://linguasteps.com/comparisons/italki-vs-preply-which-language-learning-platform-suits-you-best

### 1.6 Book series

**FACTS**
- **Fit für den TestDaF (Hueber):** tips + exercises covering all exam parts; includes solutions to all tasks and audio transcripts; positioned for both prep courses and self-study; reflects the post-2005 "Mündlicher Ausdruck" format. https://shop.hueber.de/de/sprache-unterrichten/deutsch-als-fremdsprache-daf-daz/lehrwerk/fit-fuer-den-testdaf-paket-978-3-19-001699-0.html
- **Mit Erfolg zum TestDaF (Klett):** "complete training program" for B2–C1, Übungs- und Testbuch with audios, for prep courses and self-learners. https://www.klett-international.com/de/mit-erfolg-zum-testdaf/t-1/9783126757850
- Common pattern across books: organize by **exam part first** (Lesen → Hören → Schreiben → Sprechen), strategy tips per Aufgabentyp, then full Übungstest(s) with Lösungen/Transkriptionen.

### 1.7 Notable online mock-exam platforms (third-party)

**FACTS**
- germanlanguagepractice.com sells online Goethe-format tests replicating "dieselben Prüfungsteile in derselben Reihenfolge, dieselben Aufgabentypen, dieselbe Anzahl von Aufgaben und dieselben Zeitvorgaben" (60 tasks / 165 min for B1) with **instant solutions online**. https://www.germanlanguagepractice.com/practice/goethe-b1-modelltest
- b1goethe.com offers a free online Lesen+Hören Modelltest with the solution shown **after every question**, plus the whole exam as PDF. https://b1goethe.com/modelltest/
- Independent Modellsatz PDFs explicitly instruct learners to "simulate an exam situation if you work through the tasks under real exam conditions." https://www.learninginstitute.ch/pdfs/deutsch-uebung-test-b1-1-goethe-zertifikat-pruefung.pdf

---

## 2. Mock-Exam Design Best Practices

**FACTS (what the ecosystem does)**
- **Two feedback regimes coexist everywhere:** (a) practice-style interaction with instant per-item checking (Goethe DtZ exercises; b1goethe.com per-question solutions; DUO original-format training) and (b) full timed simulation under real conditions (official Modelltests + tutorials; learninginstitute.ch instruction; germanlanguagepractice.com enforcing real time limits).
- **Organization axes observed:** by skill/exam part (Goethe practice pages, prep books), by level (DW A1/A2/B1; Lingoda sublevels), and by exam part within a level (books, DUO courses). No major provider organizes purely by grammar topic.
- **Score estimation:** the official body publishes item counts and *ranges* of cut scores per part but re-derives exact cuts per form statistically (§1.1). Third parties can therefore only estimate a TDN band from raw points — e.g., Lesen 24–26+/30 ≈ TDN 5 depending on form difficulty. No third party can promise exact TDN parity.

**RECOMMENDATIONS (for this LMS)**
1. **Dual-mode mock exams:**
   - *Practice mode:* section-wise entry (choose Lesen/Hören/Schreiben/Sprechen), immediate correctness feedback per item, soft/no timer, unlimited retries — mirrors Goethe/DUO practice behavior.
   - *Exam mode:* full-length, strict per-section timers enforced server-side (store `started_at` on the attempt row; reject submissions past `started_at + limit`), no feedback until submission, single pass — mirrors official Modelltest conditions.
2. **Section-wise AND full-length attempts:** store `mode: 'practice' | 'exam'` plus nullable `section` (null = full-length). Section-wise results feed a weak-skill view on the student dashboard; a "readiness" indicator unlocks only after ≥1 completed full-length run.
3. **Honest score estimation:** map raw→TDN using published midpoint cuts (Lesen: TDN5≥25, TDN4≥21, TDN3≥15 of 30; Hören: TDN5≥20, TDN4≥16, TDN3≥11 of 25) and always label results "estimated band — official cut-offs vary slightly per exam form" (cite testdaf.de in-app). Writing/Speaking cannot be auto-scored: reuse the existing admin approval workflow (`pending/approved` + rubric comments) for teacher review.
4. **Skill-tagged lesson organization:** tag lessons/classes with `skill ∈ {lesen, hoeren, schreiben, sprechen}` + `level ∈ {b2, c1}` + optional `exam_task` (e.g., "Lesen-3"). Matches how every serious provider organizes content and enables per-skill analytics without new infrastructure.

---

## 3. Spaced Repetition Algorithms

### 3.1 SM-2 (SuperMemo) — exact parameters

**FACTS** (primary source: P.A.Wozniak, "Optimization of learning", 1990; algorithm page: https://www.super-memory.com/english/ol/sm2.htm)

- Interval sequence (days):
  ```
  I(1) = 1
  I(2) = 6
  I(n) = round_up( I(n-1) × EF )   for n > 2
  ```
- Ease factor: initialized **EF = 2.5** per new item; updated after every repetition:
  ```
  EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
      ≡ EF − 0.8 + 0.28·q − 0.02·q²
  ```
  where q is the self-grade 0–5 (5 = perfect, 4 = correct after hesitation, 3 = correct with serious difficulty, 2 = incorrect but easy-to-recall, 1 = incorrect but remembered, 0 = blackout). **q = 4 leaves EF unchanged.** If EF < 1.3, set EF = 1.3 (hard floor; Wozniak found items below 1.3 were "repeated annoyingly often" and usually badly formulated).
- Lapse handling: if q < 3 → **reset repetitions to the beginning** (next interval = I(1)) **without changing EF**. Within a session, repeat all items scored < 4 until they score ≥ 4.
- Author-reported effectiveness (own data, English vocabulary): 10,255 items in year one at ~41 min/day; retention 89.3% overall, ~92% excluding young cards (<3-week intervals).

### 3.2 Leitner box system

**FACTS**
- Physical 5-box method (Sebastian Leitner, 1972): boxes with increasing review intervals — commonly daily, every 2 days, weekly, fortnightly, monthly; correct answer promotes a card to the next box, wrong answer demotes it back to box 1 (daily review); hardest cards automatically get the most repetitions. https://www.warpread.app/blog/leitner-box-system · https://e-student.org/leitner-system/
- Strengths: trivially understandable, zero math. Weaknesses: fixed global intervals ignore per-card difficulty; no graded self-assessment.

### 3.3 FSRS

**FACTS**
- FSRS (Free Spaced Repetition Scheduler), Anki's modern scheduler, models memory with **three variables per card — Difficulty, Stability, Retrievability (DSR model)** — and schedules each review for the moment predicted recall probability drops to a configurable target (e.g., 90%); parameters are weights trained on review data (originating from the DHP/MaiMemo variant of DSR). https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm · https://gnoseed.com/algorithms/fsrs
- Efficiency claims: vendor comparisons report FSRS reaches the same retention as SM-2 with roughly **20–30% fewer reviews** (source is an FSRS-shipping vendor — treat as directional, not independent): https://flica.app/article/fsrs-vs-sm2
- Cost: needs parameter optimization/personalization to deliver its advantage; far more complex to implement and reason about than SM-2.
- Academic anchor for SR in language learning specifically: Settles & Meeder (2016), "A Trainable Spaced Repetition Model for Language Learning" (Duolingo's half-life regression), ACL 2016 — cited in the reference list of https://flica.app/article/fsrs-vs-sm2

### 3.4 Recommendation for this project

**RECOMMENDATION: implement SM-2 (Anki-style adaptation).**
- Deterministic ~30-line pure function; state per card fits one Supabase row (`ease_factor real default 2.5`, `interval_days int`, `repetitions int`, `lapses int`, `due_at date`, `last_reviewed_at`); no ML, no parameter fitting, fully explainable to a teacher/admin — matches the repo's constraint of no ML infrastructure and its existing server-action + RLS patterns.
- UI simplification: map buttons to grades instead of exposing 0–5 (Anki-style): Again→q=2, Hard→q=3, Good→q=4, Easy→q=5. Lapse rule (q<3 resets repetitions, keeps EF) gives natural re-queueing into the due-card queue.
- Due-card queue = simple query `where due_at <= current_date order by due_at limit N`, gated by `studentUserId()` per the auth-guard pattern.
- FSRS remains a future upgrade path: card-state schema above stores everything needed to migrate later; Leitner offers nothing SM-2 doesn't already cover at equal simplicity.

---

## 4. Vocabulary Scope for TestDaF

**FACTS**
- **No official word list exists.** Zertifly states explicitly: "TestDaF does not test a fixed memorisation list. It assesses language use in general academic and university contexts", recommending productive collocations over isolated words (e.g., *eine Untersuchung durchführen*, not just *die Forschung*). https://www.zertifly.com/en/blog/testdaf-wortschatz
- **Topic domains recur across prep sources.** Zertifly's curated list = 120 academic collocations in six themes: University & study, Research & data, Environment & sustainability, Digitalisation & media, Society & economics, plus Argumentation/graph-description language (connector phrases like *einerseits … andererseits*, *daraus folgt, dass*; chart language like *der Anteil beträgt*). https://www.zertifly.com/en/blog/testdaf-wortschatz
- Another prep provider structures TestDaF vocabulary into the Themenfelder Universität/Studium, Gesellschaft/Politik, Umwelt/Nachhaltigkeit, Technik/Digitalisierung. https://learnathome.schule/kurse/testdaf-vorbereitung-sprachzertifikate/wortschatz
- These clusters substantially overlap the commonly cited domains (Umwelt/Verkehr, Studium/Wissenschaft, Arbeit/Wirtschaft, Medien, Gesellschaft); "Verkehr" appears inside environment/sustainability material (*den öffentlichen Verkehr nutzen*) rather than as a standalone domain in the sources found.
- **Sizes cited by prep sources vary widely and none is authoritative:** curated high-value lists run ~120 items (Zertifly), while comprehensive alphabetical vocab compilations for TestDaF circulate as community documents with no stated count (e.g., https://de.scribd.com/doc/83830108/Wortschatz-fuer-Den-testDaF; https://studylib.net/doc/27413996/testdaf). Community Anki decks target "academic vocabulary B2–C1" from textbooks (e.g., Uni Sicher-based deck: https://ankiweb.net/shared/info/1419856932).

**RECOMMENDATIONS**
1. Seed the trainer with **~600–1,000 cards across 6–8 domain decks**: Studium/Wissenschaft, Umwelt/Umweltpolitik (incl. Verkehr sub-cluster), Arbeit/Wirtschaft, Medien/Digitalisierung, Gesellschaft/Politik, plus a cross-cutting "Wissenschaftliche Argumentation & Grafikbeschreibung" deck — the last one is disproportionately exam-relevant because Schreiben/Sprechen scoring rewards exactly those connectors and chart phrases.
2. Prefer **collocation cards** (verb+noun, connector+clause) over single-word translation cards, per Zertifly's rationale: production tasks award range, not recognition.
3. Tag every card with `domain` + `skill_hint` so due-queue sessions can be filtered ("drill Umwelt before Thursday's Lesen practice") and so admins can see per-domain mastery in analytics.
4. Do not advertise any count as "the official TestDaF vocabulary" — no such list exists; position decks as curated prep aid.

---

## 5. Motivation / Gamification Patterns

**FACTS**
- **Duolingo scale evidence (vendor case study, but numerically specific):** DAU grew from ~5M (2020) to 40M+ (2024) while gamification was a central design priority. Key mechanics: XP as shared currency across streaks/leagues/achievements; streaks exploiting loss aversion; **streak freezes**; weekly leagues of ~30 users segmented by activity (promotion/demotion) instead of global leaderboards; tiered achievements; personalized daily goals calibrated to what a user can hit on a busy day. https://trophy.so/blog/duolingo-gamification-case-study
- Trophy platform data quoted in that study: among >7-day streak users, apps with streak-freeze average **17.19-day streaks vs 11.62 without (+48%)**; at the 14-day threshold 30.63 vs 18.87 days. Users completing ≥1 achievement on day 1 retain at **33.42% vs 20.36%** at day 14; retention rises monotonically with achievement difficulty (32.26% → 74.17%).
- Duolingo has publicly shared that users with streaks over 7 days show dramatically higher retention than those without (secondary report of company data): https://sayangupta.substack.com/p/duolingos-gamification-playbook-breaking
- **Academic evidence:** meta-analyses of gamified L2 vocabulary learning report positive effects on vocabulary gain and motivation (https://www.clausiuspress.com/article/5887.html — meta-analysis; https://eric.ed.gov/?id=EJ1472423 — meta-analysis review); an SAGE study found significantly higher learning outcomes, motivation, and satisfaction in gamified vs non-gamified English vocabulary learning (https://journals.sagepub.com/doi/10.1177/21582440231158332); a systematic review of 19 studies examines individual vs group/collaborative competition effects on adult learners' vocabulary, engagement, motivation (https://link.springer.com/article/10.1186/s40561-026-00447-z). Caveat common to this literature: mostly short-term studies, heterogeneous designs.

**RECOMMENDATIONS (specific, not "add gamification")**
1. Ship, in order: **(a) daily goal + streak counter** (goal = N cards or one mock-exam section/day; store `study_days` set on profile row, compute streak server-side), **(b) streak freeze** (1 auto-consumed freeze per week — the single highest-leverage mechanic per the data above), **(c) tiered achievements** including trivially easy day-1 awards ("first card reviewed") because day-1 achievement completion correlates with ~13pp higher D14 retention.
2. **Skip global leaderboards.** If competitive elements are wanted later, use small segmented weekly leagues (~30 users) — but for a teacher-run portfolio site with modest user counts, cohort-level class goals are more appropriate than leaderboards.
3. Tie gamification to the **due-card queue**, not raw activity: completing the daily due queue advances the streak. This aligns the retention mechanic with the learning mechanic (spaced repetition) instead of rewarding mindless XP.
4. Measure: the repo already logs `page_views`; add lightweight events (`review_session_completed`, `mock_exam_completed`) to validate whether streak features actually move retention before adding more mechanics.

---

## Source Index

| # | Source | URL |
|---|---|---|
| 1 | TestDaF-Institut — prep (paper) | https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/vorbereitung-auf-den-papierbasierten-testdaf/ |
| 2 | TestDaF-Institut — scoring/TDN | https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/auswertung-des-papierbasierten-testdaf/ |
| 3 | TestDaF-Institut — digital prep (DUO) | https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/vorbereitung-auf-den-digitalen-testdaf/ |
| 4 | Goethe-Institut — B1 practice materials | https://www.goethe.de/ins/de/de/prf/prf/gzb1/ueb.html |
| 5 | Goethe-Institut — DtZ exercises w/ instant check | https://www.goethe.de/de/spr/mig/deu.html |
| 6 | DW Nicos Weg structure (third-party detail) | https://www.lingoclub.com/nicos-weg/ · https://www.transmitter-berlin.de/en/learning-tips/learning-videos-nicos-weg-by-deutsche-welle/ |
| 7 | Lingoda curriculum (50 classes/sublevel) | https://lingoda-students.elevio.help/en/articles/379-my-course-overview-of-levels-and-curriculum · https://www.lingoda.com/en/german/ |
| 8 | italki / Preply TestDaF tutors | https://www.italki.com/en/teachers/german-testdaf · https://preply.com/en/online/tutors-testdaf · https://preply.com/en/blog/italki-and-preply-review/ |
| 9 | Fit für den TestDaF (Hueber) | https://shop.hueber.de/de/sprache-unterrichten/deutsch-als-fremdsprache-daf-daz/lehrwerk/fit-fuer-den-testdaf-paket-978-3-19-001699-0.html |
| 10 | Mit Erfolg zum TestDaF (Klett) | https://www.klett-international.com/de/mit-erfolg-zum-testdaf/t-1/9783126757850 |
| 11 | Third-party online mock platforms | https://www.germanlanguagepractice.com/practice/goethe-b1-modelltest · https://b1goethe.com/modelltest/ · https://www.learninginstitute.ch/pdfs/deutsch-uebung-test-b1-1-goethe-zertifikat-pruefung.pdf |
| 12 | SM-2 primary source (Wozniak 1990) | https://www.super-memory.com/english/ol/sm2.htm |
| 13 | Leitner system | https://www.warpread.app/blog/leitner-box-system · https://e-student.org/leitner-system/ |
| 14 | FSRS algorithm wiki | https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm · https://flica.app/article/fsrs-vs-sm2 |
| 15 | TestDaF vocabulary scope | https://www.zertifly.com/en/blog/testdaf-wortschatz · https://learnathome.schule/kurse/testdaf-vorbereitung-sprachzertifikate/wortschatz |
| 16 | Gamification case study + platform data | https://trophy.so/blog/duolingo-gamification-case-study |
| 17 | Gamification academic literature | https://www.clausiuspress.com/article/5887.html · https://eric.ed.gov/?id=EJ1472423 · https://journals.sagepub.com/doi/10.1177/21582440231158332 · https://link.springer.com/article/10.1186/s40561-026-00447-z |

*Limitations: goethe.de and learngerman.dw.com blocked direct fetching from this network — their facts rest on indexed snippets/mirrors. FSRS efficiency figures come from a vendor blog. Gamification retention numbers are vendor-platform data, not peer-reviewed.*



