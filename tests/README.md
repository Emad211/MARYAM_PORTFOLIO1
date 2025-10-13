# 🧪 LinguaSage Testing Suite

مجموعه کاملی از تست‌های دقیق برای اطمینان از عملکرد صحیح تمام امکانات سایت LinguaSage.

## 📋 فایل‌های تست

### 1. **Manual Test Checklist** (`manual-test-checklist.md`)
- چک‌لیست کامل برای تست دستی
- شامل تمام صفحات و عملکردها
- مناسب برای تست‌های دقیق و جزئی

### 2. **Automated Test Suite** (`automated-test-suite.js`)
- تست‌های خودکار جاوااسکریپت
- تست تمام صفحات اصلی
- بررسی عملکرد navigation، theme، و زبان

### 3. **Admin Panel Test Suite** (`admin-test-suite.js`)
- تست مخصوص پنل ادمین
- شامل تست login، CMS، و مدیریت محتوا
- بررسی امنیت و دسترسی‌ها

### 4. **Form Test Suite** (`form-test-suite.js`)
- تست تمام فرم‌های سایت
- بررسی validation و security
- تست accessibility فرم‌ها

## 🚀 نحوه اجرای تست‌ها

### تست‌های خودکار

#### 1. تست کلی سایت:
```javascript
// در Developer Tools Console:
const tester = new LinguaSageTestSuite();
tester.runAllTests();
```

#### 2. تست پنل ادمین:
```javascript
// در Developer Tools Console:
const adminTester = new AdminPanelTestSuite();
adminTester.runAllAdminTests();
```

#### 3. تست فرم‌ها:
```javascript
// در Developer Tools Console:
const formTester = new FormTestSuite();
formTester.runAllFormTests();
```

#### 4. تست‌های جداگانه:
```javascript
// تست تک تک بخش‌ها:
tester.testHomepage();
tester.testNavigation();
tester.testBlogSection();
adminTester.testBlogManagement();
formTester.testContactForm();
```

### تست دستی

1. **آماده‌سازی:**
   - سرور را اجرا کنید: `npm run dev`
   - مرورگر را در حالت developer tools باز کنید
   - فایل `manual-test-checklist.md` را باز کنید

2. **اجرای تست:**
   - به ترتیب هر بخش را تست کنید
   - موارد تکمیل شده را علامت بزنید
   - مشکلات را در بخش "Issues Found" ثبت کنید

## 🎯 بخش‌های تست

### 🏠 صفحه اصلی
- [ ] Hero section و navigation
- [ ] Language switcher (فارسی/آلمانی/انگلیسی)
- [ ] Theme toggle (تیره/روشن)
- [ ] Responsive design

### ℹ️ صفحه درباره ما
- [ ] محتوای About
- [ ] Timeline component
- [ ] اطلاعات مدرس

### 📚 بخش وبلاگ
- [ ] لیست پست‌ها
- [ ] صفحه تک پست
- [ ] Navigation بین پست‌ها

### 🎓 بخش کلاس‌ها
- [ ] لیست کلاس‌ها
- [ ] جزئیات کلاس
- [ ] فرم ثبت‌نام

### 📞 تماس با ما
- [ ] فرم تماس
- [ ] Validation فیلدها
- [ ] ارسال پیام

### 🔐 سیستم احراز هویت
- [ ] صفحه ورود
- [ ] Authentication
- [ ] Protected routes

### ⚙️ پنل ادمین
- [ ] Dashboard
- [ ] مدیریت محتوا (CMS)
- [ ] مدیریت وبلاگ
- [ ] مدیریت کلاس‌ها
- [ ] مشاهده پیام‌ها و ثبت‌نام‌ها
- [ ] تنظیمات

## 🌐 تست چندزبانه

### فارسی (RTL)
- [ ] جهت متن راست به چپ
- [ ] Navigation mirror شده
- [ ] محتوای فارسی

### آلمانی
- [ ] محتوای آلمانی
- [ ] نمایش صحیح Umlauts

### انگلیسی
- [ ] محتوای انگلیسی
- [ ] Fallback language

## 📱 تست Responsive

### موبایل (320px-768px)
- [ ] Hamburger menu
- [ ] Touch targets
- [ ] محتوا stack شده

### تبلت (768px-1024px)
- [ ] Layout تطبیقی
- [ ] Navigation کاربردی

### دسکتاپ (1024px+)
- [ ] Layout کامل
- [ ] Hover states
- [ ] Keyboard navigation

## 🎨 تست Theme

### تم تیره
- [ ] رنگ‌های تیره
- [ ] Contrast مناسب
- [ ] Icons سازگار

### تم روشن
- [ ] رنگ‌های روشن
- [ ] خوانایی متن
- [ ] Consistent colors

## 🔒 تست امنیت

### Authentication
- [ ] Protected routes
- [ ] Session management
- [ ] Password requirements

### Forms
- [ ] Input sanitization
- [ ] CSRF protection
- [ ] File upload security

## 🚦 معیارهای موفقیت

### ✅ **عالی** (90-100%)
- تمام امکانات کار می‌کند
- هیچ مشکل جدی وجود ندارد
- Performance مطلوب

### ⚠️ **نیاز به بهبود** (70-89%)
- اکثر امکانات کار می‌کند
- مشکلات جزئی وجود دارد
- Performance قابل قبول

### ❌ **نیاز به رفع مشکل** (<70%)
- مشکلات جدی وجود دارد
- امکانات اصلی کار نمی‌کند
- Performance ضعیف

## 📊 گزارش نتایج

### نمونه گزارش:
```
🧪 LinguaSage Test Results
==========================
✅ Tests Passed: 45
❌ Tests Failed: 3
📊 Success Rate: 93.75%

🐛 Issues Found:
1. Mobile menu not closing automatically
2. Email validation message in wrong language
3. Blog pagination not working

📝 Recommendations:
- Fix mobile menu JavaScript
- Add multilingual validation messages
- Implement blog pagination logic
```

## 🛠️ رفع مشکلات رایج

### مشکل: تست‌ها اجرا نمی‌شوند
**راه‌حل:** 
- Developer Tools را باز کنید
- Console tab را انتخاب کنید
- اطمینان حاصل کنید که در صفحه درست هستید

### مشکل: Admin login کار نمی‌کند
**راه‌حل:**
- بررسی کنید credentials درست باشد:
  - Email: `admin@example.com`
  - Password: `password`
- فایل `.env.local` را بررسی کنید

### مشکل: فرم‌ها submit نمی‌شوند
**راه‌حل:**
- Network tab را در Developer Tools چک کنید
- Console errors را بررسی کنید
- Server اجرا شده باشد

## 📞 پشتیبانی

برای مشکلات تست:
1. ابتدا Console errors را بررسی کنید
2. Network requests را چک کنید
3. سرور در حال اجرا باشد
4. Browser cache را پاک کنید

## 🔄 به‌روزرسانی تست‌ها

هنگام اضافه کردن امکانات جدید:
1. Manual checklist را به‌روز کنید
2. Automated tests را گسترش دهید
3. Test cases جدید اضافه کنید
4. Documentation را به‌روز کنید

---

**تاریخ آخرین به‌روزرسانی:** اکتبر 2025  
**نسخه:** 1.0.0  
**سازگاری:** Next.js 15.3.3