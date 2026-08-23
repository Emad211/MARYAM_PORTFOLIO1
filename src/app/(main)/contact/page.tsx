
import { ContactPageContent } from "@/components/contact/contact-page-content";
import { getContactContent } from "@/lib/cms-store";

// ISR: cached, regenerated on admin edit (revalidatePath('/contact')) or hourly.
export const revalidate = 3600;

export const metadata = {
  title: 'تماس با من',
  description: 'برای مشاوره ثبت‌نام یا هر پرسش دیگر در تماس باشید.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  // Fetch data on the server
  const contactContent = await getContactContent();

  // Pass the fetched data as props to the client component
  return <ContactPageContent contactContent={contactContent} />;
}
