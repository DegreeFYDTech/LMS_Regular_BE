import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

let browserInstance = null;


export const getBrowser = async () => {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('[Playwright] Launching shared Chromium instance...');
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,720'
      ]
    });
  }
  return browserInstance;
};


export const closeBrowser = async () => {
  if (browserInstance) {
    console.log('[Playwright] Closing shared browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
};


export const submitCucetLead = async (lead, randomData) => {
  const browser = await getBrowser();
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  
  try {
    console.log(`[Playwright] Navigating to CUCET public form for student ${lead.studentId}...`);
    await page.goto('https://cucet.cuchd.in/?utm_source=nuvora', { 
      waitUntil: 'networkidle', 
      timeout: 45000 
    });

    console.log('[Playwright] Identifying iframe scope...');
    const iframeSelector = 'iframe.lsq-portal-widget-iframe';
    
    await page.waitForSelector(iframeSelector, { timeout: 15000 }).catch(() => {
      console.log('[Playwright] Iframe selector not found immediately, checking main page context...');
    });
    
    const iframeElement = await page.$(iframeSelector);
    const formScope = iframeElement ? page.frameLocator(iframeSelector) : page;

    // 2. Wait for the core form field to become interactive in the resolved scope
    console.log('[Playwright] Waiting for form fields to load...');
    const nameInputSelector = 'input[id$="__tab1__section1__FirstName__Lead__0"]';
    await formScope.locator(nameInputSelector).waitFor({ timeout: 20000 });

    console.log('[Playwright] Entering Student Name...');
    await formScope.locator(nameInputSelector).pressSequentially(lead.studentName, { delay: 60 + Math.random() * 60 });
    await page.waitForTimeout(300 + Math.random() * 300);

    console.log('[Playwright] Entering Student Email...');
    await formScope.locator('input[id$="__tab1__section1__EmailAddress__Lead__0"]').pressSequentially(lead.email, { delay: 60 + Math.random() * 60 });
    await page.waitForTimeout(300 + Math.random() * 300);

    console.log('[Playwright] Entering Student Mobile No...');
    await formScope.locator('input.number-input').pressSequentially(lead.phone, { delay: 60 + Math.random() * 60 });
    await page.waitForTimeout(300 + Math.random() * 300);

    // 4. Programmatically set Date of Birth to bypass Flatpickr readonly calendar limitations
    console.log(`[Playwright] Selecting DOB: ${randomData.dob}`);
    await formScope.locator('input[id$="__tab1__section1__mx_Date_Of_Birth__Lead__0"]').evaluate((el, dobVal) => {
      if (el) {
        el.removeAttribute('readonly');
        
        let formattedDate = dobVal;
        const parts = dobVal.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          formattedDate = `${day}/${month}/${year}`;
        }
        
        el.value = formattedDate;
        
        if (el._flatpickr) {
          el._flatpickr.setDate(formattedDate, true);
        }
        
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, randomData.dob);
    await page.waitForTimeout(400 + Math.random() * 400);

    // 5. Interact with custom Select2 dropdown inputs sequentially
    const dropdowns = [
      { trigger: 'span[id$="__mx_Campus__Lead__0-container"]', val: randomData.campus || 'Mohali' },
      { trigger: 'span[id$="__mx_City_New__Lead__0-container"]', val: randomData.city },
      { trigger: 'span[id$="__mx_Discipline_New__Lead__0-container"]', val: randomData.discipline },
      { trigger: 'span[id$="__mx_Program_New__Lead__0-container"]', val: randomData.program }
    ];

    for (const dropdown of dropdowns) {
      console.log(`[Playwright] Triggering select2 for value: "${dropdown.val}"`);
      await formScope.locator(dropdown.trigger).click();
      await page.waitForTimeout(300 + Math.random() * 200);

      // Search option in the select2 search field if visible
      const searchInput = formScope.locator('input.select2-search__field');
      if (await searchInput.isVisible()) {
        await searchInput.fill(dropdown.val);
        await page.waitForTimeout(400 + Math.random() * 200);
      }

      // Click on the first matching option result in the dropdown options list
      const optionResult = formScope.locator('ul.select2-results__options li').first();
      await optionResult.waitFor({ timeout: 5000 });
      await optionResult.click();
      await page.waitForTimeout(500 + Math.random() * 300);
    }

    // 6. Submit the form and monitor redirection
    console.log('[Playwright] Submitting lead application form...');
    const submitBtn = formScope.locator('button.lsq-form-action-btn:has-text("Apply Now")');
    
    // Fire submission click and wait for navigation synchronously
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 35000 }).catch(() => {
        console.log('[Playwright] Navigation wait timeout. Continuing check...');
      }),
      submitBtn.click()
    ]);

    // Give it a tiny buffer to complete final JS page transition
    await page.waitForTimeout(2000);

    const finalRedirectUrl = page.url();
    console.log(`[Playwright] Form successfully submitted. Redirect URL: ${finalRedirectUrl}`);

    let leadId = null;
    try {
      const urlObj = new URL(finalRedirectUrl);
      leadId = urlObj.searchParams.get('leadId');
    } catch (urlErr) {
      console.error('[Playwright] Failed to parse redirect URL searchParams:', urlErr.message);
      const match = finalRedirectUrl.match(/[?&]leadId=([^&]+)/i);
      if (match) leadId = match[1];
    }

    if (!finalRedirectUrl.toLowerCase().includes('/thankyou') && !leadId) {
      throw new Error(`Submission failed. Page did not redirect to Thank You page. Final URL: ${finalRedirectUrl}`);
    }

    // Close page and context to free up resources immediately
    await page.close();
    await context.close();

    return {
      success: true,
      redirectUrl: finalRedirectUrl,
      leadId: leadId
    };

  } catch (error) {
    console.error(`[Playwright] Error in automation run: ${error.message}`);

    // Capture failure screenshot for analysis
    try {
      const screenshotDir = path.join(process.cwd(), 'cu_bot', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const screenshotFile = `fail-${lead.studentId}-${Date.now()}.png`;
      const screenshotPath = path.join(screenshotDir, screenshotFile);
      
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[Playwright] Captured diagnostic failure screenshot at: ${screenshotPath}`);
    } catch (shotError) {
      console.error(`[Playwright] Failed to capture error screenshot: ${shotError.message}`);
    }

    // Ensure resources are cleaned up
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    
    throw error;
  }
};
