
"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/context/language-context';

interface DeleteConfirmationDialogProps {
  children: React.ReactNode;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelButtonText?: string;
  deleteButtonText?: string;
}

const dialogContent = {
    en: {
        title: "Are you absolutely sure?",
        description: "This action cannot be undone. This will permanently delete the item.",
        cancel: "Cancel",
        delete: "Delete"
    },
    de: {
        title: "Sind Sie sich absolut sicher?",
        description: "Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird das Element dauerhaft gelöscht.",
        cancel: "Abbrechen",
        delete: "Löschen"
    },
    fa: {
        title: "آیا کاملاً مطمئن هستید؟",
        description: "این عمل قابل بازگشت نیست. این کار آیتم را برای همیشه حذف خواهد کرد.",
        cancel: "انصراف",
        delete: "حذف"
    }
}

export function DeleteConfirmationDialog({
  children,
  onConfirm,
  title,
  description,
  cancelButtonText,
  deleteButtonText,
}: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const content = dialogContent[language];

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || content.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelButtonText || content.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {deleteButtonText || content.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
