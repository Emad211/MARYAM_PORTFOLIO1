
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { saveContactMessage } from "@/app/actions/user-actions";

const formContent = {
  en: {
    title: "Send a Message",
    nameLabel: "Your Name",
    namePlaceholder: "John Doe",
    emailLabel: "Your Email",
    emailPlaceholder: "john@example.com",
    subjectLabel: "Subject",
    subjectPlaceholder: "Question about a course",
    messageLabel: "Your Message",
    messagePlaceholder: "Type your message here...",
    submitButton: "Send Message",
    successTitle: "Message Sent!",
    successDescription: "Thank you for your message. I'll get back to you soon.",
    errorTitle: "Sending Failed",
    errorDescription: "Something went wrong. Please try again.",
    errName: "Name must be at least 2 characters.",
    errEmail: "Please enter a valid email address.",
    errSubject: "Subject must be at least 5 characters.",
    errMessage: "Message must be at least 10 characters.",
  },
  de: {
    title: "Nachricht senden",
    nameLabel: "Ihr Name",
    namePlaceholder: "Max Mustermann",
    emailLabel: "Ihre E-Mail",
    emailPlaceholder: "max@example.com",
    subjectLabel: "Betreff",
    subjectPlaceholder: "Frage zu einem Kurs",
    messageLabel: "Ihre Nachricht",
    messagePlaceholder: "Geben Sie hier Ihre Nachricht ein...",
    submitButton: "Nachricht senden",
    successTitle: "Nachricht gesendet!",
    successDescription: "Vielen Dank für Ihre Nachricht. Ich melde mich bald bei Ihnen.",
    errorTitle: "Senden fehlgeschlagen",
    errorDescription: "Etwas ist schiefgegangen. Bitte versuchen Sie es erneut.",
    errName: "Der Name muss mindestens 2 Zeichen lang sein.",
    errEmail: "Bitte geben Sie eine gueltige E-Mail-Adresse ein.",
    errSubject: "Der Betreff muss mindestens 5 Zeichen lang sein.",
    errMessage: "Die Nachricht muss mindestens 10 Zeichen lang sein.",
  },
  fa: {
    title: "ارسال پیام",
    nameLabel: "نام شما",
    namePlaceholder: "مثلا علی رضایی",
    emailLabel: "ایمیل شما",
    emailPlaceholder: "ali@example.com",
    subjectLabel: "موضوع",
    subjectPlaceholder: "سوال در مورد یک دوره",
    messageLabel: "پیام شما",
    messagePlaceholder: "پیام خود را اینجا بنویسید...",
    submitButton: "ارسال پیام",
    successTitle: "پیام ارسال شد!",
    successDescription: "از پیام شما متشکرم. به زودی با شما تماس خواهم گرفت.",
    errorTitle: "ارسال ناموفق بود",
    errorDescription: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
    errName: "نام باید حداقل ۲ نویسه باشد.",
    errEmail: "لطفاً یک ایمیل معتبر وارد کنید.",
    errSubject: "موضوع باید حداقل ۵ نویسه باشد.",
    errMessage: "پیام باید حداقل ۱۰ نویسه باشد.",
  },
};

const makeFormSchema = (m: { errName: string; errEmail: string; errSubject: string; errMessage: string }) =>
  z.object({
    name: z.string().min(2, { message: m.errName }),
    email: z.string().email({ message: m.errEmail }),
    subject: z.string().min(5, { message: m.errSubject }),
    message: z.string().min(10, { message: m.errMessage }),
  });

type ContactFormValues = z.infer<ReturnType<typeof makeFormSchema>>;

export function ContactForm() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const content = formContent[language];

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(makeFormSchema(content)),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    const result = await saveContactMessage(data);
    
    if (result.success) {
      toast({
        title: content.successTitle,
        description: content.successDescription,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: content.errorTitle,
        description: content.errorDescription,
      });
    }
  }

  return (
    <div className="space-y-4">
       <h2 className="font-headline text-2xl font-bold">{content.title}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{content.nameLabel}</FormLabel>
                  <FormControl><Input placeholder={content.namePlaceholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{content.emailLabel}</FormLabel>
                  <FormControl><Input placeholder={content.emailPlaceholder} type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{content.subjectLabel}</FormLabel>
                <FormControl><Input placeholder={content.subjectPlaceholder} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{content.messageLabel}</FormLabel>
                <FormControl><Textarea placeholder={content.messagePlaceholder} className="min-h-[120px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending..." : content.submitButton}
          </Button>
        </form>
      </Form>
    </div>
  );
}
