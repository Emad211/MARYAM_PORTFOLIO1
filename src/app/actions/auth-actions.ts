
'use server';

import { getAdminUser as getAdminUserFromStore } from '@/lib/cms-store';

// This is a dedicated server action to expose getAdminUser to client components
// without them needing to import a 'server-only' file directly.
export async function getAdminUser() {
  return await getAdminUserFromStore();
}
