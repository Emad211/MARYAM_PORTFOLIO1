
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import type { Class, ClassLevel, ClassType } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteClass } from "@/app/actions/content-actions";

const classAdminContent = {
  en: {
    title: "Manage Classes",
    description: "Here you can create, edit, and manage your course offerings.",
    newClass: "New Class",
    classTitle: "Class Title",
    type: "Type",
    level: "Level",
    schedule: "Schedule",
    status: "Status",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    active: "Active",
    full: "Full",
    inactive: "Inactive",
    allTypes: "All Types",
    allLevels: "All Levels",
    deleteTitle: "Are you sure you want to delete this class?",
    deleteDescription: "This action cannot be undone. This will permanently delete the class.",
    deleteSuccess: "Class deleted successfully.",
    deleteError: "Failed to delete class.",
  },
  de: {
    title: "Kurse verwalten",
    description: "Hier können Sie Ihre Kursangebote erstellen, bearbeiten und verwalten.",
    newClass: "Neuer Kurs",
    classTitle: "Kurstitel",
    type: "Typ",
    level: "Niveau",
    schedule: "Zeitplan",
    status: "Status",
    actions: "Aktionen",
    edit: "Bearbeiten",
    delete: "Löschen",
    active: "Aktiv",
    full: "Voll",
    inactive: "Inaktiv",
    allTypes: "Alle Typen",
    allLevels: "Alle Niveaus",
    deleteTitle: "Möchten Sie diesen Kurs wirklich löschen?",
    deleteDescription: "Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Kurs dauerhaft gelöscht.",
    deleteSuccess: "Kurs erfolgreich gelöscht.",
    deleteError: "Fehler beim Löschen des Kurses.",
  },
  fa: {
    title: "مدیریت کلاس‌ها",
    description: "در اینجا می‌توانید پیشنهادات دوره خود را ایجاد، ویرایش و مدیریت کنید.",
    newClass: "کلاس جدید",
    classTitle: "عنوان کلاس",
    type: "نوع",
    level: "سطح",
    schedule: "برنامه",
    status: "وضعیت",
    actions: "عملیات",
    edit: "ویرایش",
    delete: "حذف",
    active: "فعال",
    full: "پر",
    inactive: "غیرفعال",
    allTypes: "همه انواع",
    allLevels: "همه سطوح",
    deleteTitle: "آیا از حذف این کلاس مطمئن هستید؟",
    deleteDescription: "این عمل قابل بازگشت نیست. این کار کلاس را برای همیشه حذف خواهد کرد.",
    deleteSuccess: "کلاس با موفقیت حذف شد.",
    deleteError: "حذف کلاس ناموفق بود.",
  },
};

const statusMap = {
  active: {
    label: (c: any) => c.active,
    variant: "default" as const
  },
  full: {
    label: (c: any) => c.full,
    variant: "destructive" as const
  },
  inactive: {
    label: (c: any) => c.inactive,
    variant: "secondary" as const
  }
}

const levels: ClassLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const classTypes: ClassType[] = ['private', 'group', 'workshop'];

export function AdminClassesPageContent({ classes }: { classes: Class[] }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const content = classAdminContent[language];

  const [activeType, setActiveType] = useState<ClassType | 'all'>('all');
  const [activeLevel, setActiveLevel] = useState<ClassLevel | 'all'>('all');

  const filteredClasses = classes.filter(c => {
    const typeMatch = activeType === 'all' || c.type === activeType;
    const levelMatch = activeLevel === 'all' || c.level === activeLevel;
    return typeMatch && levelMatch;
  });

  const handleDelete = async (slug: string) => {
    const result = await deleteClass(slug);
    if (result.success) {
      toast({ title: content.deleteSuccess });
      router.refresh();
    } else {
      toast({
        title: content.deleteError,
        description: result.message,
        variant: "destructive"
      });
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
            <p className="text-muted-foreground">{content.description}</p>
        </div>
        <Button asChild>
          <Link href="/admin/classes/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            {content.newClass}
          </Link>
        </Button>
      </div>

       <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Select value={activeType} onValueChange={(value) => setActiveType(value as ClassType | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={content.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{content.allTypes}</SelectItem>
                {classTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeLevel} onValueChange={(value) => setActiveLevel(value as ClassLevel | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={content.allLevels} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{content.allLevels}</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{content.classTitle}</TableHead>
                <TableHead className="hidden lg:table-cell">{content.type}</TableHead>
                <TableHead className="hidden sm:table-cell">{content.level}</TableHead>
                <TableHead className="hidden md:table-cell">{content.schedule}</TableHead>
                <TableHead className="hidden sm:table-cell">{content.status}</TableHead>
                <TableHead className="text-right">{content.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((classInfo) => (
                <TableRow key={classInfo.slug}>
                  <TableCell className="font-medium">
                    {classInfo.title[language]}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary">{classInfo.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{classInfo.level.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {`${classInfo.schedule.days[language]} @ ${classInfo.schedule.time}`}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                     <Badge variant={statusMap[classInfo.status].variant}>
                        {statusMap[classInfo.status].label(content)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild className="mr-2">
                      <Link href={`/admin/classes/edit/${classInfo.slug}`}>
                        <Pencil className="mr-0 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">{content.edit}</span>
                      </Link>
                    </Button>
                     <DeleteConfirmationDialog 
                        onConfirm={() => handleDelete(classInfo.slug)}
                        title={content.deleteTitle}
                        description={content.deleteDescription}
                        deleteButtonText={content.delete}
                    >
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{content.delete}</span>
                      </Button>
                    </DeleteConfirmationDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       {filteredClasses.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No classes match the current filters.</p>
          </div>
        )}
    </div>
  );
}
