
import { getContactMessages } from "@/app/actions/user-actions";
import { AdminPageHeading } from "@/components/admin/page-heading";
import { MessagesDataTable } from "@/components/admin/messages-data-table";


export default async function MessagesPage() {
    const messages = await getContactMessages();

    return (
        <div>
            <AdminPageHeading
                fa="پیام‌های تماس"
                en="Contact Messages"
                de="Kontaktnachrichten"
                subFa="پیام‌های ارسال‌شده از طریق فرم تماس را مشاهده و حذف کنید."
                subEn="View and delete messages submitted through the contact form."
                subDe="Sehen Sie die über das Kontaktformular eingegangenen Nachrichten an und löschen Sie sie bei Bedarf."
            />
            <MessagesDataTable data={messages} />
        </div>
    );
}
