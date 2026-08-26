'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

interface ContentShape {
    placeholder: string;
    send: string;
}

const content: Record<'en' | 'de' | 'fa', ContentShape> = {
    en: { placeholder: 'Type your message...', send: 'Send' },
    de: { placeholder: 'Nachricht schreiben...', send: 'Senden' },
    fa: { placeholder: 'پیام خود را بنویسید...', send: 'ارسال' },
};

export function ChatThread({
    messages,
    meId,
    counterpartName,
    onSend,
}: {
    messages: ChatMessage[];
    meId: string;
    counterpartName: string;
    onSend: (body: string) => Promise<{ success: boolean; message: string }>;
}) {
    const { language } = useLanguage();
    const t = content[language];
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [messages.length]);

    return (
        <div className="flex h-[60vh] flex-col rounded-lg border bg-card">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => {
                    const mine = message.senderId === meId;
                    return (
                        <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                            <div
                                className={cn(
                                    'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                                    mine
                                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                                        : 'rounded-bl-sm bg-muted'
                                )}
                            >
                                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                                <p
                                    className={cn(
                                        'mt-1 text-[10px]',
                                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    )}
                                >
                                    {new Date(message.createdAt).toLocaleTimeString(
                                        language === 'fa' ? 'fa-IR' : language,
                                        { hour: '2-digit', minute: '2-digit' }
                                    )}
                                    {mine && message.readAt ? ' ✓✓' : ''}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <form
                className="flex items-end gap-2 border-t p-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('body') as HTMLTextAreaElement;
                    const body = input.value.trim();
                    if (!body || body.length > 4000) return;
                    form.reset();
                    void onSend(body);
                }}
            >
                <Textarea
                    name="body"
                    rows={1}
                    maxLength={4000}
                    placeholder={`${t.placeholder} — ${counterpartName}`}
                    className="min-h-[44px] resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                        }
                    }}
                />
                <Button type="submit" size="sm" className="h-[44px]">
                    {t.send}
                </Button>
            </form>
        </div>
    );
}
