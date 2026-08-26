import { getAdminConversations } from '@/app/actions/messages-actions';
import { AdminInbox } from '@/components/admin/admin-inbox';

// Live inbox — unread counts must be current.
export const dynamic = 'force-dynamic';

export default async function AdminInboxPage() {
    const conversations = await getAdminConversations();

    return <AdminInbox conversations={conversations} />;
}
