const fs = require('fs');
const path = require('path');

const reportsDir = path.resolve(process.cwd(), 'playwright-reports');
const outJson = path.resolve(reportsDir, 'summary.json');
const outTxt = path.resolve(reportsDir, 'summary.txt');

if (!fs.existsSync(reportsDir)) {
  console.error('playwright-reports directory not found');
  process.exit(1);
}

const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
const summary = [];

for (const file of files) {
  try {
    const full = path.join(reportsDir, file);
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    const violations = data.violations || [];
    for (const v of violations) {
      for (const node of v.nodes || []) {
        summary.push({
          report: file,
          url: data.url,
          ruleId: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          html: (node.html || '').slice(0, 1000),
          targets: (node.target || []).slice(0,5),
          failureSummary: node.failureSummary || v.description || ''
        });
      }
    }
  } catch (err) {
    console.error('failed to parse', file, err.message);
  }
}

fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));

const lines = summary.map(s => `${s.report}\t${s.url}\t${s.ruleId}\t${s.impact}\t${s.targets.join('|')}\t${s.html.replace(/\n/g,' ')}`);
fs.writeFileSync(outTxt, lines.join('\n'));

console.log('Parsed', files.length, 'reports. Violations found:', summary.length);
console.log('Summary written to', outJson, 'and', outTxt);
