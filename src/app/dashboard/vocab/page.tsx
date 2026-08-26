import { startReviewSession } from '@/app/actions/vocab-actions';
import { FlashcardSession } from '@/components/dashboard/flashcard-session';

// The review queue is RLS-scoped to the signed-in student and changes with
// every graded card — it must never be prerendered or cached.
export const dynamic = 'force-dynamic';

export default async function VocabReviewPage() {
    const cards = await startReviewSession(20);
    return <FlashcardSession initialCards={cards} />;
}
