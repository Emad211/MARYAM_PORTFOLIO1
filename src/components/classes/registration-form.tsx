
"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { saveClassRegistration } from "@/app/actions/user-actions";
import type { Class, Language } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

const formContent = {
  en: {
    title: "Register Now",
    // Step 1
    nameLabel: "Full Name",
    namePlaceholder: "Your Name",
    emailLabel: "Email Address",
    emailPlaceholder: "your.email@example.com",
    phoneLabel: "Phone Number",
    phonePlaceholder: "e.g., +1 234 567 8900",
    nextButton: "Next",
    // Step 2
    detailsTitle: "A Little More About You",
    levelLabel: "What is your current German level?",
    goalLabel: "What is your main goal for learning German?",
    goalOptions: {
      university: "University / Study",
      work: "Work / Career",
      travel: "Travel / Culture",
      personal: "Personal Interest",
    },
    motivationLabel: "Tell us a bit about your motivation (optional)",
    motivationPlaceholder: "e.g., I want to prepare for the TestDaF exam...",
    submitButton: "Complete Registration",
    backButton: "Back",
    // Toasts
    successTitle: "Registration Successful!",
    successDescription: "To follow up on your registration, please send your name to our Telegram.",
    errorTitle: "Registration Failed",
    errorDescription: "Something went wrong. Please try again.",
  },
  de: {
    title: "Jetzt anmelden",
    nameLabel: "Vollständiger Name",
    namePlaceholder: "Ihr Name",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "ihre.email@example.com",
    phoneLabel: "Telefonnummer",
    phonePlaceholder: "z.B. +49 123 4567890",
    nextButton: "Weiter",
    detailsTitle: "Ein wenig mehr über Sie",
    levelLabel: "Was ist Ihr aktuelles Deutschniveau?",
    goalLabel: "Was ist Ihr Hauptziel beim Deutschlernen?",
    goalOptions: {
      university: "Universität / Studium",
      work: "Arbeit / Karriere",
      travel: "Reisen / Kultur",
      personal: "Persönliches Interesse",
    },
    motivationLabel: "Erzählen Sie uns etwas über Ihre Motivation (optional)",
    motivationPlaceholder: "z.B. Ich möchte mich auf die TestDaF-Prüfung vorbereiten...",
    submitButton: "Registrierung abschließen",
    backButton: "Zurück",
    successTitle: "Anmeldung erfolgreich!",
    successDescription: "Um Ihre Anmeldung weiterzuverfolgen, senden Sie bitte Ihren Namen an unser Telegram.",
    errorTitle: "Anmeldung fehlgeschlagen",
    errorDescription: "Etwas ist schiefgegangen. Bitte versuchen Sie es erneut.",
  },
  fa: {
    title: "همین حالا ثبت‌نام کنید",
    nameLabel: "نام کامل",
    namePlaceholder: "نام شما",
    emailLabel: "آدرس ایمیل",
    emailPlaceholder: "your.email@example.com",
    phoneLabel: "شماره تلفن",
    phonePlaceholder: "مثلا: ۰۹۱۲۳۴۵۶۷۸۹",
    nextButton: "مرحله بعد",
    detailsTitle: "کمی بیشتر درباره شما",
    levelLabel: "سطح فعلی زبان آلمانی شما چیست؟",
    goalLabel: "هدف اصلی شما از یادگیری زبان آلمانی چیست؟",
    goalOptions: {
      university: "دانشگاه / تحصیل",
      work: "شغل / حرفه",
      travel: "سفر / فرهنگ",
      personal: "علاقه شخصی",
    },
    motivationLabel: "کمی درباره انگیزه‌تان برای ما بنویسید (اختیاری)",
    motivationPlaceholder: "مثلا: می‌خواهم برای آزمون TestDaF آماده شوم...",
    submitButton: "تکمیل ثبت‌نام",
    backButton: "بازگشت",
    successTitle: "ثبت‌نام موفقیت‌آمیز بود!",
    successDescription: "لطفا برای پیگیری ثبت‌نام، نام خود را به تلگرام ما ارسال کنید.",
    errorTitle: "ثبت‌نام ناموفق بود",
    errorDescription: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
  },
};

const FormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(5, { message: "Please enter a valid phone number." }),
  germanLevel: z.string({ required_error: "Please select your level." }),
  learningGoal: z.string({ required_error: "Please select a goal." }),
  motivation: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export function RegistrationForm({ classInfo }: { classInfo: Class }) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const content = formContent[language];
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      motivation: "",
    },
  });

  const handleNext = async () => {
    const isStep1Valid = await form.trigger(["name", "email", "phone"]);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  async function onSubmit(data: FormData) {
    const registrationData = {
      ...data,
      className: classInfo.title[language as Language],
      classSlug: classInfo.slug,
    };

    const result = await saveClassRegistration(registrationData);
    
    if (result.success) {
      toast({
        title: content.successTitle,
        description: content.successDescription,
      });
      form.reset();
      setStep(1);
    } else {
        toast({
            variant: "destructive",
            title: content.errorTitle,
            description: content.errorDescription,
        })
    }
  }
  
  const stepVariants = {
    hidden: { opacity: 0, x: 50, position: 'absolute' as 'absolute' },
    visible: { opacity: 1, x: 0, position: 'relative' as 'relative' },
    exit: { opacity: 0, x: -50, position: 'absolute' as 'absolute' },
  };

  return (
    <div className="space-y-4">
      <h3 className="font-headline text-2xl font-bold">{content.title}</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative overflow-hidden">
             <AnimatePresence mode="wait" initial={false}>
                 {step === 1 && (
                    <motion.div
                        key="step1"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={stepVariants}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                          <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem className="min-h-[90px]">
                                    <FormLabel>{content.nameLabel}</FormLabel>
                                    <FormControl>
                                      <Input placeholder={content.namePlaceholder} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem className="min-h-[90px]">
                                    <FormLabel>{content.emailLabel}</FormLabel>
                                    <FormControl>
                                      <Input placeholder={content.emailPlaceholder} type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem className="min-h-[90px]">
                                    <FormLabel>{content.phoneLabel}</FormLabel>
                                    <FormControl>
                                      <Input placeholder={content.phonePlaceholder} type="tel" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="button" onClick={handleNext} className="w-full">
                                {content.nextButton}
                              </Button>
                            </div>
                    </motion.div>
                )}
                 {step === 2 && (
                     <motion.div
                        key="step2"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={stepVariants}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                         <div className="space-y-6">
                            <h4 className="font-semibold text-center">{content.detailsTitle}</h4>
                          <FormField
                            control={form.control}
                            name="germanLevel"
                            render={({ field }) => (
                              <FormItem className="space-y-3 min-h-[90px]">
                                <FormLabel>{content.levelLabel}</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-2 gap-4"
                                  >
                                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                                      <FormItem key={level} className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value={level} />
                                        </FormControl>
                                        <FormLabel className="font-normal">{level}</FormLabel>
                                      </FormItem>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="learningGoal"
                            render={({ field }) => (
                              <FormItem className="space-y-3 min-h-[90px]">
                                <FormLabel>{content.goalLabel}</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    {Object.entries(content.goalOptions).map(([key, value]) => (
                                       <FormItem key={key} className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value={value} /></FormControl>
                                        <FormLabel className="font-normal">{value}</FormLabel>
                                      </FormItem>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                 <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                                control={form.control}
                                name="motivation"
                                render={({ field }) => (
                                  <FormItem className="min-h-[90px]">
                                    <FormLabel>{content.motivationLabel}</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder={content.motivationPlaceholder} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                            />
                          <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                              {content.backButton}
                            </Button>
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                              {form.formState.isSubmitting ? "..." : content.submitButton}
                            </Button>
                          </div>
                        </div>
                    </motion.div>
                 )}
            </AnimatePresence>
        </form>
      </Form>
    </div>
  );
}
