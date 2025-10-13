
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { getClassRegistrations } from "@/app/actions/user-actions";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteClassRegistration } from "@/app/actions/user-actions";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { useLanguage } from "@/context/language-context";

type Registration = Awaited<ReturnType<typeof getClassRegistrations>>[0];

interface RegistrationsDataTableProps {
  data: Registration[];
}

const tableContent = {
    en: {
        student: "Student",
        class: "Class",
        phone: "Phone",
        level: "Level",
        goal: "Goal",
        date: "Date",
        actions: "Actions",
        delete: "Delete Registration",
        detailsTitle: "Registration Details",
        name: "Name",
        email: "Email",
        motivation: "Motivation",
        noMotivation: "No motivation provided.",
        generateEmail: "Generate Welcome Email",
    },
    de: {
        student: "Student",
        class: "Klasse",
        phone: "Telefon",
        level: "Niveau",
        goal: "Ziel",
        date: "Datum",
        actions: "Aktionen",
        delete: "Anmeldung löschen",
        detailsTitle: "Anmeldedetails",
        name: "Name",
        email: "Email",
        motivation: "Motivation",
        noMotivation: "Keine Motivation angegeben.",
        generateEmail: "Willkommens-E-Mail generieren",
    },
    fa: {
        student: "دانشجو",
        class: "کلاس",
        phone: "تلفن",
        level: "سطح",
        goal: "هدف",
        date: "تاریخ",
        actions: "عملیات",
        delete: "حذف ثبت‌نام",
        detailsTitle: "جزئیات ثبت‌نام",
        name: "نام",
        email: "ایمیل",
        motivation: "انگیزه",
        noMotivation: "انگیزه‌ای ارائه نشده است.",
        generateEmail: "ایمیل خوش آمدگویی",
    }
}

export function RegistrationsDataTable({ data }: RegistrationsDataTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const content = tableContent[language];
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  
  const handleDelete = async (id: string) => {
    const result = await deleteClassRegistration(id);
    if (result.success) {
      toast({ title: "Registration deleted" });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };
  

  return (
    <>
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{content.student}</TableHead>
              <TableHead className="hidden sm:table-cell">{content.phone}</TableHead>
              <TableHead>{content.class}</TableHead>
              <TableHead className="hidden md:table-cell">{content.level}</TableHead>
              <TableHead className="hidden lg:table-cell">{content.goal}</TableHead>
              <TableHead className="w-[150px] text-right">{content.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((reg) => (
              <TableRow key={reg.id} onClick={() => setSelectedRegistration(reg)} className="cursor-pointer">
                <TableCell>
                  <div className="font-medium">{reg.name}</div>
                  <div className="text-xs text-muted-foreground">{reg.email}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{reg.phone}</TableCell>
                <TableCell>
                  <Link href={`/classes/${reg.classSlug}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline" className="hover:bg-accent">{reg.className}</Badge>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">{reg.germanLevel || 'N/A'}</TableCell>
                <TableCell className="hidden lg:table-cell truncate max-w-[200px]">{reg.learningGoal || 'N/A'}</TableCell>
                <TableCell className="text-right space-x-1">
                   <DeleteConfirmationDialog onConfirm={() => handleDelete(reg.id)}>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{content.delete}</span>
                      </Button>
                    </DeleteConfirmationDialog>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No registrations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

     <Dialog open={!!selectedRegistration} onOpenChange={(isOpen) => !isOpen && setSelectedRegistration(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{content.detailsTitle}</DialogTitle>
            <DialogDescription>
              {selectedRegistration?.className}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid gap-4">
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">{content.name}</span>
                <span>{selectedRegistration?.name}</span>
            </div>
             <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">{content.email}</span>
                <span>{selectedRegistration?.email}</span>
            </div>
             <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">{content.phone}</span>
                <span>{selectedRegistration?.phone || 'N/A'}</span>
            </div>
             <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">{content.level}</span>
                <span>{selectedRegistration?.germanLevel || 'N/A'}</span>
            </div>
             <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">{content.goal}</span>
                <span>{selectedRegistration?.learningGoal || 'N/A'}</span>
            </div>
             <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                <span className="text-sm font-semibold text-muted-foreground pt-1">{content.motivation}</span>
                <p className="text-sm whitespace-pre-wrap">{selectedRegistration?.motivation || content.noMotivation}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </>
  );
}
