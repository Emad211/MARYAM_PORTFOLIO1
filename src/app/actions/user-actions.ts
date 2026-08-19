'use server';

import { revalidatePath } from 'next/cache';
import {
    getMessages,
    insertMessage,
    deleteMessage,
    getRegistrations,
    insertRegistration,
    deleteRegistration,
} from '@/lib/cms-store';
import type { ClassRegistration, ContactMessage } from '@/lib/types';

// --- Contact Messages Actions ---

export async function saveContactMessage(data: Omit<ContactMessage, 'id' | 'submittedAt'>) {
    try {
        await insertMessage(data);
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
        await deleteMessage(id);
        revalidatePath('/admin/messages');
        return { success: true, message: 'Message deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete contact message:', error);
        return { success: false, message: 'Failed to delete message.' };
    }
}

// --- Class Registrations Actions (DEPRECATED) ---
//
// The anonymous class-registration lead form was replaced by account-based
// enrollment (see `enrollment-actions.ts`). No new rows are written here — the
// public entry point is gone. `class_registrations` and these read/delete
// accessors are retained for ONE release so any pre-migration leads remain
// recoverable, then the table will be dropped. Do not wire new callers.

export async function saveClassRegistration(data: Omit<ClassRegistration, 'id' | 'submittedAt'>) {
    try {
        await insertRegistration(data);
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
        await deleteRegistration(id);
        revalidatePath('/admin/registrations');
        return { success: true, message: 'Registration deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete class registration:', error);
        return { success: false, message: 'Failed to delete registration.' };
    }
}
