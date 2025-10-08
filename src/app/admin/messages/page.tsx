
import { getContactMessages } from "@/app/actions/user-actions";
import { MessagesDataTable } from "@/components/admin/messages-data-table";


export default async function MessagesPage() {
    const messages = await getContactMessages();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
                <p className="text-muted-foreground">Here you can view and delete messages submitted through the contact form.</p>
            </div>

            <MessagesDataTable data={messages} />
        </div>
    );
}
