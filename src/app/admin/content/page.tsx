import { redirect } from 'next/navigation';

// /admin/content has no list UI of its own; content editing is reached from
// the settings page. Send direct visitors there instead of a 404.
export default function AdminContentIndexPage() {
  redirect('/admin/settings');
}
