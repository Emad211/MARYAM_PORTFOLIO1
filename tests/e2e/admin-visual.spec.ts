import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Admin visual & accessibility checks', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 900 },
  ];

  const adminPages = [
    '/admin',
    '/admin/messages',
    '/admin/registrations',
    '/admin/blog',
    '/admin/classes',
    '/admin/settings',
  ];

  async function login(page: Page) {
    await page.goto('/login');
    await page.waitForSelector('form, input[name="email"], input[type="email"], input[name="password"]', { timeout: 10000 });
    const emailSelector = 'input[name="email"] , input[type="email"] , input#email';
    const passwordSelector = 'input[name="password"] , input[type="password"] , input#password';
    await page.fill(emailSelector, 'admin@example.com');
    await page.fill(passwordSelector, 'password');
    const submitBtn = page.locator('button[type="submit"], button:has-text("ورود"), button:has-text("Login")');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForURL('**/admin', { timeout: 20000 });
  }

  test.beforeEach(async ({ page }) => {
    // ensure output folders
    fs.mkdirSync(path.resolve(process.cwd(), 'playwright-screenshots'), { recursive: true });
    fs.mkdirSync(path.resolve(process.cwd(), 'playwright-reports'), { recursive: true });
  });

  for (const vp of viewports) {
    for (const p of adminPages) {
  test(`capture ${p} @ ${vp.name}`, async ({ page }: { page: Page }) => {
        // set viewport
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // login once per page flow
        await login(page);

        // go to target page
        await page.goto(p);
        // Wait for an admin-specific element to ensure page loaded
        await page.waitForSelector('[data-testid="admin-dashboard"] , [data-testid="dashboard-content"] , main, h1', { timeout: 10000 });

        // small pause for fonts/animations
        await page.waitForTimeout(300);

        // screenshot
        const safeName = p.replace(/\//g, '_').replace(/^_/, '');
        const screenshotPath = path.resolve(process.cwd(), `playwright-screenshots/${safeName}-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // inject axe-core from CDN and run accessibility checks
        try {
          await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' });
          const axeResults = await page.evaluate(async () => {
            // @ts-ignore
            return await (window as any).axe.run();
          });
          const reportPath = path.resolve(process.cwd(), `playwright-reports/axe-${safeName}-${vp.name}.json`);
          fs.writeFileSync(reportPath, JSON.stringify(axeResults, null, 2));

          // Log summary to test output
          const violations = axeResults.violations || [];
          console.log(`axe violations for ${p} @ ${vp.name}: ${violations.length}`);
        } catch (err) {
          console.warn('axe injection or run failed:', err);
        }

        // Basic focus ring test: focus first interactive element
        const firstInteractive = page.locator('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])').first();
        if (await firstInteractive.count() > 0) {
          await firstInteractive.focus();
          const styles = await firstInteractive.evaluate((el) => {
            const cs = window.getComputedStyle(el as Element);
            return { outline: cs.outline || '', boxShadow: cs.boxShadow || '' };
          });
          // Save to report (not failing test) but warn if both outline and boxShadow appear empty
          if (!styles.outline && (!styles.boxShadow || styles.boxShadow === 'none')) {
            console.warn(`Focus ring not detected for ${p} @ ${vp.name}. This may be intentional if focus styles are custom.`);
          }
        }

        // ARIA check: icon-only buttons should have accessible name
        const iconButtons = page.locator('button:has(svg)');
        const iconCount = await iconButtons.count();
        const unnamed: string[] = [];
        for (let i = 0; i < iconCount; i++) {
          const btn = iconButtons.nth(i);
          const aria = await btn.getAttribute('aria-label');
          const title = await btn.getAttribute('title');
          const text = (await btn.innerText())?.trim();
          if (!aria && !title && (!text || text.length === 0)) {
            unnamed.push(await btn.evaluate((b) => (b.outerHTML ? b.outerHTML.slice(0, 200) : 'button')));
          }
        }
        if (unnamed.length > 0) {
          const reportPath = path.resolve(process.cwd(), `playwright-reports/unnamed-icon-buttons-${safeName}-${vp.name}.json`);
          fs.writeFileSync(reportPath, JSON.stringify(unnamed, null, 2));
          console.warn(`Found ${unnamed.length} icon-only buttons without accessible name on ${p} @ ${vp.name}. Report: ${reportPath}`);
        }

        // Stop-propagation check (messages/registrations tables): clicking icon button shouldn't navigate away
        if (p === '/admin/messages' || p === '/admin/registrations') {
          const rowButton = page.locator('table tbody tr button').first();
          if (await rowButton.count() > 0) {
            const before = page.url();
            await rowButton.click();
            await page.waitForTimeout(300);
            const after = page.url();
            if (before !== after) {
              console.warn(`Row icon click navigated from ${before} -> ${after} on ${p} @ ${vp.name}`);
            }
            // try to dismiss modal/dialog if opened
            const closeBtn = page.locator('dialog button, [role="dialog"] button, button:has-text("Cancel"), button:has-text("Close")').first();
            if (await closeBtn.count() > 0) {
              await closeBtn.click();
            }
          }
        }

        // RTL snapshot: set dir=rtl and take another screenshot to check layout mirroring
        await page.evaluate(() => {
          document.documentElement.lang = 'fa';
          document.documentElement.dir = 'rtl';
        });
        await page.waitForTimeout(150);
        const rtlScreenshotPath = path.resolve(process.cwd(), `playwright-screenshots/${safeName}-${vp.name}-rtl.png`);
        await page.screenshot({ path: rtlScreenshotPath, fullPage: true });
      });
    }
  }
});
