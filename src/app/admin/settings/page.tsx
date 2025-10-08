
"use client";

import { useLanguage } from "@/context/language-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Pencil, UserCog } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { de, faIR } from 'date-fns/locale';

const settingsAdminContent = {
  en: {
    title: "Website Settings",
    description: "Manage your main website pages and general settings.",
    page: "Page",
    status: "Status",
    lastModified: "Last Modified",
    actions: "Actions",
    edit: "Edit",
    published: "Published",
    accountSettings: "Account Settings",
    manageAccount: "Manage your login credentials.",
    contentPages: "Content Pages",
  },
  de: {
    title: "Website-Einstellungen",
    description: "Verwalten Sie Ihre Haupt-Website-Seiten und allgemeinen Einstellungen.",
    page: "Seite",
    status: "Status",
    lastModified: "Zuletzt geändert",
    actions: "Aktionen",
    edit: "Bearbeiten",
    published: "Veröffentlicht",
    accountSettings: "Kontoeinstellungen",
    manageAccount: "Verwalten Sie Ihre Anmeldedaten.",
    contentPages: "Inhaltsseiten",
  },
  fa: {
    title: "تنظیمات وب‌سایت",
    description: "صفحات اصلی وب‌سایت و تنظیمات عمومی خود را مدیریت کنید.",
    page: "صفحه",
    status: "وضعیت",
    lastModified: "آخرین ویرایش",
    actions: "عملیات",
    edit: "ویرایش",
    published: "منتشر شده",
    accountSettings: "تنظیمات حساب کاربری",
    manageAccount: "مدیریت اطلاعات ورود.",
    contentPages: "صفحات محتوا",
  },
};

const pages = [
    { 
        slug: 'home',
        path: '/', 
        title: { en: 'Home Page', de: 'Startseite', fa: 'صفحه اصلی' },
        lastModified: '2024-05-20T10:00:00Z',
        status: 'published'
    },
    { 
        slug: 'about',
        path: '/about',
        title: { en: 'About Page', de: 'Über mich Seite', fa: 'صفحه درباره من' },
        lastModified: '2024-05-18T14:30:00Z',
        status: 'published'
    },
    { 
        slug: 'contact',
        path: '/contact',
        title: { en: 'Contact Page', de: 'Kontaktseite', fa: 'صفحه تماس' },
        lastModified: '2024-05-15T09:15:00Z',
        status: 'published'
    }
]

const locales = { de, fa: faIR, en: undefined };

export default function AdminSettingsPage() {
  const { language } = useLanguage();
  const content = settingsAdminContent[language];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
        <p className="text-muted-foreground">{content.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/admin/settings/account" className="group">
          <Card className="h-full transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{content.accountSettings}</CardTitle>
              <UserCog className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{content.manageAccount}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-4">
          <HardDrive className="h-6 w-6" />
          {content.contentPages}
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{content.page}</TableHead>
                  <TableHead className="hidden sm:table-cell">{content.status}</TableHead>
                  <TableHead className="hidden md:table-cell">{content.lastModified}</TableHead>
                  <TableHead className="text-right">{content.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.slug}>
                    <TableCell className="font-medium">
                      <div>{page.title[language]}</div>
                      <div className="text-xs text-muted-foreground">{page.path}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                        {content.published}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(page.lastModified), "PPP p", { locale: locales[language] })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/content/edit/${page.slug}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {content.edit}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
