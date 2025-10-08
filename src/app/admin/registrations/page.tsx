
import { getClassRegistrations } from "@/app/actions/user-actions";
import { RegistrationsDataTable } from "@/components/admin/registrations-data-table";


export default async function RegistrationsPage() {
    const registrations = await getClassRegistrations();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Class Registrations</h1>
                <p className="text-muted-foreground">Generate personalized welcome emails and manage all student registrations.</p>
            </div>

            <RegistrationsDataTable data={registrations} />
        </div>
    );
}
