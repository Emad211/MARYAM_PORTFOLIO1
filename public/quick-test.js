/**
 * Quick Site Test
 * برای بررسی سریع تمام امکانات اصلی
 */

// اجرای تست سریع سایت
async function quickSiteTest() {
    console.log('🚀 شروع تست سریع سایت LinguaSage...');
    
    const results = [];
    
    // تست 1: بررسی عناصر اصلی صفحه
    const checkElement = (selector, name) => {
        const element = document.querySelector(selector);
        const status = element ? '✅' : '❌';
        console.log(`${status} ${name}: ${element ? 'موجود' : 'یافت نشد'}`);
        results.push({name, found: !!element});
        return element;
    };
    
    console.log('\n📋 بررسی عناصر اصلی:');
    checkElement('header', 'Header');
    checkElement('main', 'Main Content');
    checkElement('footer', 'Footer');
    checkElement('nav', 'Navigation');
    
    console.log('\n🔗 بررسی لینک‌های navigation:');
    checkElement('a[href="/"]', 'Home Link');
    checkElement('a[href="/about"]', 'About Link');
    checkElement('a[href="/blog"]', 'Blog Link');
    checkElement('a[href="/classes"]', 'Classes Link');
    checkElement('a[href="/contact"]', 'Contact Link');
    
    console.log('\n🌐 بررسی امکانات خاص:');
    checkElement('[data-testid="language-switcher"]', 'Language Switcher');
    checkElement('[data-testid="theme-toggle"]', 'Theme Toggle');
    
    // تست 2: بررسی کنسول errors
    console.log('\n🐛 بررسی خطاهای کنسول:');
    const originalError = console.error;
    const errors = [];
    console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
    };
    
    setTimeout(() => {
        console.error = originalError;
        if (errors.length === 0) {
            console.log('✅ هیچ خطای کنسولی یافت نشد');
        } else {
            console.log(`❌ ${errors.length} خطای کنسول یافت شد:`);
            errors.forEach((error, i) => console.log(`  ${i+1}. ${error}`));
        }
    }, 2000);
    
    // تست 3: بررسی responsive
    console.log('\n📱 بررسی responsive design:');
    const width = window.innerWidth;
    if (width < 768) {
        console.log('📱 حالت موبایل - بررسی hamburger menu');
        checkElement('[data-testid="mobile-menu"]', 'Mobile Menu');
    } else if (width < 1024) {
        console.log('📲 حالت تبلت');
    } else {
        console.log('💻 حالت دسکتاپ');
    }
    
    // تست 4: بررسی theme
    console.log('\n🎨 بررسی theme:');
    const isDark = document.documentElement.classList.contains('dark');
    console.log(`موضوع فعلی: ${isDark ? 'تیره' : 'روشن'}`);
    
    // تست 5: بررسی زبان
    console.log('\n🌍 بررسی زبان:');
    const currentLang = document.documentElement.lang || 'نامشخص';
    console.log(`زبان فعلی: ${currentLang}`);
    
    // خلاصه نتایج
    const foundCount = results.filter(r => r.found).length;
    const totalCount = results.length;
    const successRate = ((foundCount / totalCount) * 100).toFixed(0);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 خلاصه نتایج تست سریع:');
    console.log(`✅ موارد یافت شده: ${foundCount}/${totalCount}`);
    console.log(`📈 درصد موفقیت: ${successRate}%`);
    console.log('='.repeat(50));
    
    return {
        found: foundCount,
        total: totalCount,
        successRate: parseInt(successRate),
        details: results
    };
}

// اجرای خودکار
console.log(`
🧪 تست سریع سایت LinguaSage
============================

برای اجرای تست سریع:
quickSiteTest()

این تست بررسی می‌کند:
✓ عناصر اصلی صفحه  
✓ لینک‌های navigation
✓ امکانات theme و زبان
✓ خطاهای کنسول
✓ responsive design

`);

// Auto-run for immediate testing
if (window.location.hostname === 'localhost') {
    setTimeout(quickSiteTest, 1000);
}