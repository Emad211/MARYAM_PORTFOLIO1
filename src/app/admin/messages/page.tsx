
import { getContactMessages } from "@/app/actions/user-actions";
import { MessagesDataTable } from "@/components/admin/messages-data-table";


export default async function MessagesPage() {
    const messages = await getContactMessages();

    return (
        <MessagesDataTable data={messages} />
    );
}
