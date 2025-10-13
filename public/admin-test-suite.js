/**
 * Admin Panel Test Suite
 * Comprehensive testing for all admin functionality
 */

class AdminPanelTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.baseUrl = window.location.origin;
    this.adminCredentials = {
      email: 'admin@example.com',
      password: 'password'
    };
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ADMIN: ${message}`);
  }

  async navigateTo(path) {
    window.location.href = `${this.baseUrl}${path}`;
    await this.wait(1500);
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
        this.results.errors.push(`Missing admin element: ${selector}`);
        return null;
      }
    } catch (error) {
      this.log(`${description} - Error: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push(`Error checking admin ${selector}: ${error.message}`);
      return null;
    }
  }

  async loginToAdmin() {
    this.log('Testing Admin Login...', 'info');
    
    await this.navigateTo('/login');
    
    // Fill login form
    const emailField = document.querySelector('input[name="email"], input[type="email"]');
    const passwordField = document.querySelector('input[name="password"], input[type="password"]');
    const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
    
    if (emailField && passwordField && submitBtn) {
      emailField.value = this.adminCredentials.email;
      passwordField.value = this.adminCredentials.password;
      
      submitBtn.click();
      await this.wait(2000);
      
      // Check if redirected to admin panel
      if (window.location.pathname.includes('/admin')) {
        this.log('Admin login successful', 'success');
        this.results.passed++;
        return true;
      } else {
        this.log('Admin login failed - no redirect', 'error');
        this.results.failed++;
        this.results.errors.push('Admin login failed');
        return false;
      }
    } else {
      this.log('Login form elements not found', 'error');
      this.results.failed++;
      this.results.errors.push('Login form elements missing');
      return false;
    }
  }

  async testAdminDashboard() {
    this.log('Testing Admin Dashboard...', 'info');
    
    await this.navigateTo('/admin');
    
    // Check dashboard elements
    this.checkElement('[data-testid="admin-sidebar"]', 'Admin Sidebar');
    this.checkElement('[data-testid="admin-header"]', 'Admin Header');
    this.checkElement('[data-testid="dashboard-content"]', 'Dashboard Content');
    
    // Check navigation items
    const navItems = [
      { selector: 'a[href="/admin/blog"]', name: 'Blog Management Link' },
      { selector: 'a[href="/admin/classes"]', name: 'Classes Management Link' },
      { selector: 'a[href="/admin/content"]', name: 'Content Management Link' },
      { selector: 'a[href="/admin/registrations"]', name: 'Registrations Link' },
      { selector: 'a[href="/admin/messages"]', name: 'Messages Link' },
      { selector: 'a[href="/admin/settings"]', name: 'Settings Link' }
    ];

    navItems.forEach(item => {
      this.checkElement(item.selector, item.name);
    });

    // Check analytics dashboard if present
    this.checkElement('[data-testid="analytics-dashboard"]', 'Analytics Dashboard');
  }

  async testBlogManagement() {
    this.log('Testing Blog Management...', 'info');
    
    await this.navigateTo('/admin/blog');
    
    // Check blog management page
    this.checkElement('[data-testid="blog-management"]', 'Blog Management Page');
    this.checkElement('[data-testid="create-blog-btn"]', 'Create Blog Button');
    this.checkElement('[data-testid="blog-posts-table"]', 'Blog Posts Table');
    
    // Test create new blog post
    const createBtn = document.querySelector('[data-testid="create-blog-btn"], a[href*="/admin/blog/new"]');
    if (createBtn) {
      createBtn.click();
      await this.wait(1500);
      
      // Check if new blog form loads
      this.checkElement('input[name="title"]', 'Blog Title Field');
      this.checkElement('textarea[name="content"], [data-testid="content-editor"]', 'Blog Content Field');
      this.checkElement('input[name="slug"]', 'Blog Slug Field');
      this.checkElement('button[type="submit"]', 'Save Blog Button');
    }
  }

  async testClassesManagement() {
    this.log('Testing Classes Management...', 'info');
    
    await this.navigateTo('/admin/classes');
    
    // Check classes management page
    this.checkElement('[data-testid="classes-management"]', 'Classes Management Page');
    this.checkElement('[data-testid="create-class-btn"]', 'Create Class Button');
    this.checkElement('[data-testid="classes-table"]', 'Classes Table');
    
    // Test create new class
    const createBtn = document.querySelector('[data-testid="create-class-btn"], a[href*="/admin/classes/new"]');
    if (createBtn) {
      createBtn.click();
      await this.wait(1500);
      
      // Check if new class form loads
      this.checkElement('input[name="title"]', 'Class Title Field');
      this.checkElement('textarea[name="description"]', 'Class Description Field');
      this.checkElement('input[name="price"]', 'Class Price Field');
      this.checkElement('select[name="level"]', 'Class Level Select');
      this.checkElement('button[type="submit"]', 'Save Class Button');
    }
  }

  async testContentManagement() {
    this.log('Testing Content Management...', 'info');
    
    const contentPages = [
      { path: '/admin/content/edit/home', name: 'Home Content' },
      { path: '/admin/content/edit/about', name: 'About Content' },
      { path: '/admin/content/edit/contact', name: 'Contact Content' }
    ];

    for (const page of contentPages) {
      await this.navigateTo(page.path);
      
      this.checkElement('[data-testid="content-editor"]', `${page.name} Editor`);
      this.checkElement('button[type="submit"]', `${page.name} Save Button`);
    }
  }

  async testRegistrationsManagement() {
    this.log('Testing Registrations Management...', 'info');
    
    await this.navigateTo('/admin/registrations');
    
    this.checkElement('[data-testid="registrations-table"]', 'Registrations Table');
    this.checkElement('[data-testid="registrations-filter"]', 'Registrations Filter');
    
    // Check export functionality if present
    this.checkElement('[data-testid="export-registrations"]', 'Export Registrations Button');
  }

  async testMessagesManagement() {
    this.log('Testing Messages Management...', 'info');
    
    await this.navigateTo('/admin/messages');
    
    this.checkElement('[data-testid="messages-table"]', 'Messages Table');
    this.checkElement('[data-testid="messages-filter"]', 'Messages Filter');
    
    // Test message details view
    const firstMessage = document.querySelector('[data-testid="message-row"]');
    if (firstMessage) {
      firstMessage.click();
      await this.wait(1000);
      
      this.checkElement('[data-testid="message-details"]', 'Message Details Modal');
      this.checkElement('[data-testid="reply-message"]', 'Reply Message Button');
    }
  }

  async testSettingsManagement() {
    this.log('Testing Settings Management...', 'info');
    
    await this.navigateTo('/admin/settings');
    
    this.checkElement('[data-testid="general-settings"]', 'General Settings');
    this.checkElement('[data-testid="account-settings"]', 'Account Settings');
    
    // Test account settings
    await this.navigateTo('/admin/settings/account');
    
    this.checkElement('input[name="currentPassword"]', 'Current Password Field');
    this.checkElement('input[name="newPassword"]', 'New Password Field');
    this.checkElement('input[name="confirmPassword"]', 'Confirm Password Field');
    this.checkElement('button[type="submit"]', 'Update Password Button');
  }

  async testFormSubmissions() {
    this.log('Testing Admin Form Submissions...', 'info');
    
    // Test blog creation form submission
    await this.navigateTo('/admin/blog/new');
    
    const titleField = document.querySelector('input[name="title"]');
    const contentField = document.querySelector('textarea[name="content"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (titleField && contentField && submitBtn) {
      titleField.value = 'Test Blog Post ' + Date.now();
      contentField.value = 'This is a test blog post content.';
      
      // Don't actually submit to avoid creating test data
      this.log('Blog form fields working', 'success');
      this.results.passed++;
    } else {
      this.log('Blog form fields not working', 'error');
      this.results.failed++;
      this.results.errors.push('Blog form fields missing');
    }
  }

  async testDataPersistence() {
    this.log('Testing Data Persistence...', 'info');
    
    // Navigate between pages and check if data persists
    await this.navigateTo('/admin/blog');
    const blogCount1 = document.querySelectorAll('[data-testid="blog-row"]').length;
    
    await this.navigateTo('/admin/classes');
    await this.wait(1000);
    
    await this.navigateTo('/admin/blog');
    const blogCount2 = document.querySelectorAll('[data-testid="blog-row"]').length;
    
    if (blogCount1 === blogCount2) {
      this.log('Data persistence working', 'success');
      this.results.passed++;
    } else {
      this.log('Data persistence issue detected', 'error');
      this.results.failed++;
      this.results.errors.push('Data not persisting between page loads');
    }
  }

  async testAdminSecurity() {
    this.log('Testing Admin Security...', 'info');
    
    // Test logout functionality
    const logoutBtn = document.querySelector('[data-testid="logout-btn"], button[onclick*="logout"]');
    if (logoutBtn) {
      // Don't actually logout during testing
      this.log('Logout button found', 'success');
      this.results.passed++;
    } else {
      this.log('Logout button not found', 'error');
      this.results.failed++;
      this.results.errors.push('Logout functionality missing');
    }

    // Check if protected routes require authentication
    // This would need to be tested in a separate session
  }

  async testResponsiveAdminDesign() {
    this.log('Testing Responsive Admin Design...', 'info');
    
    // Check if mobile menu exists for admin panel
    this.checkElement('[data-testid="mobile-admin-menu"]', 'Mobile Admin Menu');
    
    // Check if sidebar collapses on smaller screens
    this.checkElement('[data-testid="sidebar-toggle"]', 'Sidebar Toggle Button');
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(2) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('🔐 ADMIN PANEL TEST REPORT');
    console.log('='.repeat(60));
    console.log(`✅ Admin Tests Passed: ${this.results.passed}`);
    console.log(`❌ Admin Tests Failed: ${this.results.failed}`);
    console.log(`📊 Admin Success Rate: ${successRate}%`);
    console.log('='.repeat(60));
    
    if (this.results.errors.length > 0) {
      console.log('\n🐛 ADMIN ERRORS FOUND:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
      passed: this.results.passed,
      failed: this.results.failed,
      successRate: successRate,
      errors: this.results.errors
    };
  }

  async runAllAdminTests() {
    this.log('🔐 Starting Admin Panel Test Suite...', 'info');
    
    try {
      // Login first
      const loginSuccess = await this.loginToAdmin();
      
      if (loginSuccess) {
        await this.testAdminDashboard();
        await this.testBlogManagement();
        await this.testClassesManagement();
        await this.testContentManagement();
        await this.testRegistrationsManagement();
        await this.testMessagesManagement();
        await this.testSettingsManagement();
        await this.testFormSubmissions();
        await this.testDataPersistence();
        await this.testAdminSecurity();
        await this.testResponsiveAdminDesign();
      } else {
        this.log('Skipping admin tests due to login failure', 'error');
      }
    } catch (error) {
      this.log(`Admin test suite error: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push(`Admin test suite error: ${error.message}`);
    }
    
    return this.generateReport();
  }
}

// Usage instructions for admin tests
console.log(`
🔐 Admin Panel Test Suite
========================

To run admin tests:
1. Make sure you're not logged in as admin
2. Open browser developer tools (F12)
3. Run: const adminTester = new AdminPanelTestSuite(); adminTester.runAllAdminTests();

Admin Credentials:
- Email: admin@example.com
- Password: password

Individual admin tests:
- adminTester.testAdminDashboard()
- adminTester.testBlogManagement()
- adminTester.testClassesManagement()
- adminTester.testContentManagement()
- etc.
`);