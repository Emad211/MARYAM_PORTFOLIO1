
"use client";

import { useLanguage } from "@/context/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const pageContent = {
  en: {
    title: "Deploying Your Next.js Application",
    description: "A guide to deploying your application on a server with Apache.",
    introTitle: "Introduction",
    introText: "Next.js is a Node.js application. It cannot be served directly by Apache like a static HTML/PHP site. Instead, you need to run the Next.js app as a background service and use Apache as a 'Reverse Proxy' to forward traffic to it. This guide outlines the steps.",
    step1Title: "Step 1: Build Your Application",
    step1Text: "First, you need to create a production build of your application. Run the following command in your project's terminal:",
    buildCommand: "npm run build",
    step2Title: "Step 2: Run the Application with a Process Manager",
    step2Text: "Your Next.js app needs to run continuously on the server. A process manager like PM2 is recommended for this. It will automatically restart your app if it crashes.",
    installPm2: "npm install pm2 -g",
    startApp: "pm2 start npm --name 'fluentia-app' -- start",
    step2Note: "This command starts your app (which by default runs on port 3000) and gives it the name 'fluentia-app'.",
    step3Title: "Step 3: Configure Apache as a Reverse Proxy",
    step3Text: "Now, you need to tell Apache to forward requests for your domain to the running Next.js application (port 3000). You do this by editing your domain's Apache configuration file (e.g., in /etc/apache2/sites-available/your-domain.com.conf). Add the following VirtualHost configuration.",
    step3Note: "Note: You must have mod_proxy and related modules enabled in Apache. You can enable them with 'a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests'.",
    apacheConfigTitle: "Apache VirtualHost Configuration",
    apacheConfig: `
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    # This is the important part
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
`,
    copy: "Copy",
    copied: "Copied!",
  },
  de: {
    title: "Bereitstellen Ihrer Next.js-Anwendung",
    description: "Eine Anleitung zum Bereitstellen Ihrer Anwendung auf einem Server mit Apache.",
    introTitle: "Einführung",
    introText: "Next.js ist eine Node.js-Anwendung. Sie kann nicht direkt von Apache wie eine statische HTML/PHP-Seite bereitgestellt werden. Stattdessen müssen Sie die Next.js-App als Hintergrunddienst ausführen und Apache als 'Reverse-Proxy' verwenden, um den Datenverkehr an sie weiterzuleiten. Diese Anleitung beschreibt die Schritte.",
    step1Title: "Schritt 1: Erstellen Sie Ihre Anwendung",
    step1Text: "Zuerst müssen Sie einen Produktions-Build Ihrer Anwendung erstellen. Führen Sie den folgenden Befehl im Terminal Ihres Projekts aus:",
    buildCommand: "npm run build",
    step2Title: "Schritt 2: Führen Sie die Anwendung mit einem Prozessmanager aus",
    step2Text: "Ihre Next.js-App muss kontinuierlich auf dem Server laufen. Ein Prozessmanager wie PM2 wird dafür empfohlen. Er startet Ihre App automatisch neu, wenn sie abstürzt.",
    installPm2: "npm install pm2 -g",
    startApp: "pm2 start npm --name 'fluentia-app' -- start",
    step2Note: "Dieser Befehl startet Ihre App (die standardmäßig auf Port 3000 läuft) und gibt ihr den Namen 'fluentia-app'.",
    step3Title: "Schritt 3: Konfigurieren Sie Apache als Reverse-Proxy",
    step3Text: "Jetzt müssen Sie Apache anweisen, Anfragen für Ihre Domain an die laufende Next.js-Anwendung (Port 3000) weiterzuleiten. Dies geschieht durch Bearbeiten der Apache-Konfigurationsdatei Ihrer Domain (z.B. in /etc/apache2/sites-available/ihre-domain.com.conf). Fügen Sie die folgende VirtualHost-Konfiguration hinzu.",
    step3Note: "Hinweis: Sie müssen mod_proxy und zugehörige Module in Apache aktiviert haben. Sie können sie mit 'a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests' aktivieren.",
    apacheConfigTitle: "Apache VirtualHost-Konfiguration",
    apacheConfig: `
<VirtualHost *:80>
    ServerName ihre-domain.com
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    # Dies ist der wichtige Teil
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
`,
    copy: "Kopieren",
    copied: "Kopiert!",
  },
  fa: {
    title: "دیپلوی کردن برنامه Next.js شما",
    description: "راهنمایی برای دیپلوی کردن برنامه شما روی یک سرور با آپاچی.",
    introTitle: "مقدمه",
    introText: "Next.js یک برنامه Node.js است. این برنامه نمی‌تواند مستقیماً توسط آپاچی مانند یک سایت استاتیک HTML/PHP سرویس‌دهی شود. در عوض، شما باید برنامه Next.js را به عنوان یک سرویس پس‌زمینه اجرا کنید و از آپاچی به عنوان یک 'پراکسی معکوس' (Reverse Proxy) برای هدایت ترافیک به آن استفاده کنید. این راهنما مراحل را شرح می‌دهد.",
    step1Title: "مرحله ۱: ساخت برنامه",
    step1Text: "ابتدا، شما باید یک بیلد پروداکشن از برنامه خود ایجاد کنید. دستور زیر را در ترمینال پروژه خود اجرا کنید:",
    buildCommand: "npm run build",
    step2Title: "مرحله ۲: اجرای برنامه با یک مدیر فرآیند (Process Manager)",
    step2Text: "برنامه Next.js شما باید به طور مداوم روی سرور اجرا شود. یک مدیر فرآیند مانند PM2 برای این کار توصیه می‌شود. این برنامه در صورت کرش کردن، به طور خودکار برنامه شما را مجدداً راه‌اندازی می‌کند.",
    installPm2: "npm install pm2 -g",
    startApp: "pm2 start npm --name 'fluentia-app' -- start",
    step2Note: "این دستور برنامه شما را (که به طور پیش‌فرض روی پورت ۳۰۰۰ اجرا می‌شود) راه‌اندازی کرده و به آن نام 'fluentia-app' را می‌دهد.",
    step3Title: "مرحله ۳: پیکربندی آپاچی به عنوان پراکسی معکوس",
    step3Text: "اکنون، شما باید به آپاچی بگویید که درخواست‌های دامنه شما را به برنامه در حال اجرای Next.js (پورت ۳۰۰۰) هدایت کند. این کار را با ویرایش فایل پیکربندی آپاچی دامنه خود (مثلاً در /etc/apache2/sites-available/your-domain.com.conf) انجام می‌دهید. پیکربندی VirtualHost زیر را اضافه کنید.",
    step3Note: "توجه: شما باید ماژول mod_proxy و ماژول‌های مرتبط را در آپاچی فعال کرده باشید. می‌توانید آنها را با دستور 'a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests' فعال کنید.",
    apacheConfigTitle: "پیکربندی VirtualHost آپاچی",
    apacheConfig: `
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    # این بخش مهم است
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
`,
    copy: "کپی",
    copied: "کپی شد!",
  },
};

function CodeBlock({ command }: { command: string }) {
  const { toast } = useToast();
  const content = pageContent.en;

  const handleCopy = () => {
    navigator.clipboard.writeText(command.trim());
    toast({
      title: content.copied,
    });
  };

  return (
    <div className="relative rounded-md bg-muted p-4 font-mono text-sm">
      <pre className="overflow-x-auto"><code>{command.trim()}</code></pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7"
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
        <span className="sr-only">{content.copy}</span>
      </Button>
    </div>
  );
}

export default function DeployPage() {
  const { language } = useLanguage();
  const content = pageContent[language] || pageContent.en;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
        <p className="text-muted-foreground">{content.description}</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{content.introTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{content.introText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{content.step1Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{content.step1Text}</p>
            <CodeBlock command={content.buildCommand} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{content.step2Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{content.step2Text}</p>
            <p className="text-muted-foreground font-semibold">Install PM2 globally:</p>
            <CodeBlock command={content.installPm2} />
            <p className="text-muted-foreground font-semibold">Start your app:</p>
            <CodeBlock command={content.startApp} />
            <p className="text-sm text-muted-foreground">{content.step2Note}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{content.step3Title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{content.step3Text}</p>
             <p className="text-sm text-muted-foreground">{content.step3Note}</p>
            <h4 className="font-semibold">{content.apacheConfigTitle}</h4>
            <CodeBlock command={content.apacheConfig} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
