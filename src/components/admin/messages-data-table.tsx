
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

type Message = Awaited<ReturnType<typeof getContactMessages>>[0];

interface MessagesDataTableProps {
  data: Message[];
}

export function MessagesDataTable({ data }: MessagesDataTableProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const result = await deleteContactMessage(id);
    if (result.success) {
      toast({ title: "Message deleted" });
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
                <TableHead className="w-[200px]">Sender</TableHead>
                <TableHead>Subject & Message</TableHead>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((message) => (
                <TableRow key={message.id}>
                  <TableCell
                    onClick={() => setSelectedMessage(message)}
                    className="cursor-pointer"
                  >
                    <div className="font-medium">{message.name}</div>
                    <div className="text-xs text-muted-foreground">{message.email}</div>
                  </TableCell>
                  <TableCell
                    onClick={() => setSelectedMessage(message)}
                    className="cursor-pointer"
                  >
                    <p className="font-medium">{message.subject}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">{message.message}</p>
                  </TableCell>
                  <TableCell
                    onClick={() => setSelectedMessage(message)}
                    className="cursor-pointer text-xs text-muted-foreground"
                  >
                    {format(new Date(message.submittedAt), "PPP p")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteConfirmationDialog onConfirm={() => handleDelete(message.id)}>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Message</span>
                      </Button>
                    </DeleteConfirmationDialog>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No messages received yet.
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
              From: {selectedMessage?.name} ({selectedMessage?.email})
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
