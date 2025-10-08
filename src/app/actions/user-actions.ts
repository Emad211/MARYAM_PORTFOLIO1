
'use server';

import { revalidatePath } from 'next/cache';
import { getMessages, saveMessages, getRegistrations, saveRegistrations } from '@/lib/cms-store';
import type { ClassRegistration } from '@/lib/types';

// --- Types ---
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

// --- Contact Messages Actions ---

export async function saveContactMessage(data: Omit<ContactMessage, 'id' | 'submittedAt'>) {
    try {
        const messages = await getMessages();
        const newMessage: ContactMessage = {
            id: new Date().toISOString() + Math.random().toString(36).substr(2, 9),
            ...data,
            submittedAt: new Date().toISOString(),
        };
        messages.unshift(newMessage);
        await saveMessages(messages);

        revalidatePath('/admin/messages');
        return { success: true, message: 'Message sent successfully!' };
    } catch (error) {
        console.error('Failed to save contact message:', error);
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function getContactMessages(): Promise<ContactMessage[]> {
    return await getMessages();
}

export async function deleteContactMessage(id: string) {
    try {
        const messages = await getMessages();
        const updatedMessages = messages.filter(message => message.id !== id);
        await saveMessages(updatedMessages);
        
        revalidatePath('/admin/messages');
        return { success: true, message: 'Message deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete contact message:', error);
        return { success: false, message: 'Failed to delete message.' };
    }
}

// --- Class Registrations Actions ---

export async function saveClassRegistration(data: Omit<ClassRegistration, 'id' | 'submittedAt'>) {
    try {
        const registrations = await getRegistrations();
        const newRegistration: ClassRegistration = {
            id: new Date().toISOString() + Math.random().toString(36).substr(2, 9),
            ...data,
            submittedAt: new Date().toISOString(),
        };
        registrations.unshift(newRegistration);
        await saveRegistrations(registrations);

        revalidatePath('/admin/registrations');
        return { success: true, message: 'Registration successful!' };
    } catch (error) {
        console.error('Failed to save class registration:', error);
        return { success: false, message: 'An unknown error occurred.' };
    }
}

export async function getClassRegistrations(): Promise<ClassRegistration[]> {
    return await getRegistrations();
}

export async function deleteClassRegistration(id: string) {
    try {
        const registrations = await getRegistrations();
        const updatedRegistrations = registrations.filter(reg => reg.id !== id);
        await saveRegistrations(updatedRegistrations);

        revalidatePath('/admin/registrations');
        return { success: true, message: 'Registration deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete class registration:', error);
        return { success: false, message: 'Failed to delete registration.' };
    }
}
