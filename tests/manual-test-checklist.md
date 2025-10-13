# 🧪 Manual Testing Checklist - LinguaSage Website

## 📋 Pre-Test Setup
- [ ] Server running: `npm run dev`
- [ ] Admin credentials: admin@example.com / password
- [ ] Test in multiple browsers (Chrome, Firefox, Edge)
- [ ] Test responsive design (Mobile, Tablet, Desktop)

---

## 🏠 **Homepage Tests** (`/`)

### Visual & Layout
- [ ] Hero section displays correctly
- [ ] Navigation bar appears with all menu items
- [ ] Language switcher works (فارسی/Deutsch/English)
- [ ] Theme toggle (Dark/Light) functions
- [ ] Footer displays correctly
- [ ] All images load properly
- [ ] Typography and colors match design

### Functionality
- [ ] Click "About" navigates to `/about`
- [ ] Click "Classes" navigates to `/classes`
- [ ] Click "Blog" navigates to `/blog`
- [ ] Click "Contact" navigates to `/contact`
- [ ] Language switching changes content language
- [ ] Theme switching changes appearance
- [ ] Mobile menu opens/closes correctly

### Content
- [ ] German language content displays
- [ ] Persian RTL layout works correctly
- [ ] English content displays
- [ ] All text is readable and properly formatted

---

## ℹ️ **About Page Tests** (`/about`)

### Content Display
- [ ] About content loads (from CMS or fallback)
- [ ] Timeline component displays
- [ ] Teacher information shows
- [ ] Images display correctly
- [ ] Text formatting is proper

### Navigation
- [ ] Breadcrumb navigation works
- [ ] Back to homepage link works
- [ ] Language switching maintains page context

---

## 📚 **Blog Section Tests** (`/blog`)

### Blog List Page
- [ ] Blog posts list displays
- [ ] Each post shows title, excerpt, date
- [ ] Post cards are clickable
- [ ] Pagination works (if multiple posts)
- [ ] Search functionality (if implemented)
- [ ] Categories filter (if implemented)

### Individual Blog Post (`/blog/[slug]`)
- [ ] Blog post content displays fully
- [ ] Images in post load correctly
- [ ] Navigation between posts works
- [ ] Share buttons function (if implemented)
- [ ] Comments section (if implemented)
- [ ] Related posts show (if implemented)

---

## 🎓 **Classes Section Tests** (`/classes`)

### Classes List Page
- [ ] All classes display in grid/list
- [ ] Class cards show: title, description, price, duration
- [ ] Filter by level works (Beginner, Intermediate, Advanced)
- [ ] Search classes functionality
- [ ] Sorting options work

### Individual Class Page (`/classes/[slug]`)
- [ ] Class details display completely
- [ ] Registration form appears
- [ ] Form validation works
- [ ] Form submission succeeds
- [ ] Success/error messages display
- [ ] Class schedule shows correctly

### Registration Form Tests
- [ ] All required fields validated
- [ ] Email format validation
- [ ] Phone number validation
- [ ] Name field validation
- [ ] Level selection works
- [ ] Submit button functions
- [ ] Form reset works
- [ ] Error handling displays properly

---

## 📞 **Contact Page Tests** (`/contact`)

### Contact Form
- [ ] Contact form displays
- [ ] Name field validation
- [ ] Email field validation
- [ ] Subject field validation
- [ ] Message field validation
- [ ] Form submission works
- [ ] Success message displays
- [ ] Error handling works
- [ ] Form reset functions

### Contact Information
- [ ] Contact details display
- [ ] Address information shows
- [ ] Phone/email links work
- [ ] Social media links function
- [ ] Map integration (if implemented)

---

## 🔐 **Authentication Tests** (`/login`)

### Login Page
- [ ] Login form displays correctly
- [ ] Email field validation
- [ ] Password field validation
- [ ] Remember me checkbox
- [ ] Login button functions
- [ ] Error messages for wrong credentials
- [ ] Success redirect to admin panel
- [ ] Forgot password link (if implemented)

### Authentication Flow
- [ ] Valid credentials redirect to `/admin`
- [ ] Invalid credentials show error
- [ ] Already logged in redirects properly
- [ ] Logout functionality works
- [ ] Session persistence works
- [ ] Protected routes redirect to login

---

## ⚙️ **Admin Panel Tests** (`/admin`)

### Admin Dashboard
- [ ] Dashboard displays after login
- [ ] Analytics widgets show data
- [ ] Recent activity displays
- [ ] Navigation sidebar works
- [ ] User profile section
- [ ] Logout button functions

### Content Management
- [ ] All CMS sections accessible:
  - [ ] Home content editing
  - [ ] About content editing  
  - [ ] Contact content editing
  - [ ] Timeline editing

### Blog Management (`/admin/blog`)
- [ ] Blog posts list displays
- [ ] Create new post button works
- [ ] Edit existing posts
- [ ] Delete posts (with confirmation)
- [ ] Post status management (draft/published)
- [ ] Categories management
- [ ] Tags management
- [ ] Image upload functionality

### Classes Management (`/admin/classes`)
- [ ] Classes list displays
- [ ] Create new class works
- [ ] Edit existing classes
- [ ] Delete classes (with confirmation)
- [ ] Class scheduling
- [ ] Price management
- [ ] Level assignment

### User Management
- [ ] Registrations list displays
- [ ] View registration details
- [ ] Export registrations
- [ ] Mark registrations as processed
- [ ] Filter/search registrations
- [ ] Contact form messages display

### Settings (`/admin/settings`)
- [ ] General settings display
- [ ] Account settings work
- [ ] Password change functionality
- [ ] Site configuration options
- [ ] Backup/restore options (if implemented)

---

## 🌐 **Multi-language Tests**

### Language Switching
- [ ] Persian (فارسی) - RTL layout
  - [ ] Text direction right-to-left
  - [ ] Navigation mirrors correctly  
  - [ ] All Persian content displays
  - [ ] Form labels in Persian
  
- [ ] German (Deutsch)
  - [ ] German content displays
  - [ ] Umlauts render correctly
  - [ ] LTR layout proper
  
- [ ] English
  - [ ] English content displays
  - [ ] Default fallback language works

### Content Consistency
- [ ] All pages have translations
- [ ] Navigation items translated
- [ ] Form labels translated
- [ ] Error messages translated
- [ ] Success messages translated

---

## 📱 **Responsive Design Tests**

### Mobile (320px - 768px)
- [ ] Navigation collapses to hamburger menu
- [ ] Content stacks properly
- [ ] Forms are usable on mobile
- [ ] Text remains readable
- [ ] Images scale correctly
- [ ] Touch targets are adequate size

### Tablet (768px - 1024px)
- [ ] Layout adapts appropriately
- [ ] Sidebar navigation works
- [ ] Forms remain usable
- [ ] Content grid adjusts

### Desktop (1024px+)
- [ ] Full layout displays
- [ ] All features accessible
- [ ] Hover states work
- [ ] Keyboard navigation

---

## 🎨 **Theme Tests**

### Dark Theme
- [ ] Dark background colors
- [ ] Light text for contrast
- [ ] Icons adapt to theme
- [ ] Forms maintain usability
- [ ] Buttons remain accessible

### Light Theme  
- [ ] Light background colors
- [ ] Dark text for readability
- [ ] Consistent color scheme
- [ ] Good contrast ratios

### Theme Persistence
- [ ] Theme choice remembers across sessions
- [ ] System preference detection
- [ ] Smooth theme transitions

---

## 🚀 **Performance Tests**

### Loading Speed
- [ ] Homepage loads under 3 seconds
- [ ] Admin pages load reasonably fast
- [ ] Images optimize and load properly
- [ ] No unnecessary JavaScript loading

### SEO & Accessibility
- [ ] Page titles are descriptive
- [ ] Meta descriptions present
- [ ] Alt text on images
- [ ] Heading hierarchy proper (h1, h2, h3...)
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

---

## 💾 **Data Persistence Tests**

### CMS Data
- [ ] Content edits save properly
- [ ] Changes persist after refresh
- [ ] Data backup works
- [ ] Multiple user editing handling

### Form Submissions
- [ ] Contact form data saves
- [ ] Registration data persists
- [ ] Admin can view submissions
- [ ] Export functionality works

---

## 🐛 **Error Handling Tests**

### 404 Error Pages
- [ ] Non-existent pages show 404
- [ ] 404 page is styled properly
- [ ] Navigation back to site works

### Form Errors
- [ ] Required field errors show
- [ ] Invalid format errors display
- [ ] Network error handling
- [ ] Server error messages

### Admin Panel Errors
- [ ] Unauthorized access redirects
- [ ] Invalid data entry errors
- [ ] File upload errors handled
- [ ] Session timeout handling

---

## 🔒 **Security Tests**

### Authentication Security
- [ ] Protected routes require login
- [ ] Session management secure
- [ ] Password requirements enforced
- [ ] XSS prevention measures

### Data Security
- [ ] SQL injection prevention
- [ ] Form input sanitization
- [ ] File upload restrictions
- [ ] Admin privilege checking

---

## ✅ **Final Checklist**

### Pre-Deployment
- [ ] All tests passed
- [ ] No console errors
- [ ] All features working
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Documentation updated

### Deployment Ready
- [ ] Environment variables configured
- [ ] Build process successful
- [ ] Database connections work
- [ ] Third-party integrations functional

---

## 📝 **Test Results Log**

**Date:** ___________  
**Tester:** ___________  
**Browser:** ___________  
**Device:** ___________  

### Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Status: 
- [ ] All tests passed ✅
- [ ] Minor issues found ⚠️
- [ ] Major issues found ❌

**Notes:** ________________________________