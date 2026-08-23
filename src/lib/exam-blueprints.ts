/**
 * Exam blueprint constants — pure data, zero imports.
 *
 * Source of truth: docs/research-testdaf-spec.md §10 ("LMS blueprint
 * constants"). Values mirror the official TestDaF paper and TestDaF digital
 * formats; see §9 of that doc for what was deliberately NOT hard-coded.
 */

export const TESTDAF_PAPER = {
    LV: {
        texts: 3,
        items: [10, 10, 10],
        formats: ['match', 'mc3', 'jnl'],
        timeMin: 60,
        transferMin: 10,
    },
    HV: {
        parts: [
            { items: 8, plays: 1 },
            { items: 10, plays: 1 },
            { items: 7, plays: 2 },
        ],
        timeMin: 40,
        transferMin: 10,
    },
    SA: {
        timeMin: 60,
        splitMinutes: { graph: 20, argue: 40 },
    },
    MA: {
        totalMin: 30,
        instructionsMin: 5,
        tasks: [
            [30, 30],
            [60, 60],
            [60, 90],
            [180, 120],
            [120, 90],
            [180, 120],
            [90, 90],
        ],
    },
} as const;

export const TESTDAF_DIGITAL = {
    Lesen: { taskTypes: 7, items: 34, timeMin: 55 },
    Hoeren: { taskTypes: 7, items: 30, timeMin: 40 },
    Schreiben: {
        tasks: 2,
        timeMin: 60,
        wordTargets: { summaryMin: 100, summaryMax: 150, essayMin: 200 },
    },
    Sprechen: { speakSeconds: [45, 90, 120, 90, 150, 120, 90] },
} as const;

export type TdnBand = 'unter_tdn3' | 'tdn3' | 'tdn4' | 'tdn5';

/** Official per-section scale is 0–20; bands: 0–4 unter TDN 3, 5–9 TDN 3,
 *  10–15 TDN 4, 16–20 TDN 5. */
export function getTdnBand(scoreOutOf20: number): TdnBand {
    if (scoreOutOf20 >= 16) return 'tdn5';
    if (scoreOutOf20 >= 10) return 'tdn4';
    if (scoreOutOf20 >= 5) return 'tdn3';
    return 'unter_tdn3';
}

export type ExamCode = 'testdaf_paper' | 'testdaf_digital';

export const EXAM_BLUEPRINTS: Record<ExamCode, typeof TESTDAF_PAPER | typeof TESTDAF_DIGITAL> = {
    testdaf_paper: TESTDAF_PAPER,
    testdaf_digital: TESTDAF_DIGITAL,
};
