/**
 * Automated Test Suite for LinguaSage Website
 * Tests all critical functionality automatically
 */

class LinguaSageTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.baseUrl = window.location.origin;
  }

  // Utility functions
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async navigateTo(path) {
    window.location.href = `${this.baseUrl}${path}`;
    await this.wait(1000);
  }

  checkElement(selector, description) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        this.log(`${description} - Found`, 'success');
        this.results.passed++;
        return element;
      } else {
        this.log(`${description} - Not found`, 'error');
        this.results.failed++;
        this.results.errors.push(`Missing element: ${selector}`);
        return null;
      }
    } catch (error) {
      this.log(`${description} - Error: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push(`Error checking ${selector}: ${error.message}`);
      return null;
    }
  }

  async testNavigation() {
    this.log('Testing Navigation...', 'info');
    
    // Test navigation links
    const navLinks = [
      { selector: 'a[href="/"]', name: 'Home Link' },
      { selector: 'a[href="/about"]', name: 'About Link' },
      { selector: 'a[href="/blog"]', name: 'Blog Link' },
      { selector: 'a[href="/classes"]', name: 'Classes Link' },
      { selector: 'a[href="/contact"]', name: 'Contact Link' }
    ];

    navLinks.forEach(link => {
      this.checkElement(link.selector, link.name);
    });

    // Test language switcher
    this.checkElement('[data-testid="language-switcher"]', 'Language Switcher');
    
    // Test theme toggle
    this.checkElement('[data-testid="theme-toggle"]', 'Theme Toggle');
  }

  async testHomepage() {
    this.log('Testing Homepage...', 'info');
    
    await this.navigateTo('/');
    
    // Test hero section
    this.checkElement('h1', 'Hero Heading');
    this.checkElement('[data-testid="hero-section"]', 'Hero Section');
    
    // Test main content areas
    this.checkElement('main', 'Main Content Area');
    this.checkElement('header', 'Header');
    this.checkElement('footer', 'Footer');
  }

  async testAboutPage() {
    this.log('Testing About Page...', 'info');
    
    await this.navigateTo('/about');
    
    this.checkElement('[data-testid="about-content"]', 'About Content');
    this.checkElement('[data-testid="timeline"]', 'Timeline Component');
  }

  async testBlogSection() {
    this.log('Testing Blog Section...', 'info');
    
    // Test blog list page
    await this.navigateTo('/blog');
    this.checkElement('[data-testid="blog-posts-list"]', 'Blog Posts List');
    this.checkElement('[data-testid="blog-card"]', 'Blog Card');
    
    // Test individual blog post (if exists)
    const firstPost = document.querySelector('[data-testid="blog-card"] a');
    if (firstPost) {
      const postUrl = firstPost.getAttribute('href');
      await this.navigateTo(postUrl);
      this.checkElement('[data-testid="blog-post-content"]', 'Blog Post Content');
      this.checkElement('h1', 'Blog Post Title');
    }
  }

  async testClassesSection() {
    this.log('Testing Classes Section...', 'info');
    
    // Test classes list page
    await this.navigateTo('/classes');
    this.checkElement('[data-testid="classes-list"]', 'Classes List');
    this.checkElement('[data-testid="class-card"]', 'Class Card');
    
    // Test individual class page (if exists)
    const firstClass = document.querySelector('[data-testid="class-card"] a');
    if (firstClass) {
      const classUrl = firstClass.getAttribute('href');
      await this.navigateTo(classUrl);
      this.checkElement('[data-testid="class-details"]', 'Class Details');
      this.checkElement('[data-testid="registration-form"]', 'Registration Form');
    }
  }

  async testContactPage() {
    this.log('Testing Contact Page...', 'info');
    
    await this.navigateTo('/contact');
    
    this.checkElement('[data-testid="contact-form"]', 'Contact Form');
    this.checkElement('input[name="name"]', 'Name Field');
    this.checkElement('input[name="email"]', 'Email Field');
    this.checkElement('textarea[name="message"]', 'Message Field');
    this.checkElement('button[type="submit"]', 'Submit Button');
  }

  async testLoginPage() {
    this.log('Testing Login Page...', 'info');
    
    await this.navigateTo('/login');
    
    this.checkElement('input[name="email"]', 'Email Field');
    this.checkElement('input[name="password"]', 'Password Field');
    this.checkElement('button[type="submit"]', 'Login Button');
  }

  async testFormValidation() {
    this.log('Testing Form Validation...', 'info');
    
    // Test contact form validation
    await this.navigateTo('/contact');
    
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.click();
      await this.wait(500);
      
      // Check if validation errors appear
      const errorElements = document.querySelectorAll('[data-testid="error-message"]');
      if (errorElements.length > 0) {
        this.log('Form validation working', 'success');
        this.results.passed++;
      } else {
        this.log('Form validation not working', 'error');
        this.results.failed++;
        this.results.errors.push('Form validation not working properly');
      }
    }
  }

  async testResponsiveDesign() {
    this.log('Testing Responsive Design...', 'info');
    
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      // Note: This would require actual browser automation
      // For manual testing, resize browser window manually
      this.log(`Testing ${viewport.name} view (${viewport.width}x${viewport.height})`, 'info');
      
      // Check if mobile menu exists for small screens
      if (viewport.width < 768) {
        this.checkElement('[data-testid="mobile-menu-toggle"]', 'Mobile Menu Toggle');
      }
    }
  }

  async testLanguageSwitching() {
    this.log('Testing Language Switching...', 'info');
    
    const languageButtons = document.querySelectorAll('[data-testid="language-button"]');
    
    for (let i = 0; i < languageButtons.length && i < 3; i++) {
      const button = languageButtons[i];
      const lang = button.getAttribute('data-lang');
      
      button.click();
      await this.wait(500);
      
      // Check if page content changed language
      const htmlLang = document.documentElement.lang;
      if (htmlLang === lang) {
        this.log(`Language switched to ${lang}`, 'success');
        this.results.passed++;
      } else {
        this.log(`Language switching to ${lang} failed`, 'error');
        this.results.failed++;
        this.results.errors.push(`Language switching to ${lang} failed`);
      }
    }
  }

  async testThemeToggle() {
    this.log('Testing Theme Toggle...', 'info');
    
    const themeToggle = document.querySelector('[data-testid="theme-toggle"]');
    if (themeToggle) {
      const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      
      themeToggle.click();
      await this.wait(500);
      
      const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      
      if (initialTheme !== newTheme) {
        this.log('Theme toggle working', 'success');
        this.results.passed++;
      } else {
        this.log('Theme toggle not working', 'error');
        this.results.failed++;
        this.results.errors.push('Theme toggle not functioning');
      }
    }
  }

  async testPerformance() {
    this.log('Testing Performance...', 'info');
    
    const startTime = performance.now();
    await this.navigateTo('/');
    const loadTime = performance.now() - startTime;
    
    if (loadTime < 3000) {
      this.log(`Page load time: ${loadTime.toFixed(2)}ms - Good`, 'success');
      this.results.passed++;
    } else {
      this.log(`Page load time: ${loadTime.toFixed(2)}ms - Slow`, 'error');
      this.results.failed++;
      this.results.errors.push(`Slow page load: ${loadTime.toFixed(2)}ms`);
    }
  }

  async testConsoleErrors() {
    this.log('Checking Console Errors...', 'info');
    
    // Store original console.error
    const originalError = console.error;
    const errors = [];
    
    // Override console.error to capture errors
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Wait a bit to capture any async errors
    await this.wait(2000);
    
    // Restore original console.error
    console.error = originalError;
    
    if (errors.length === 0) {
      this.log('No console errors found', 'success');
      this.results.passed++;
    } else {
      this.log(`Found ${errors.length} console errors`, 'error');
      this.results.failed++;
      this.results.errors.push(`Console errors: ${errors.join(', ')}`);
    }
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(2) : 0;
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 LINGUASAGE TEST REPORT');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log('='.repeat(50));
    
    if (this.results.errors.length > 0) {
      console.log('\n🐛 ERRORS FOUND:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    return {
      passed: this.results.passed,
      failed: this.results.failed,
      successRate: successRate,
      errors: this.results.errors
    };
  }

  async runAllTests() {
    this.log('🚀 Starting LinguaSage Test Suite...', 'info');
    
    try {
      await this.testHomepage();
      await this.testNavigation();
      await this.testAboutPage();
      await this.testBlogSection();
      await this.testClassesSection();
      await this.testContactPage();
      await this.testLoginPage();
      await this.testFormValidation();
      await this.testLanguageSwitching();
      await this.testThemeToggle();
      await this.testResponsiveDesign();
      await this.testPerformance();
      await this.testConsoleErrors();
    } catch (error) {
      this.log(`Test suite error: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push(`Test suite error: ${error.message}`);
    }
    
    return this.generateReport();
  }
}

// Usage instructions
console.log(`
🧪 LinguaSage Automated Test Suite
==================================

To run tests:
1. Open browser developer tools (F12)
2. Navigate to your website
3. Run: const tester = new LinguaSageTestSuite(); tester.runAllTests();

Or run individual tests:
- tester.testHomepage()
- tester.testNavigation() 
- tester.testBlogSection()
- tester.testContactPage()
- etc.
`);

// Auto-run if in testing environment
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Uncomment the line below to auto-run tests
  // setTimeout(() => new LinguaSageTestSuite().runAllTests(), 2000);
}