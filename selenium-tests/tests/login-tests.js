/**
 * MediTrust Web Application - Selenium E2E Functional Test Suite
 * File: selenium-tests/tests/login-tests.js
 * Description: Comprehensive Selenium WebDriver E2E test suite for the MediTrust Web Frontend Authentication & Navigation.
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  timeout: 10000,
  headless: process.env.HEADLESS !== 'false',
  testEmail: process.env.TEST_EMAIL || 'sowmya@gmail.com',
  testPassword: process.env.TEST_PASSWORD || 'sowmya',
  invalidEmail: 'invalid.user@nonexistent.domain',
  invalidPassword: 'WrongPassword!999',
};

// Test Execution Reporter
class TestReporter {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  logTest(testId, name, category, status, durationMs, details = '') {
    const record = {
      testId,
      name,
      category,
      status, // 'PASS' | 'FAIL' | 'SKIPPED'
      durationMs,
      details,
      timestamp: new Date().toISOString()
    };
    this.results.push(record);
    const color = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${color}[${status}]\x1b[0m [${testId}] ${name} (${durationMs}ms) ${details ? '- ' + details : ''}`);
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIPPED').length;
    const duration = ((new Date() - this.startTime) / 1000).toFixed(2);
    return { total, passed, failed, skipped, duration, results: this.results };
  }
}

const reporter = new TestReporter();

// Driver Initialization helper
async function createDriver() {
  const options = new chrome.Options();
  if (CONFIG.headless) {
    options.addArguments('--headless=new');
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1440,900',
    '--ignore-certificate-errors'
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: 3000, pageLoad: 15000 });
  return driver;
}

// Test Suite Runner
async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('  MediTrust Web Application - Selenium E2E Test Suite');
  console.log(`  Target URL: ${CONFIG.baseUrl}`);
  console.log(`  Mode: ${CONFIG.headless ? 'Headless Chrome' : 'GUI Chrome'}`);
  console.log('=============================================================\n');

  let driver;
  try {
    driver = await createDriver();

    // ==========================================
    // SECTION 1: WELCOME SCREEN & BRANDING TESTS
    // ==========================================
    console.log('\n--- Category 1: Welcome & Landing Page Verification ---');

    await runTestCase('TC_AUTH_001', 'Page Navigation & Load', 'Welcome Screen', async () => {
      await driver.get(CONFIG.baseUrl);
      await driver.wait(until.elementLocated(By.tagName('body')), CONFIG.timeout);
      const title = await driver.getTitle();
      if (!title && title !== '') throw new Error('Page failed to load document title');
    });

    await runTestCase('TC_AUTH_002', 'Verify Application Header Branding', 'Welcome Screen', async () => {
      const heading = await driver.wait(
        until.elementLocated(By.xpath("//h1[contains(text(), 'MedVigilance')]")),
        CONFIG.timeout
      );
      const text = await heading.getText();
      if (!text.includes('MedVigilance')) throw new Error(`Expected MedVigilance heading, found: ${text}`);
    });

    await runTestCase('TC_AUTH_003', 'Verify Subtitle and Clinical Tagline', 'Welcome Screen', async () => {
      const tagline = await driver.findElement(
        By.xpath("//p[contains(text(), 'MediTrust Clinical Safety')]")
      );
      const text = await tagline.getText();
      if (!text.includes('Clinical Safety')) throw new Error('Subheading text mismatch');
    });

    await runTestCase('TC_AUTH_004', 'Verify Verified Medicine Portal Feature Card', 'Welcome Screen', async () => {
      const card = await driver.findElement(
        By.xpath("//h3[contains(text(), 'Verified Medicine Portal')]")
      );
      if (!(await card.isDisplayed())) throw new Error('Verified Medicine Portal card not visible');
    });

    await runTestCase('TC_AUTH_005', 'Verify Expiry Management Feature Card', 'Welcome Screen', async () => {
      const card = await driver.findElement(
        By.xpath("//h3[contains(text(), 'Expiry Management')]")
      );
      if (!(await card.isDisplayed())) throw new Error('Expiry Management card not visible');
    });

    await runTestCase('TC_AUTH_006', 'Verify HIPAA Compliance Footer Badge', 'Welcome Screen', async () => {
      const footer = await driver.findElement(
        By.xpath("//*[contains(text(), 'HIPAA Compliant & End-to-End Encrypted')]")
      );
      if (!(await footer.isDisplayed())) throw new Error('HIPAA footer badge not displayed');
    });

    await runTestCase('TC_AUTH_007', 'Verify Welcome Screen CTA Buttons', 'Welcome Screen', async () => {
      const signInBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Sign In')]"));
      const createAccBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Create Account')]"));
      if (!(await signInBtn.isDisplayed()) || !(await createAccBtn.isDisplayed())) {
        throw new Error('CTA buttons missing or not visible');
      }
    });

    // ==========================================
    // SECTION 2: NAVIGATION TO LOGIN & FORM CHECKS
    // ==========================================
    console.log('\n--- Category 2: Login Form Controls & Field Validation ---');

    await runTestCase('TC_AUTH_008', 'Navigate from Welcome to Login Form', 'Login Navigation', async () => {
      const signInBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Sign In')]"));
      await signInBtn.click();
      const loginHeading = await driver.wait(
        until.elementLocated(By.xpath("//h2[contains(text(), 'Welcome Back')]")),
        CONFIG.timeout
      );
      if (!(await loginHeading.isDisplayed())) throw new Error('Failed to transition to Login form');
    });

    await runTestCase('TC_AUTH_009', 'Verify Email Input Field Presence and Attributes', 'Login Form Elements', async () => {
      const emailInput = await driver.findElement(By.css("input[type='email']"));
      const placeholder = await emailInput.getAttribute('placeholder');
      const isRequired = await emailInput.getAttribute('required');
      if (!placeholder || isRequired === null) {
        throw new Error('Email input missing standard attributes');
      }
    });

    await runTestCase('TC_AUTH_010', 'Verify Password Input Masking', 'Login Form Elements', async () => {
      const passwordInput = await driver.findElement(By.css("input[type='password']"));
      const type = await passwordInput.getAttribute('type');
      if (type !== 'password') throw new Error(`Password field type expected 'password', found '${type}'`);
    });

    await runTestCase('TC_AUTH_011', 'Verify Keep Me Logged In Checkbox', 'Login Form Elements', async () => {
      const checkbox = await driver.findElement(By.css("input[type='checkbox']"));
      if (!(await checkbox.isDisplayed())) throw new Error('Keep me logged in checkbox missing');
      await checkbox.click();
      const isChecked = await checkbox.isSelected();
      if (!isChecked) throw new Error('Checkbox failed to toggle on click');
      await checkbox.click(); // Toggle back
    });

    await runTestCase('TC_AUTH_012', 'Verify Forgot Password Link Presence', 'Login Form Elements', async () => {
      const forgotBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Forgot Password?')]"));
      if (!(await forgotBtn.isDisplayed())) throw new Error('Forgot password button not visible');
    });

    await runTestCase('TC_AUTH_013', 'Verify Sign Up Toggle Link in Login Mode', 'Login Form Elements', async () => {
      const signUpLink = await driver.findElement(By.xpath("//button[contains(text(), 'Sign up')]"));
      if (!(await signUpLink.isDisplayed())) throw new Error('Sign up navigation link missing');
    });

    // ==========================================
    // SECTION 3: VALIDATION AND ERROR HANDLING
    // ==========================================
    console.log('\n--- Category 3: Form Validation & Security Boundary Checks ---');

    await runTestCase('TC_AUTH_014', 'Submit Empty Login Form Triggers Validation', 'Error Handling', async () => {
      const emailInput = await driver.findElement(By.css("input[type='email']"));
      const passwordInput = await driver.findElement(By.css("input[type='password']"));
      await emailInput.clear();
      await passwordInput.clear();

      const submitBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Login')]"));
      // Using js submit to test script-level validation if html5 required is bypassed
      await driver.executeScript("arguments[0].removeAttribute('required');", emailInput);
      await driver.executeScript("arguments[0].removeAttribute('required');", passwordInput);
      await submitBtn.click();

      const errorAlert = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(., 'Please enter both email and password.')]")),
        CONFIG.timeout
      );
      if (!(await errorAlert.isDisplayed())) throw new Error('Validation message not displayed');
    });

    await runTestCase('TC_AUTH_015', 'Submit With Missing Password Triggers Validation', 'Error Handling', async () => {
      const emailInput = await driver.findElement(By.css("input[type='email']"));
      await emailInput.sendKeys('test@example.com');
      const submitBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Login')]"));
      await submitBtn.click();

      const errorAlert = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(., 'Please enter both email and password.')]")),
        CONFIG.timeout
      );
      if (!(await errorAlert.isDisplayed())) throw new Error('Missing password error not shown');
    });

    await runTestCase('TC_AUTH_016', 'Submit Invalid Credentials Displays Auth Error', 'Firebase Auth', async () => {
      const emailInput = await driver.findElement(By.css("input[type='email']"));
      const passwordInput = await driver.findElement(By.css("input[type='password']"));
      await emailInput.clear();
      await emailInput.sendKeys(CONFIG.invalidEmail);
      await passwordInput.clear();
      await passwordInput.sendKeys(CONFIG.invalidPassword);

      const submitBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Login')]"));
      await submitBtn.click();

      const errorAlert = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(., 'Incorrect credentials') or contains(., 'error occurred')]")),
        CONFIG.timeout
      );
      if (!(await errorAlert.isDisplayed())) throw new Error('Authentication failure alert not shown');
    });

    // ==========================================
    // SECTION 4: REGISTRATION & FORGOT PASSWORD FLOWS
    // ==========================================
    console.log('\n--- Category 4: Registration and Password Reset Modes ---');

    await runTestCase('TC_AUTH_017', 'Navigate to Registration Mode', 'Registration Flow', async () => {
      const signUpLink = await driver.findElement(By.xpath("//button[contains(text(), 'Sign up')]"));
      await signUpLink.click();

      const regHeading = await driver.wait(
        until.elementLocated(By.xpath("//h2[contains(text(), 'Create Patient Account')]")),
        CONFIG.timeout
      );
      if (!(await regHeading.isDisplayed())) throw new Error('Registration form not displayed');
    });

    await runTestCase('TC_AUTH_018', 'Verify Registration Form Required Inputs', 'Registration Flow', async () => {
      const nameInput = await driver.findElement(By.css("input[placeholder*='Sarah Johnson']"));
      const emailInput = await driver.findElement(By.css("input[type='email']"));
      const passwordInputs = await driver.findElements(By.css("input[type='password']"));

      if (!nameInput || !emailInput || passwordInputs.length < 2) {
        throw new Error('Registration form inputs missing or incomplete');
      }
    });

    await runTestCase('TC_AUTH_019', 'Registration Password Mismatch Validation', 'Registration Flow', async () => {
      const nameInput = await driver.findElement(By.css("input[placeholder*='Sarah Johnson']"));
      const emailInput = await driver.findElement(By.css("input[type='email']"));
      const passwordInputs = await driver.findElements(By.css("input[type='password']"));

      await nameInput.sendKeys('Test User');
      await emailInput.sendKeys('newtestuser@example.com');
      await passwordInputs[0].sendKeys('Password123');
      await passwordInputs[1].sendKeys('Mismatch123');

      const registerBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Register Account')]"));
      await registerBtn.click();

      const errorAlert = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(., 'Passwords do not match.')]")),
        CONFIG.timeout
      );
      if (!(await errorAlert.isDisplayed())) throw new Error('Password mismatch alert not shown');
    });

    await runTestCase('TC_AUTH_020', 'Navigate to Forgot Password Mode', 'Forgot Password Flow', async () => {
      // First go back to login
      const signInLink = await driver.findElement(By.xpath("//button[contains(text(), 'Sign In')]"));
      await signInLink.click();

      const forgotBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Forgot Password?')]")),
        CONFIG.timeout
      );
      await forgotBtn.click();

      const resetHeading = await driver.wait(
        until.elementLocated(By.xpath("//h2[contains(text(), 'Reset Password')]")),
        CONFIG.timeout
      );
      if (!(await resetHeading.isDisplayed())) throw new Error('Reset Password view not displayed');
    });

    await runTestCase('TC_AUTH_021', 'Verify Forgot Password Form & Back Navigation', 'Forgot Password Flow', async () => {
      const resetEmailInput = await driver.findElement(By.css("input[type='email']"));
      const sendResetBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Send Reset Link')]"));
      const backBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Back to Sign In')]"));

      if (!(await resetEmailInput.isDisplayed()) || !(await sendResetBtn.isDisplayed()) || !(await backBtn.isDisplayed())) {
        throw new Error('Reset password elements missing');
      }

      await backBtn.click();
      await driver.wait(until.elementLocated(By.xpath("//h2[contains(text(), 'Welcome Back')]")), CONFIG.timeout);
    });

    // ==========================================
    // SECTION 5: SUCCESSFUL LOGIN & DASHBOARD E2E
    // ==========================================
    console.log('\n--- Category 5: Valid Login & Portal Dashboard Navigation ---');

    await runTestCase('TC_AUTH_022', 'Successful Authentication with Valid Credentials', 'End-to-End Auth', async () => {
      // Re-fill valid credentials
      await driver.get(CONFIG.baseUrl);
      const signInBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Sign In')]")),
        CONFIG.timeout
      );
      await signInBtn.click();

      const emailInput = await driver.wait(
        until.elementLocated(By.css("input[type='email']")),
        CONFIG.timeout
      );
      const passwordInput = await driver.findElement(By.css("input[type='password']"));

      await emailInput.clear();
      await emailInput.sendKeys(CONFIG.testEmail);
      await passwordInput.clear();
      await passwordInput.sendKeys(CONFIG.testPassword);

      const loginBtn = await driver.findElement(By.xpath("//button[@type='submit' and contains(., 'Login')]"));
      await loginBtn.click();

      // Wait for authenticated dashboard container to load
      const appContainer = await driver.wait(
        until.elementLocated(By.className('app-container')),
        CONFIG.timeout
      );
      if (!(await appContainer.isDisplayed())) throw new Error('Failed to load authenticated app dashboard');
    });

    await runTestCase('TC_AUTH_023', 'Verify Sidebar Navigation Links', 'Post-Login Navigation', async () => {
      const sidebar = await driver.findElement(By.className('sidebar'));
      if (!(await sidebar.isDisplayed())) throw new Error('Sidebar navigation is not visible');

      // Verify dashboard header exists
      const header = await driver.findElement(By.className('header'));
      if (!(await header.isDisplayed())) throw new Error('Application header is not visible');
    });

    await runTestCase('TC_AUTH_024', 'Verify User Logout Flow', 'Session Management', async () => {
      // Find and click Logout button in sidebar
      const logoutBtn = await driver.findElement(
        By.xpath("//button[contains(., 'Sign Out') or contains(., 'Logout') or @title='Logout']")
      );
      await logoutBtn.click();

      // Verify return to Auth/Welcome page
      const welcomeCard = await driver.wait(
        until.elementLocated(By.xpath("//h1[contains(text(), 'MedVigilance')]")),
        CONFIG.timeout
      );
      if (!(await welcomeCard.isDisplayed())) throw new Error('Logout did not return to Welcome/Auth screen');
    });

  } catch (err) {
    console.error(`\n[FATAL ERROR] Test suite aborted due to uncaught exception: ${err.message}`);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }

  // Print Summary
  const summary = reporter.getSummary();
  console.log('\n=============================================================');
  console.log('                  TEST EXECUTION SUMMARY                     ');
  console.log('=============================================================');
  console.log(`  Total Tests Run : ${summary.total}`);
  console.log(`  Passed          : \x1b[32m${summary.passed}\x1b[0m`);
  console.log(`  Failed          : \x1b[31m${summary.failed}\x1b[0m`);
  console.log(`  Skipped         : \x1b[33m${summary.skipped}\x1b[0m`);
  console.log(`  Total Duration  : ${summary.duration} seconds`);
  console.log('=============================================================\n');

  return summary;
}

// Helper to execute and record individual test case
async function runTestCase(testId, name, category, testFn) {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    reporter.logTest(testId, name, category, 'PASS', duration);
  } catch (err) {
    const duration = Date.now() - start;
    reporter.logTest(testId, name, category, 'FAIL', duration, err.message);
  }
}

// Export for external runner or execute directly
if (require.main === module) {
  runTestSuite().catch(console.error);
}

module.exports = {
  runTestSuite,
  TestReporter,
  CONFIG
};
