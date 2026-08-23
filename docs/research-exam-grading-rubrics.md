# Official Assessment Criteria (Bewertungskriterien) — TestDaF & Goethe-Zertifikat
### Research report for building the rubric-based grading UI (`rubric_scores` JSONB schema)

> **Compiled:** 2026-08-23 · **Method:** web research against official sources (testdaf.de, goethe.de, bfu.goethe.de, official Modellsatz/Durchführungsbestimmungen PDFs) plus clearly-labelled third-party prep material.
>
> **Honesty legend used throughout:**
> - ✅ **OFFICIAL** — wording reproduced from an official TestDaF-Institut / Goethe-Institut document (URL cited).
> - ⚠️ **RECONSTRUCTED** — table layout recovered from an official PDF whose text extraction scrambles columns; mapping is arithmetically consistent but not verbatim-verified.
> - ❌ **THIRD-PARTY** — prep-site interpretation; useful for UI defaults but NOT official wording.

---

## 1. TestDaF Schriftlicher Ausdruck (Writing)

### 1.1 The rating model — what raters actually look at

**✅ OFFICIAL.** The TestDaF-Institut's public assessment page ("Auswertung des papierbasierten TestDaF") states that trained raters (*erfahrene und geschulte Beurteilende*) evaluate texts "anhand von vorgegebenen Kriterien" and organizes these under **three numbered questions**:

Source: https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/auswertung-des-papierbasierten-testdaf/

| # | Official heading (verbatim) | Sub-questions asked by raters (verbatim summary) |
|---|---|---|
| 1 | **„Wie wirkt der Text auf eine\*n Leser\*in?"** *(Gesamteindruck)* | Does the text read smoothly or must passages be read twice? Can the line of thought be followed, or are there contradictions/jumps? Is there an introduction? Transitions between sections (descriptive → argumentative)? A conclusion/fazit? |
| 2 | **„Wie wurde die Aufgabe inhaltlich bearbeitet?"** *(Erfüllung der Aufgabe)* | Are all points of the task addressed sufficiently? Is the graph described accurately — key information coherently summarized, developments shown? Argumentative part in own words (not copied)? Position taken with reasons, pros/cons weighed? Text sachlich (objective)? Home-country situation understandable and integrated into the argumentation? |
| 3 | **„Mit welchen sprachlichen Mitteln wurde der Text geschrieben?"** *(Sprachliche Mittel)* | Are sentences connected (coherence)? Varied and sensible conjunctions? Only main clauses or also subordinate clauses; varied constructions? How broad and precise is the vocabulary; are verbs varied? Language errors — frequent or occasional? Is the text still understandable despite errors? |

**⚠️ Verification note on the "classic" three-criterion naming.** The exact labels *"Gesamteindruck der sprachlichen Leistung"*, *"Erfüllung der Aufgabe"* and *"sprachliche Korrektheit und Zeichensetzung"* circulate in DaF teacher literature as the internal rater-guideline names for exactly these three dimensions. **This verbatim triple could NOT be verified in any publicly accessible official TestDaF document** (the detailed rater scale is internal training material). Treat those labels as *commonly reported* names of criteria 1–3 above, not quotable official text. Prep site germanexam.pro describes the same triad as "Gesamteindruck / Aufgabenbearbeitung / Sprachliche Realisierung" (❌ third-party): https://www.germanexam.pro/de/campus/testdaf-schreiben-bewertungskriterien

### 1.2 How the TDN grade is produced

- ✅ OFFICIAL: Writing is **not scored in points per criterion**. Raters assign the text directly to a TestDaF-Niveau (**Unter TDN 3 / TDN 3 / TDN 4 / TDN 5**) based on the three dimensions together. Source: https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/auswertung-des-papierbasierten-testdaf/
- ❌ THIRD-PARTY (consistent across prep sites, plausible but unconfirmed officially): each text is read by **two independent raters**; missing a mandatory task part (no graph description / no Stellungnahme / no Heimatlandbezug) caps the result at max TDN 3; missing the topic entirely → Unter TDN 3. Source: https://www.germanexam.pro/de/exams/testdaf/schriftlicher-ausdruck-beispiel
- ⚠️ The precise combination algorithm (how judgments on the three dimensions collapse into one TDN) is **internal rater-training material and not published**. Do not hard-code a formula into the LMS claiming it is official.

### 1.3 Band descriptors: what distinguishes TDN 3 vs 4 vs 5 (writing)

**✅ OFFICIAL can-do descriptors** (TestDaF-Niveaustufen page + Kann-Beschreibung PDF):
Source: https://www.testdaf.de/de/teilnehmende/warum-testdaf/testdaf-niveaus-tdn/ · PDF: https://www.testdaf.de/fileadmin/testdaf/downloads/TestDaF-Niveaus_verschiedene_Sprachen/TestDaF-Levels_deutsch.pdf

| TDN | Schreiben (official descriptor) |
|---|---|
| **TDN 5** | „Sie können sich in studienbezogenen Alltagssituationen … sowie im fächerübergreifenden wissenschaftlichen Kontext … zusammenhängend und strukturiert sowie **sprachlich angemessen und differenziert** äußern." |
| **TDN 4** | „… **weitgehend zusammenhängend und strukturiert sowie weitgehend angemessen** äußern. **Sprachliche Mängel beeinträchtigen das Textverständnis nicht.**" |
| **TDN 3** | „Sie können sich in studienbezogenen Alltagssituationen … **weitgehend verständlich und zusammenhängend schriftlich äußern**. Im fächerübergreifenden wissenschaftlichen Kontext … können Sie sich **vereinfacht** äußern, **sprachliche und strukturelle Mängel können das Textverständnis beeinträchtigen**." |

**❌ THIRD-PARTY operationalization** of the 4-vs-5 gap (germanexam.pro, consistent with official wording): TDN 5 = differentiated, precise expression, varied vocabulary, complex structures handled securely, errors are the exception; TDN 4 = complete task fulfillment, clear structure, individual grammar/vocabulary errors allowed as long as comprehension is never impaired; TDN 3 = simplified, one-sided argumentation, superficial graph reading, repetitive syntax, noticeable grammatical deficits that can impede understanding. CEFR anchors commonly given: TDN 5 ≈ C1.1–C1.2, TDN 4 ≈ B2.2–C1.1, TDN 3 ≈ B2.1–B2.2 (⚠️ approximate, not an official equivalence claim).

### 1.4 Digital TestDaF variant (if tutor grades digital-format essays)

**✅ OFFICIAL** (https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/auswertung-des-digitalen-testdaf/): two writing tasks; raters weigh these aspects, then convert to a 0–20 point scale (TDN bands: 0–4 unter TDN 3, 5–9 TDN 3, 10–15 TDN 4, 16–20 TDN 5):

1. Bezieht sich Ihr Text auf das Thema der Aufgabe?
2. Werden alle Punkte der Aufgabenstellung ausreichend berücksichtigt?
3. Werden die geforderten Schreibhandlungen erfolgreich umgesetzt?
4. Sind Informationen aus den Quellen korrekt und mit eigenen Worten zusammengefasst?
5. Angemessener und präziser Ausdruck? Variation grammatikalischer Strukturen? Abwechslungsreicher Wortschatz? Angemessene Redemittel?
6. Ist Ihre Äußerung trotz einiger Fehler noch verständlich?

---

## 2. TestDaF Mündlicher Ausdruck (Speaking)

### 2.1 Task structure — the 7 Aufgaben

**✅ OFFICIAL** (Modelltest 01, Teilnehmerheft): https://www.testdaf.de/fileadmin/testdaf/downloads/Modelltests_papierbasierter_TestDaF/Modelltest_1/Sprechen/Modelltest_01_MA_Heft.pdf
Seven university-life situations, each with Vorbereitungszeit + Sprechzeit; answers recorded, no live examiner.

| Aufgabe | Communicative function (from official Modelltest) | Prep time | Speaking time |
|---|---|---|---|
| 1 | Sich informieren (Telefonat: nach Einzelheiten fragen) | 30 s | 30 s |
| 2 | Berichten/erklären (Situation im Heimatland einem Freund erklären) | 1 min | 1 min |
| 3 | Grafik beschreiben (Aufbau nennen, Informationen zusammenfassen) | 1 min | 1 min 30 s |
| 4 | Diskutieren: Vor-/Nachteile abwägen, Zustimmung/Ablehnung begründen | 3 min | 2 min |
| 5 | Rat geben: Vor-/Nachteile abwägen, Rat begründen | 2 min | 1 min 30 s |
| 6 | Grafikbasiert vortragen: Gründe nennen, Auswirkungen darstellen | 3 min | 2 min |
| 7 | Sich entscheiden + Meinung begründen | 1 min 30 s | 1 min 30 s |

### 2.2 Rating model — global vs per-Aufgabe

- ✅ OFFICIAL: **Each of the 7 Aufgaben is assigned to one of the three levels TDN 3, TDN 4 or TDN 5** by difficulty ("Jede Aufgabe ist einem der drei TestDaF-Niveaus TDN 3, TDN 4 oder TDN 5 zugeordnet."). Source: https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/auswertung-des-papierbasierten-testdaf/
- ✅ OFFICIAL: raters judge each Äußerung along the same three questions as writing:
  1. **Wie wirkt die Äußerung als Ganzes auf eine\*n Hörer\*in?** (flüssig/klar/verständlich? Aussprache & Intonation? Aufbau & Struktur erkennbar?)
  2. **Erfüllt die Antwort die Aufgabenstellung?** (Themenbezug; alle Punkte berücksichtigt; passt zur Aufgabe/Situation?)
  3. **Mit welchen sprachlichen Mitteln wird die Aufgabe gelöst?** (Register/Aufbau/Anfang/Ende situationsgerecht? differenzierte Wortschatz+Syntax? erschweren Fehler das Verstehen?)
  Source: same URL.
- ⚠️ **Not publicly documented:** how the seven per-task ratings aggregate into the single certificate TDN for Mündlicher Ausdruck. Official statement covers only per-task difficulty assignment; aggregation is internal. For the LMS: store per-task ratings separately; compute overall band as configurable policy, not "official".
- ✅ OFFICIAL note from participant booklet: opinion stance is irrelevant — "Bewertet wird nicht, welche Meinung Sie dazu haben, sondern wie Sie Ihre Gedanken formulieren." Not finishing a sentence within time is not penalized per se.

### 2.3 Band descriptors (speaking)

**✅ OFFICIAL can-do descriptors** (same source as §1.3):

| TDN | Sprechen (official descriptor) |
|---|---|
| **TDN 5** | „… situationsangemessen sowie **klar und differenziert** mündlich äußern." |
| **TDN 4** | „… **weitgehend situationsangemessen** mündlich äußern. **Sprachliche Mängel beeinträchtigen die Kommunikation nicht.**" |
| **TDN 3** | „Sie können sich in studienbezogenen Alltagssituationen mündlich äußern, auch wenn das Verstehen durch sprachliche Mängel zum Teil verzögert wird. Im fächerübergreifenden wissenschaftlichen Kontext können Sie die kommunikative Absicht **in Ansätzen realisieren**." |

### 2.4 Automatic-fail conditions

❌ **No official "automatic fail" list is published.** Prep sites (deutale.com, germanexam.pro) describe de-facto killers: not addressing the task at all, long silences/no recording, ignoring required speech acts (e.g., no Abwägung in Aufgabe 4). Mark such rules in the UI as heuristic guidance, not official policy.

---

## 3. Goethe-Zertifikat Schreiben — Bewertung

Goethe uses a **criterion grid with letter levels A–E** (A best … E weakest), where **E = 0 points**, plus the rule: *"Wird das Kriterium Aufgabenerfüllung/Erfüllung für eine Aufgabe mit E (0 Punkten) bewertet, ist die Punktzahl für diese Aufgabe insgesamt 0 Punkte."* Only pre-printed point values may be awarded — **Zwischenwerte sind nicht zulässig** (no intermediate values). Every module: **max 100 points, pass ≥ 60 points (60 %)**; graded by **two independent raters**, result = arithmetic mean rounded; third rating if raters straddle the pass boundary and mean < 60. Prädikate: 100–90 sehr gut, 89–80 gut, 79–70 befriedigend, 69–60 ausreichend, 59–0 nicht bestanden.

Sources (all ✅ OFFICIAL):
- B1 DFB: https://goethe.al/images/PDF/DFB_2023_Goethe-Zertifikat_B1_DE_EN.pdf (mirror of goethe.de Durchführungsbestimmungen)
- B2 DFB: https://goethe.al/images/PDF/DFB_2023_Goethe-Zertifikat_B2_DE_EN.pdf
- B2 criteria grid (interactive official Modellsatz): https://bfu.goethe.de/b2_mod_2MX6/schreiben.php
- B2 criteria PDF (Prüferblätter): https://germanica.ro/wp-content/uploads/GZ_B2_Modellsatz_Bewertungskriterien_Schreiben_Sprechen.pdf
- C1 Modellsatz (Kriterien + Bewertungsbogen): https://www.goethe.de/pro/relaunch/prf/materialien/C1_modular/c1-modular_modellsatz.pdf
- B1 Modellsatz (point maxima per criterion): https://bfu.goethe.de/b1_mod/schreiben.php

### 3.1 B1 Schreiben — structure & points (✅ OFFICIAL)

Three tasks (E-Mail ~80 W / Diskussionsbeitrag ~80 W / kurze E-Mail ~40 W), 60 min. Criteria identical across tasks: **Erfüllung, Kohärenz, Wortschatz, Strukturen**.

| Task | Erfüllung | Kohärenz | Wortschatz | Strukturen | Task total |
|---|---|---|---|---|---|
| Aufgabe 1 | 10 | 10 | 10 | 10 | 40 |
| Aufgabe 2 | 10 | 10 | 10 | 10 | 40 |
| Aufgabe 3 | 4 | 4 | 6 | 6 | 20 |
| **Module total** | | | | | **100** |

### 3.2 B2 Schreiben — full criteria grid (✅ OFFICIAL, reproduced)

Two tasks (Forumsbeitrag ≥150 W / formelle Nachricht ≥100 W), 75 min. Grid applies per task:

| Kriterium | Facette | A | B | C | D | E |
|---|---|---|---|---|---|---|
| **Aufgaben-Erfüllung** | Inhalt, Umfang, Realisierung der Sprachfunktionen (z. B. Meinung äußern, sich entschuldigen, Bedauern ausdrücken, um etwas bitten) | Alle 4 Sprachfunktionen inhaltlich und umfänglich angemessen behandelt | 3 Sprachfunktionen angemessen oder 2 angemessen und 2 teilweise | 2 Sprachfunktionen angemessen und 1 teilweise oder alle teilweise | 1 Sprachfunktion angemessen oder teilweise | Textumfang weniger als 50 % der geforderten Wortanzahl oder Thema verfehlt |
| | Register, soziokulturelle Angemessenheit | situations- und partneradäquat | noch weitgehend situations- und partneradäquat | ansatzweise situations- und partneradäquat | nicht mehr situations- und partneradäquat | |
| **Kohärenz** | Textaufbau (Einleitung, Schluss …), Logik | durchgängig und effektiv | überwiegend erkennbar | stellenweise erkennbar | kaum erkennbar | Text durchgängig unangemessen |
| | Verknüpfung von Sätzen, Satzteilen | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | |
| **Wortschatz** | Spektrum | differenziert | überwiegend angemessen | teilweise angemessen oder begrenzt | kaum vorhanden | |
| | Beherrschung | vereinzelte Fehlgriffe beeinträchtigen das Verständnis nicht | mehrere Fehlgriffe beeinträchtigen das Verständnis nicht | mehrere Fehlgriffe beeinträchtigen das Verständnis teilweise | mehrere Fehlgriffe beeinträchtigen das Verständnis erheblich | |
| **Strukturen** | Spektrum | differenziert | überwiegend angemessen | teilweise angemessen oder begrenzt | kaum vorhanden | |
| | Beherrschung (Morphologie, Syntax, Orthografie) | vereinzelte Fehlgriffe beeinträchtigen das Verständnis nicht | mehrere Fehlgriffe beeinträchtigen das Verständnis nicht | mehrere Fehlgriffe beeinträchtigen das Verständnis teilweise | mehrere Fehlgriffe beeinträchtigen das Verständnis erheblich | |

⚠️ **RECONSTRUCTED B2 point mapping:** the B2 Bewertungsbogen itself was not machine-readable in this research; module total is 100 points. By analogy with the confirmed C1 form (§3.3) letters map to fixed point steps per criterion (A=full, B=75 %, C=50 %, D=25 %, E=0). Verify against a printed B2 "Schreiben – Bewertung" form before shipping exact per-criterion points into the UI.

### 3.3 C1 Schreiben (modular) — full criteria grid + points (✅ OFFICIAL)

Two tasks (Teil 1: Diskussionsbeitrag ~230 W; Teil 2: (halb-)formelle E-Mail ~120 W), 75 min. Grid (Modellsatz p. 42):

| Kriterium | Facette | A | B | C | D | E* |
|---|---|---|---|---|---|---|
| **Aufgaben-Erfüllung** | Inhalt, Umfang, Realisierung der Sprachfunktionen (z. B. etwas erklären, Argumente anführen, Vorschlag machen) | alle 4 Sprachfunktionen inhaltlich und vom Umfang her angemessen | 3 Sprachfunktionen angemessen oder 2 angemessen und 2 teilweise | 2 Sprachfunktionen angemessen und 1 teilweise angemessen oder alle teilweise | 1 Sprachfunktion angemessen oder teilweise | Textumfang weniger als 50 % der geforderten Wortanzahl oder Thema verfehlt |
| | Register, soziokulturelle Angemessenheit | situations- und partneradäquat | weitgehend situations- und partneradäquat | stellenweise situations- und partneradäquat | kaum noch situations- und partneradäquat | |
| **Kohärenz** | Textaufbau (Einleitung, Schluss), Logik | durchgängig effektiv angemessen flexibel | überwiegend erkennbar | stellenweise erkennbar | kaum erkennbar | Text durchgängig unangemessen |
| | Verknüpfung von Sätzen und Satzteilen | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | |
| **Wortschatz** | Spektrum | breit, differenziert | angemessen, stellenweise differenziert | teilweise angemessen oder begrenzt | kaum Variation vorhanden | |
| | Beherrschung | vereinzelte Fehlgriffe beeinträchtigen den Lesefluss nicht | mehrere Fehlgriffe beeinträchtigen den Lesefluss noch nicht | Fehlgriffe beeinträchtigen den Lesefluss stellenweise | Fehlgriffe beeinträchtigen den Lesefluss erheblich | |
| **Strukturen** | Spektrum | breit, differenziert | überwiegend angemessen | teilweise angemessen oder begrenzt | kaum Variation vorhanden | |
| | Beherrschung (Morphologie, Syntax, Orthografie) | vereinzelte Fehlgriffe beeinträchtigen den Lesefluss nicht | mehrere Fehlgriffe beeinträchtigen den Lesefluss noch nicht | Fehlgriffe beeinträchtigen den Lesefluss teilweise | Fehlgriffe beeinträchtigen den Lesefluss erheblich | |

*\*Wird das Kriterium Aufgabenerfüllung mit E (0 Punkten) bewertet, ist die Punktzahl für diese Aufgabe insgesamt 0 Punkte.*

**Point scales on the official Bewertungsbogen** (same PDF, "Schreiben – Bewertung", form 40004): per task, four criterion rows with these selectable values:
- `16 / 12 / 8 / 4 / 0` (×2 rows)
- `14 / 10,5 / 7 / 3,5 / 0` (×2 rows)
- `10 / 7,5 / 5 / 2,5 / 0` (×4 rows)

⚠️ **RECONSTRUCTED weighting:** 16+14+10+10 = 50 per task × 2 tasks = 100 ✓. Most plausible assignment (matches typical Goethe weighting where Erfüllung weighs most): **Erfüllung 16, Kohärenz 14, Wortschatz 10, Strukturen 10 per task** — but PDF text extraction scrambles column order, so confirm visually before locking the schema. Reliable pattern: B/C/D = 75 %/50 %/25 % of criterion maximum, E = 0.

---

## 4. Goethe-Zertifikat Sprechen — Bewertung

### 4.1 Exam format & pair-interaction rules (✅ OFFICIAL, DFB B2 §3)

- Pair exam (~15 min; individual ~10 min); random pairing; **two examiners**: one moderates the conversation, **both take notes and rate independently**; result = arithmetic mean rounded (≤0.49 down, ≥0.5 up). Introductory small talk is **not rated**.
- B2 Teil 1 = Vortrag (~4 min/person) + questions from partner & examiner; Teil 2 = gemeinsame Diskussion (~5 min both).
- C1 Teil 1 = Vortrag (~5 min) inkl. Nachfragen; Teil 2 = Diskussion (~5 min).
- B1: Aufgabe 1 gemeinsam planen (~3 min), Aufgabe 2 Präsentation mit 5 Folien (~3 min), Aufgabe 3 Rückmeldung/Fragen zu beiden Präsentationen (~2 min).

Sources: DFB B2 (URL above), https://bfu.goethe.de/b2_mod_2MX6/sprechen.php, https://bfu.goethe.de/b1_mod/sprechen.php, C1 Modellsatz (URL above).

### 4.2 B1 Sprechen — criteria & points (✅ OFFICIAL)

| Task | Criteria (max points) |
|---|---|
| Aufgabe 1 (gemeinsam planen) | Erfüllung 8 · Interaktion 4 · Wortschatz/Register 8 · Strukturen 8 |
| Aufgabe 2 (Präsentation) | Erfüllung 12 · Interaktion 4 · Wortschatz/Register 12 · Strukturen 12 |
| Aufgabe 3 (Rückmeldung/Fragen) | Erfüllung 16 |
| Aufgaben 1–3 gesamt | Aussprache 16 |
| **Module total** | **100** |

B1 Sprechen grid facets (✅ OFFICIAL, Prüferblätter PDF mirrored at https://www.saptastudy.com/wp-content/uploads/2019/12/b1_Sprechen.pdf): Erfüllung (Sprachfunktionen Inhalt+Umfang), Interaktion (Gespräch beginnen/in Gang halten/beenden, Reaktionsfähigkeit, Register), Wortschatz (Spektrum/Beherrschung), Strukturen (Spektrum/Beherrschung Morphologie+Syntax), Aussprache (Satzmelodie, Wortakzent, einzelne Laute). Folien coverage is quantified inside Erfüllung (A = alle 5 Folien angemessen … D = 1 Folie … E = Präsentation nicht bewertbar).

### 4.3 B2 Sprechen — full criteria grid (✅ OFFICIAL, reproduced)

| Kriterium | Facette | A | B | C | D | E |
|---|---|---|---|---|---|---|
| **Aufgaben-Erfüllung** (Teil 1 + Teil 2) | Sprachfunktionen: Alternativen beschreiben, Vor- und Nachteile nennen, Standpunkt/Argumente austauschen, auf Argumente reagieren, Standpunkt zusammenfassen, Fragen stellen und beantworten | angemessen | überwiegend angemessen | in Teilen angemessen | nicht mehr angemessen | nicht mehr verständlich |
| **Vortrag: Kohärenz** | Verknüpfung von Sätzen und Satzteilen | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | |
| | Flüssigkeit | natürliche Sprechweise | verlangsamte Sprechweise | stockende Sprechweise beeinträchtigt das Verständnis stellenweise | stockende Sprechweise beeinträchtigt das Verständnis durchgehend | |
| **Diskussion: Interaktion** | das Gespräch beginnen, in Gang halten, beenden; Reaktionsfähigkeit | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | |
| | Register (Du- und Sie-Form) | situations- und partneradäquat | weitgehend situations- und partneradäquat | ansatzweise situations- und partneradäquat | nicht mehr situations- und partneradäquat | |
| **Wortschatz** | Spektrum; Beherrschung (Redensarten, Hoch- und Umgangssprache) | differenziert, vereinzelte Fehlgriffe beeinträchtigen das Verständnis in keiner Weise | überwiegend angemessen, mehrere Fehlgriffe beeinträchtigen das Verständnis noch nicht | Repertoire begrenzt, mehrere Fehlgriffe beeinträchtigen das Verständnis stellenweise | kaum Repertoire vorhanden, mehrere Fehlgriffe beeinträchtigen das Verständnis durchgehend | |
| **Strukturen** | Spektrum; Beherrschung (Morphologie, Syntax) | differenziert, vereinzelte Fehlgriffe stören nicht | überwiegend angemessen, mehrere Fehlgriffe stören noch nicht | Repertoire begrenzt, mehrere Fehlgriffe stören stellenweise | kaum Repertoire vorhanden, mehrere Fehlgriffe beeinträchtigen das Verständnis erheblich | |
| **Aussprache** | Satzmelodie, Wortakzent, einzelne Laute | keine auffälligen Abweichungen | wahrnehmbare Abweichungen beeinträchtigen das Verständnis nicht | Abweichungen beeinträchtigen das Verständnis stellenweise | Abweichungen beeinträchtigen das Verständnis und stören durchgehend | |

### 4.4 C1 Sprechen (modular) — full criteria grid + points (✅ OFFICIAL)

Grid (Modellsatz p. 45):

| Kriterium | Facette | A | B | C | D | E* |
|---|---|---|---|---|---|---|
| **Aufgaben-Erfüllung** (Teil 1 + 2) | Inhalt, Umfang, Realisierung der Sprachfunktionen (z. B. argumentieren, einigen) | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | nicht mehr verständlich |
| **Vortrag: Kohärenz** | Aufbau | durchgängig effektiv | überwiegend erkennbar | stellenweise erkennbar | kaum erkennbar | nicht angemessen |
| | Verknüpfung von Sätzen und Satzteilen | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | |
| | Flüssigkeit | natürliche Sprechweise, flüssig | weitgehend flüssig | stockende Sprechweise beeinträchtigt die Kommunikation stellenweise | stockende Sprechweise beeinträchtigt die Kommunikation erheblich | |
| **Vortrag: Fragen/Antworten** | inhaltlich und sprachlich angemessen | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | |
| **Diskussion: Interaktion** | Gespräch beginnen, in Gang halten, beenden; Reaktionsfähigkeit | angemessen | überwiegend angemessen | teilweise angemessen | kaum angemessen | |
| | Register, soziokulturelle Angemessenheit | situations- und partneradäquat | weitgehend situations- und partneradäquat | stellenweise situations- und partneradäquat | kaum noch situations- und partneradäquat | |
| **Wortschatz** | Spektrum | breit, differenziert | angemessen, stellenweise differenziert | teilweise angemessen oder begrenzt | kaum Variation vorhanden | |
| | Beherrschung | vereinzelte Fehlgriffe beeinträchtigen die Kommunikation nicht | mehrere Fehlgriffe beeinträchtigen die Kommunikation noch nicht | Fehlgriffe beeinträchtigen die Kommunikation stellenweise | Fehlgriffe beeinträchtigen die Kommunikation erheblich | |
| **Strukturen** | Spektrum; Beherrschung (Morphologie, Syntax) | breit, differenziert / vereinzelte Fehlgriffe stören nicht | überwiegend angemessen / stören noch nicht | teilweise angemessen oder begrenzt / stören stellenweise | kaum Variation vorhanden / erheblich | |
| **Aussprache** (Teil 1+2) | Satzmelodie, Wortakzent, einzelne Laute | kaum wahrnehmbare Abweichungen | wahrnehmbare Abweichungen beeinträchtigen die Kommunikation nicht | Abweichungen beeinträchtigen die Kommunikation stellenweise | Abweichungen beeinträchtigen die Kommunikation erheblich | |

**Point scales on the official "Sprechen – Bewertung" form** (form 40009, covers both pair participants): selectable value sets observed: `16/12/8/4/0`, `12/9/6/3/0`, `10/7,5/5/2,5/0`, `8/6/4/2/0`, `4/3/2/1/0`, across criteria rows labelled: Teil 1 (Erfüllung, Kohärenz, Wortschatz, Strukturen, Fragen/Antworten), Teil 2 (Erfüllung, Interaktion, Wortschatz, Strukturen), Teil 1+2 (Aussprache).

⚠️ **RECONSTRUCTED:** the ten rows must sum to 100; the extracted value sets close to that total exist in several assignments because extraction interleaves the two-participant columns. **Exact per-criterion maxima for C1 Sprechen could not be pinned down unambiguously — verify against the printed form before hard-coding.** Reliable facts: 10 rated rows, E=0, module total 100, dual independent ratings averaged.

---

## 5. Persian-L1 (Farsi) learners of German — published interference/error evidence

No exam board publishes a Persian-specific error taxonomy; however, peer-reviewed contrastive/error-analysis work exists (mostly from Iranian universities). Partial evidence base:

| Error domain | Finding / example | Source |
|---|---|---|
| **Verbs with fixed prepositions** (Preposition government) | Negative transfer from Persian causes systematic errors with German verbs + fixed prepositions even among advanced learners (post-"Advanced German" course) tested at Islamic Azad University Tehran (2018 & 2023 field studies). | Moterassed & Hajighasem (2025), *Journal of Foreign Language Research* 14(4), 681–695, DOI 10.22059/jflr.2025.376479.1133 — https://jflr.ut.ac.ir/article_100896.html?lang=en |
| **Case errors (Kasusfehler)** | Study of Iranian DaF students; title example of a produced case error: *"Er hat sich in dem Mädchen verliebt"* (correct: *in das Mädchen*). | Raeisi Dastenaei, Forghani Tehrani & Siegmund (2021), *gfl-journal* No. 3/2021 — listed in JFLR bibliography above; journal: http://www.gfl-journal.de |
| **Konjunktiv errors** | Errors affect both formation AND use of Konjunktiv II among 35 Persian-speaking students (University of Isfahan); Persian lacks a comparable subjunctive paradigm. | Raeisi Dastenaei et al. (2018), *"Wenn er gestern auf der Party wäre": Konjunktivfehler iranischer DaF-Studierender*, Zeitschrift für interkulturellen Fremdsprachenunterricht 24(1), 181–192 — https://zif.tujournals.ulb.tu-darmstadt.de/article/id/3183/download/pdf/ |
| **Passive errors** | Errors of 38 Persian-speaking DaF students analyzed across passive constructions; certain passive types systematically harder. | Raeisi Dastenaei et al., *"Ein Brief wird erhalten!": Passivfehler iranischer DaF-Studierender* — https://tubiblio.ulb.tu-darmstadt.de/140193/ |
| **Prepositions generally** | Field test confirms elementary Iranian learners' problems with German prepositions; Persian-German preposition comparison. | "The Problems of Iranian Language Learners in Correctly Using German Prepositions" — https://www.academia.edu/166233590/ ; also Saidi Tavakoli (2016), dissertation University of Tehran (in JFLR bibliography) |
| **Phonology/stress** | Word stress in German prefixed words is a persistent difficulty for Persian learners (contrastive stress study). | Forghani Tehrani (2023), JFLR 13(4), 669–686 (in JFLR bibliography) |
| **Structural contrasts driving the above** | Persian has no case morphology on nouns, no grammatical gender, no verb-final subordinate order, and the *ezafe* construction instead of adjectival declension — recurring topics of Persian-German contrastive grammars (Raeisi 2011 dissertation; Alborzi Verki 2001; Zoroufi 1989/1991, all in JFLR bibliography). | see JFLR article bibliography |

**UI implication:** a "typical Persian-L1 pitfalls" checklist (preposition government, case after two-way prepositions/verbs, Konjunktiv II formation, passive voice, word stress) can be offered as optional annotation tags — grounded in the studies above, but explicitly *not* part of any official rubric.

---

## 6. Practical grading workflow — how raters/teachers annotate (Korrekturzeichen/Korrektursymbole)

### 6.1 Standard German-subject correction symbols (school-official list, widely reused in DaF)

✅ Source: "Offizielle Korrekturzeichen für das Fach Deutsch" — https://www.lehrerfreund.de/medien/deutschunterricht/OffizielleKorrekturzeichen.pdf (context: https://www.lehrerfreund.de/schule/1s/korrekturzeichen-deutsch/2287)

| Symbol | Meaning | Symbol | Meaning |
|---|---|---|---|
| A | Ausdruck | Aufb | Aufbau |
| G/Gr | Grammatik | Bg/Bgr | fehlende/falsche Begründung |
| R | Rechtschreibung | Bl | fehlender Beleg |
| Sb | Satzbau | Bz | Bezug |
| W | Wort | F | Form |
| Z | Zeichensetzung | Fs/Fsp | Fachsprache |
| | | I | Inhalt |
| | | Log | Logik |
| | | Lü | Lücke |
| | | St | Stil |
| | | T | Text/Thema; Aufgabenstellung nicht beachtet |
| | | ul | unleserlich |
| | | Whs | Wiederholung Sprache |
| | | Whi | Wiederholung Inhalt |
| | | Zitat | Verstoß gegen Zitatregeln |
| | | Zs/Zshg | Zusammenhang |
| | | Def / ug / uv | falsche Definition / ungenau / unvollständig |

### 6.2 DaF-specific correction symbol set (university German program, teaching practice)

✅ Source: Emory University German Studies, "Korrektursymbole" — https://german.emory.edu/documents/korrektursymbole.pdf

| Symbol | Meaning | Symbol | Meaning |
|---|---|---|---|
| A/P | Aktiv/Passiv | Pl | Pluralform |
| Art | Artikel (falsch/fehlt) | Präp | Präposition (falsch, unnötig, fehlend) |
| E | Adjektivendung | Prn | Pronomen |
| Eng | Englischer Sprachgebrauch | R | Rechtschreibung (inkl. Groß-/Kleinschreibung, Umlaute) |
| G | Genus | Refl | Reflexiv/Nicht-Reflexiv |
| HV | Hilfsverb | RP | Relativpronomen |
| I | Interpunktion | SV | Subjekt-Verb-Kongruenz |
| K | Kasus (Nom/Akk/Dat/Gen) | T | Tempus |
| Komp | Komparativ | U | Umschreiben |
| Konj | Konjunktion | V | Verb (schwach/stark; Konjugation; Partizip) |
| M | Modus (Indikativ/Konjunktiv/Imperativ) | VP | Verbposition |
| NS | Neue Struktur | VT | Verbtrennung (separables Präfix) |
| | | WS | Wortstellung |
| | | W | Wortwahl |
| | | ? | unverständlich |
| | | ^ | Wort/Wörter fehlen |

### 6.3 DaZ/DaF classroom variant (compact, maps well onto clickable tags)

✅ Source: tutory.de worksheet "Korrekturzeichen_DaZ" — https://www.tutory.de/entdecken/dokument/korrekturzeichendaz

G = falsches Genus · K (+Nom/Akk/Gen/Dat) = falscher Kasus · Kon I/II = Konjunktiv erforderlich · Präp = falsche Präposition · T = falsches Tempus · Sb/WS = Satz- oder Wortstellungsfehler (numbers mark correct word order).

**Note on "D = Deklination":** the shorthand *D=Deklination* appears in some DaF course handouts (e.g., scribd copies of A1-course correction keys listing Deklination/Genus/Kasus/Orthographie/Satzstruktur categories) but is **not** part of the two standardized lists above. If you want that tag in the UI, ship it as a custom category alongside the standard ones rather than presenting it as standardized.

### 6.4 What this means for the grading workflow design

1. **Two-layer annotation mirrors real rater behavior:** (a) inline error tags using the symbol taxonomy above (§6.1–6.3), (b) holistic per-criterion rubric selection (TestDaF three-question model / Goethe A–E grid) with a free-text Kommentar field — Goethe's own Bewertungsbogen has explicit "Kommentar:" boxes, and DFB B2 §4.3 requires raters to note the errors that determined the score ("Die für die Vergabe der Punkte relevanten Fehlgriffe etc. werden auf dem Bogen Schreiben – Bewertung notiert").
2. **No half-points between defined steps:** Goethe explicitly forbids Zwischenwerte; the UI should offer only discrete step values (e.g., 16/12/8/4/0), never free numeric input.
3. **Dual-rating emulation:** since both exams average two independent ratings, the LMS schema should support `ratings: [rater1, rater2]` per submission with computed mean + flag when they straddle the pass boundary (Goethe third-rater rule).
4. **Zero-point cascade:** implement the Goethe rule "Erfüllung = E ⇒ whole task scores 0" as validation logic.
5. **Store German original wording** of every descriptor (legally meaningful exam terms) and localize around them — the project's trilingual LocalizedString pattern fits naturally.

---

## Source index

| # | Source | Status |
|---|---|---|
| 1 | https://www.testdaf.de/de/teilnehmende/der-papierbasierte-testdaf/auswertung-des-papierbasierten-testdaf/ | ✅ Official — paper TestDaF rating questions (Schriftlich & Mündlich), per-task TDN assignment |
| 2 | https://www.testdaf.de/de/teilnehmende/warum-testdaf/testdaf-niveaus-tdn/ (+ Kann-Beschreibung PDF) | ✅ Official — TDN 3/4/5 can-do descriptors incl. Farsi version link |
| 3 | https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/auswertung-des-digitalen-testdaf/ | ✅ Official — digital TestDaF aspects + 0–20/TDN conversion |
| 4 | https://www.testdaf.de/fileadmin/testdaf/downloads/Modelltests_papierbasierter_TestDaF/Modelltest_1/Sprechen/Modelltest_01_MA_Heft.pdf | ✅ Official — 7 speaking tasks, times, rating-neutral-opinion note |
| 5 | https://bfu.goethe.de/b1_mod/schreiben.php · /sprechen.php | ✅ Official — B1 criteria + per-criterion point maxima |
| 6 | https://bfu.goethe.de/b2_mod_2MX6/schreiben.php · /sprechen.php | ✅ Official — B2 A–E grids |
| 7 | https://germanica.ro/wp-content/uploads/GZ_B2_Modellsatz_Bewertungskriterien_Schreiben_Sprechen.pdf | ✅ Official doc (mirror) — B2 grids |
| 8 | https://www.goethe.de/pro/relaunch/prf/materialien/C1_modular/c1-modular_modellsatz.pdf | ✅ Official — C1 grids + Bewertungsbogen point scales |
| 9 | https://goethe.al/images/PDF/DFB_2023_Goethe-Zertifikat_B1_DE_EN.pdf · _B2_DE_EN.pdf | ✅ Official (mirrors) — scoring procedure, dual rating, third-rater rule, pass/prädikat tables |
| 10 | https://www.germanexam.pro/de/campus/testdaf-schreiben-bewertungskriterien · /de/exams/testdaf/schriftlicher-ausdruck-beispiel | ❌ Third-party — three-criteria naming, TDN operationalization, fail heuristics |
| 11 | https://jflr.ut.ac.ir/article_100896.html?lang=en | ✅ Peer-reviewed — Persian-L1 negative transfer (verbs+prepositions) |
| 12 | https://zif.tujournals.ulb.tu-darmstadt.de/article/id/3183/download/pdf/ · https://tubiblio.ulb.tu-darmstadt.de/140193/ · gfl-journal 3/2021 | ✅ Peer-reviewed — Konjunktiv-/Passiv-/Kasusfehler iranischer DaF-Studierender |
| 13 | https://www.lehrerfreund.de/medien/deutschunterricht/OffizielleKorrekturzeichen.pdf | ✅ Standard school list — Korrekturzeichen Deutsch |
| 14 | https://german.emory.edu/documents/korrektursymbole.pdf | ✅ University DaF program — Korrektursymbole |
| 15 | https://www.tutory.de/entdecken/dokument/korrekturzeichendaz | ✅ Teaching resource — compact DaZ symbols |

## Known gaps (do NOT invent in the UI)

- Exact verbatim wording of the internal TestDaF rater scale ("Gesamteindruck der sprachlichen Leistung…" triple) — unpublished; use the official three-question headings instead.
- TestDaF aggregation rules (three writing dimensions → TDN; seven speaking tasks → certificate TDN) — unpublished.
- B2 Schreiben/Sprechen per-criterion point values and C1 Sprechen per-criterion maxima — forms exist but were not cleanly machine-readable here; flagged ⚠️ above.
- No official "automatic fail" catalogue exists for either provider.
