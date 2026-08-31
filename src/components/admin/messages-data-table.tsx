
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Trash2 } from "lucide-react";
import type { getContactMessages } from "@/app/actions/user-actions";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import { deleteContactMessage } from "@/app/actions/user-actions";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { getValidLocale } from "@/lib/type-utils";
import type { Language } from "@/lib/types";

type Message = Awaited<ReturnType<typeof getContactMessages>>[0];

const messagesTableContent: Record<Language, {
  sender: string;
  subjectMessage: string;
  date: string;
  actions: string;
  deleteMessage: string;
  noMessages: string;
  from: string;
  deleted: string;
  error: string;
}> = {
  en: {
    sender: "Sender",
    subjectMessage: "Subject & Message",
    date: "Date",
    actions: "Actions",
    deleteMessage: "Delete Message",
    noMessages: "No messages received yet.",
    from: "From",
    deleted: "Message deleted",
    error: "Error",
  },
  de: {
    sender: "Absender",
    subjectMessage: "Betreff & Nachricht",
    date: "Datum",
    actions: "Aktionen",
    deleteMessage: "Nachricht löschen",
    noMessages: "Noch keine Nachrichten eingegangen.",
    from: "Von",
    deleted: "Nachricht gelöscht",
    error: "Fehler",
  },
  fa: {
    sender: "فرستنده",
    subjectMessage: "موضوع و پیام",
    date: "تاریخ",
    actions: "عملیات",
    deleteMessage: "حذف پیام",
    noMessages: "هنوز پیامی دریافت نشده است.",
    from: "از",
    deleted: "پیام حذف شد",
    error: "خطا",
  },
};

interface MessagesDataTableProps {
  data: Message[];
}

export function MessagesDataTable({ data }: MessagesDataTableProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = messagesTableContent[language];

  const handleDelete = async (id: string) => {
    const result = await deleteContactMessage(id);
    if (result.success) {
      toast({ title: t.deleted });
      router.refresh();
    } else {
      toast({
        title: t.error,
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
                <TableHead className="w-[200px]">{t.sender}</TableHead>
                <TableHead>{t.subjectMessage}</TableHead>
                <TableHead className="w-[180px]">{t.date}</TableHead>
                <TableHead className="w-[100px] text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="w-[200px]">
                    <div className="font-medium">{message.name}</div>
                    <div className="text-xs text-muted-foreground">{message.email}</div>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedMessage(message)}
                      className="w-full text-start rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="font-medium hover:text-primary">{message.subject}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xl">{message.message}</p>
                      <span className="sr-only">{t.actions}</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(message.submittedAt), "PPP p", { locale: getValidLocale(language) })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteConfirmationDialog onConfirm={() => handleDelete(message.id)}>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t.deleteMessage}</span>
                      </Button>
                    </DeleteConfirmationDialog>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    {t.noMessages}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedMessage} onOpenChange={(isOpen) => !isOpen && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              {t.from}: {selectedMessage?.name} ({selectedMessage?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 whitespace-pre-wrap text-sm">
            {selectedMessage?.message}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
