import { getMyProfile } from '@/app/actions/profile-actions';
import { ProfileForm } from '@/components/dashboard/profile-form';

// The student's own profile editor. Reads are RLS-scoped to the caller via
// the request-bound client inside the gated action.
export default async function DashboardProfilePage() {
    const initialProfile = await getMyProfile();

    return <ProfileForm initialProfile={initialProfile} />;
}
