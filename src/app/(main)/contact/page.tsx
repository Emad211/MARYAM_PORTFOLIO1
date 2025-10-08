
import { ContactPageContent } from "@/components/contact/contact-page-content";
import { getContactContent } from "@/lib/cms-store";

// This is now a Server Component
export default async function ContactPage() {
  // Fetch data on the server
  const contactContent = await getContactContent();

  // Pass the fetched data as props to the client component
  return <ContactPageContent contactContent={contactContent} />;
}
