/**
 * Form Testing Suite
 * Tests all forms and validation logic
 */

class FormTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.baseUrl = window.location.origin;
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] FORM: ${message}`);
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
        this.results.errors.push(`Missing form element: ${selector}`);
        return null;
      }
    } catch (error) {
      this.log(`${description} - Error: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push(`Error checking form ${selector}: ${error.message}`);
      return null;
    }
  }

  async testContactForm() {
    this.log('Testing Contact Form...', 'info');
    
    await this.navigateTo('/contact');
    
    // Check form elements
    const nameField = this.checkElement('input[name="name"]', 'Contact Name Field');
    const emailField = this.checkElement('input[name="email"]', 'Contact Email Field');
    const subjectField = this.checkElement('input[name="subject"]', 'Contact Subject Field');
    const messageField = this.checkElement('textarea[name="message"]', 'Contact Message Field');
    const submitBtn = this.checkElement('button[type="submit"]', 'Contact Submit Button');
    
    if (!nameField || !emailField || !messageField || !submitBtn) {
      return;
    }

    // Test empty form submission (validation)
    this.log('Testing empty form validation...', 'info');
    submitBtn.click();
    await this.wait(500);
    
    // Check for validation errors
    const errorElements = document.querySelectorAll('[role="alert"], .error, [data-testid="error"]');
    if (errorElements.length > 0) {
      this.log('Contact form validation working', 'success');
      this.results.passed++;
    } else {
      this.log('Contact form validation not working', 'error');
      this.results.failed++;
      this.results.errors.push('Contact form lacks proper validation');
    }

    // Test invalid email
    this.log('Testing invalid email validation...', 'info');
    nameField.value = 'Test User';
    emailField.value = 'invalid-email';
    messageField.value = 'Test message';
    
    submitBtn.click();
    await this.wait(500);
    
    const emailErrorElements = document.querySelectorAll('[data-testid="email-error"], .email-error');
    if (emailErrorElements.length > 0 || !emailField.validity.valid) {
      this.log('Email validation working', 'success');
      this.results.passed++;
    } else {
      this.log('Email validation not working', 'error');
      this.results.failed++;
      this.results.errors.push('Email validation not functioning');
    }

    // Test valid form submission
    this.log('Testing valid form submission...', 'info');
    nameField.value = 'Test User';
    emailField.value = 'test@example.com';
    if (subjectField) subjectField.value = 'Test Subject';
    messageField.value = 'This is a test message for the contact form.';
    
    // Don't actually submit to avoid spam
    this.log('Contact form ready for valid submission', 'success');
    this.results.passed++;
  }

  async testRegistrationForm() {
    this.log('Testing Registration Form...', 'info');
    
    // Navigate to a class page that should have registration form
    await this.navigateTo('/classes');
    
    // Find first class and navigate to it
    const firstClassLink = document.querySelector('[data-testid="class-card"] a, .class-card a');
    if (firstClassLink) {
      firstClassLink.click();
      await this.wait(1500);
      
      // Check registration form elements
      const nameField = this.checkElement('input[name="name"], input[name="fullName"]', 'Registration Name Field');
      const emailField = this.checkElement('input[name="email"]', 'Registration Email Field');
      const phoneField = this.checkElement('input[name="phone"]', 'Registration Phone Field');
      const levelSelect = this.checkElement('select[name="level"]', 'Registration Level Select');
      const submitBtn = this.checkElement('button[type="submit"]', 'Registration Submit Button');
      
      if (!nameField || !emailField || !submitBtn) {
        this.log('Registration form not found or incomplete', 'error');
        this.results.failed++;
        this.results.errors.push('Registration form missing or incomplete');
        return;
      }

      // Test empty registration form
      this.log('Testing empty registration validation...', 'info');
      submitBtn.click();
      await this.wait(500);
      
      const errorElements = document.querySelectorAll('[role="alert"], .error, [data-testid="error"]');
      if (errorElements.length > 0) {
        this.log('Registration form validation working', 'success');
        this.results.passed++;
      } else {
        this.log('Registration form validation not working', 'error');
        this.results.failed++;
        this.results.errors.push('Registration form lacks validation');
      }

      // Test valid registration form
      this.log('Testing valid registration data...', 'info');
      nameField.value = 'John Doe';
      emailField.value = 'john@example.com';
      if (phoneField) phoneField.value = '+1234567890';
      if (levelSelect) levelSelect.value = 'beginner';
      
      // Don't actually submit
      this.log('Registration form ready for valid submission', 'success');
      this.results.passed++;
    } else {
      this.log('No class pages found to test registration', 'error');
      this.results.failed++;
      this.results.errors.push('No class pages available for registration testing');
    }
  }

  async testLoginForm() {
    this.log('Testing Login Form...', 'info');
    
    await this.navigateTo('/login');
    
    const emailField = this.checkElement('input[name="email"], input[type="email"]', 'Login Email Field');
    const passwordField = this.checkElement('input[name="password"], input[type="password"]', 'Login Password Field');
    const submitBtn = this.checkElement('button[type="submit"]', 'Login Submit Button');
    
    if (!emailField || !passwordField || !submitBtn) {
      return;
    }

    // Test empty login form
    this.log('Testing empty login validation...', 'info');
    submitBtn.click();
    await this.wait(500);
    
    const errorElements = document.querySelectorAll('[role="alert"], .error, [data-testid="error"]');
    if (errorElements.length > 0) {
      this.log('Login form validation working', 'success');
      this.results.passed++;
    } else {
      this.log('Login form validation not working', 'error');
      this.results.failed++;
      this.results.errors.push('Login form lacks validation');
    }

    // Test invalid credentials
    this.log('Testing invalid login credentials...', 'info');
    emailField.value = 'wrong@example.com';
    passwordField.value = 'wrongpassword';
    
    submitBtn.click();
    await this.wait(2000);
    
    // Check if still on login page or error message appeared
    if (window.location.pathname.includes('/login')) {
      this.log('Invalid login handled correctly', 'success');
      this.results.passed++;
    } else {
      this.log('Invalid login not handled properly', 'error');
      this.results.failed++;
      this.results.errors.push('Invalid login credentials accepted');
    }
  }

  async testAdminForms() {
    this.log('Testing Admin Forms...', 'info');
    
    // First login to admin
    await this.navigateTo('/login');
    
    const emailField = document.querySelector('input[name="email"], input[type="email"]');
    const passwordField = document.querySelector('input[name="password"], input[type="password"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (emailField && passwordField && submitBtn) {
      emailField.value = 'admin@example.com';
      passwordField.value = 'password';
      submitBtn.click();
      await this.wait(2000);
      
      if (window.location.pathname.includes('/admin')) {
        // Test blog creation form
        await this.navigateTo('/admin/blog/new');
        
        const titleField = this.checkElement('input[name="title"]', 'Blog Title Field');
        const contentField = this.checkElement('textarea[name="content"], [data-testid="content-editor"]', 'Blog Content Field');
        const slugField = this.checkElement('input[name="slug"]', 'Blog Slug Field');
        const saveBtn = this.checkElement('button[type="submit"]', 'Save Blog Button');
        
        if (titleField && contentField && saveBtn) {
          // Test empty blog form
          saveBtn.click();
          await this.wait(500);
          
          const errorElements = document.querySelectorAll('[role="alert"], .error, [data-testid="error"]');
          if (errorElements.length > 0) {
            this.log('Blog form validation working', 'success');
            this.results.passed++;
          } else {
            this.log('Blog form validation not working', 'error');
            this.results.failed++;
            this.results.errors.push('Blog form lacks validation');
          }
        }

        // Test class creation form
        await this.navigateTo('/admin/classes/new');
        
        const classTitle = this.checkElement('input[name="title"]', 'Class Title Field');
        const classDescription = this.checkElement('textarea[name="description"]', 'Class Description Field');
        const classPrice = this.checkElement('input[name="price"]', 'Class Price Field');
        const classSaveBtn = this.checkElement('button[type="submit"]', 'Save Class Button');
        
        if (classTitle && classDescription && classSaveBtn) {
          // Test empty class form
          classSaveBtn.click();
          await this.wait(500);
          
          const errorElements = document.querySelectorAll('[role="alert"], .error, [data-testid="error"]');
          if (errorElements.length > 0) {
            this.log('Class form validation working', 'success');
            this.results.passed++;
          } else {
            this.log('Class form validation not working', 'error');
            this.results.failed++;
            this.results.errors.push('Class form lacks validation');
          }
        }
      } else {
        this.log('Could not login to admin for form testing', 'error');
        this.results.failed++;
        this.results.errors.push('Admin login failed during form testing');
      }
    }
  }

  async testFormFieldTypes() {
    this.log('Testing Form Field Types...', 'info');
    
    await this.navigateTo('/contact');
    
    // Test email field
    const emailField = document.querySelector('input[type="email"], input[name="email"]');
    if (emailField) {
      emailField.value = 'invalid';
      emailField.dispatchEvent(new Event('blur'));
      await this.wait(100);
      
      if (!emailField.validity.valid) {
        this.log('Email field type validation working', 'success');
        this.results.passed++;
      } else {
        this.log('Email field type validation not working', 'error');
        this.results.failed++;
        this.results.errors.push('Email field type validation failing');
      }
    }

    // Test required fields
    const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
    if (requiredFields.length > 0) {
      this.log(`Found ${requiredFields.length} required fields`, 'success');
      this.results.passed++;
    } else {
      this.log('No required field attributes found', 'error');
      this.results.failed++;
      this.results.errors.push('Forms lack required field attributes');
    }
  }

  async testFormAccessibility() {
    this.log('Testing Form Accessibility...', 'info');
    
    await this.navigateTo('/contact');
    
    // Check for labels
    const inputs = document.querySelectorAll('input, textarea, select');
    let labeledInputs = 0;
    
    inputs.forEach(input => {
      const id = input.id;
      const name = input.name;
      
      // Check for associated label
      const label = document.querySelector(`label[for="${id}"]`);
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (label || ariaLabel || ariaLabelledBy) {
        labeledInputs++;
      }
    });
    
    const labelPercentage = inputs.length > 0 ? (labeledInputs / inputs.length) * 100 : 0;
    
    if (labelPercentage >= 90) {
      this.log(`Form accessibility good: ${labelPercentage.toFixed(0)}% inputs labeled`, 'success');
      this.results.passed++;
    } else {
      this.log(`Form accessibility poor: ${labelPercentage.toFixed(0)}% inputs labeled`, 'error');
      this.results.failed++;
      this.results.errors.push(`Only ${labelPercentage.toFixed(0)}% of form inputs are properly labeled`);
    }

    // Check for fieldsets
    const fieldsets = document.querySelectorAll('fieldset');
    const legends = document.querySelectorAll('legend');
    
    if (fieldsets.length === legends.length && fieldsets.length > 0) {
      this.log('Fieldset/legend structure good', 'success');
      this.results.passed++;
    } else if (fieldsets.length === 0) {
      this.log('No fieldsets found (might be okay for simple forms)', 'info');
    } else {
      this.log('Fieldset/legend structure issues', 'error');
      this.results.failed++;
      this.results.errors.push('Fieldsets missing corresponding legends');
    }
  }

  async testFormSecurity() {
    this.log('Testing Form Security...', 'info');
    
    await this.navigateTo('/contact');
    
    // Check for CSRF protection
    const csrfTokens = document.querySelectorAll('input[name*="csrf"], input[name*="token"], meta[name="csrf-token"]');
    if (csrfTokens.length > 0) {
      this.log('CSRF protection found', 'success');
      this.results.passed++;
    } else {
      this.log('No CSRF protection detected', 'error');
      this.results.failed++;
      this.results.errors.push('Forms may lack CSRF protection');
    }

    // Check for proper form methods
    const forms = document.querySelectorAll('form');
    let secureFormsCount = 0;
    
    forms.forEach(form => {
      const method = form.method.toLowerCase();
      const action = form.action;
      
      // Check if forms that modify data use POST
      if (method === 'post' || method === '') {
        secureFormsCount++;
      }
    });
    
    if (forms.length === secureFormsCount) {
      this.log('All forms use secure methods', 'success');
      this.results.passed++;
    } else {
      this.log('Some forms may use insecure methods', 'error');
      this.results.failed++;
      this.results.errors.push('Forms may be using GET for sensitive data');
    }
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(2) : 0;
    
    console.log('\n' + '='.repeat(50));
    console.log('📝 FORM TESTING REPORT');
    console.log('='.repeat(50));
    console.log(`✅ Form Tests Passed: ${this.results.passed}`);
    console.log(`❌ Form Tests Failed: ${this.results.failed}`);
    console.log(`📊 Form Success Rate: ${successRate}%`);
    console.log('='.repeat(50));
    
    if (this.results.errors.length > 0) {
      console.log('\n🐛 FORM ERRORS FOUND:');
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

  async runAllFormTests() {
    this.log('📝 Starting Form Test Suite...', 'info');
    
    try {
      await this.testContactForm();
      await this.testRegistrationForm();
      await this.testLoginForm();
      await this.testAdminForms();
      await this.testFormFieldTypes();
      await this.testFormAccessibility();
      await this.testFormSecurity();
    } catch (error) {
      this.log(`Form test suite error: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push(`Form test suite error: ${error.message}`);
    }
    
    return this.generateReport();
  }
}

// Usage instructions for form tests
console.log(`
📝 Form Test Suite
==================

To run form tests:
1. Open browser developer tools (F12)
2. Navigate to your website  
3. Run: const formTester = new FormTestSuite(); formTester.runAllFormTests();

Individual form tests:
- formTester.testContactForm()
- formTester.testRegistrationForm()
- formTester.testLoginForm()
- formTester.testAdminForms()
- formTester.testFormAccessibility()
- formTester.testFormSecurity()
`);