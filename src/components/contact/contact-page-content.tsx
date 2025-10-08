
"use client";

import { useLanguage } from "@/context/language-context";
import { Mail, Phone, MapPin, Linkedin, Send } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { Metadata } from '@/components/layout/metadata';
import type { ContactContent } from "@/lib/types";

export function ContactPageContent({ contactContent }: { contactContent: ContactContent }) {
  const { language } = useLanguage();
  const content = contactContent;

  return (
    <>
    <Metadata contactContent={content} pageType="contact" pagePath="/contact" />
    <div className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            {content.title[language]}
          </h1>
          <p className="mt-4 mx-auto max-w-3xl text-lg text-muted-foreground">
            {content.description[language]}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-8 rounded-lg bg-card p-8 shadow-lg">
            <h2 className="font-headline text-2xl font-bold">{content.contactInfo[language]}</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <a href={`mailto:${content.email}`} className="font-semibold hover:underline">{content.email}</a>
                </div>
              </div>
               <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Linkedin className="h-6 w-6" />
                </div>
                <div>
                  <a href={content.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">LinkedIn</a>
                </div>
              </div>
               <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Send className="h-6 w-6" />
                </div>
                <div>
                  <a href={content.telegramUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">Telegram</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{content.address[language]}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-lg bg-card p-8 shadow-lg">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
