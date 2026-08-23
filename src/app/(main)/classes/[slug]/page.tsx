
import type { Metadata } from "next";
import { ClassDetails } from "@/components/classes/class-details";
import { getClasses } from "@/lib/cms-store";

// Fully public/cacheable: only the class content (identical for every visitor)
// is fetched on the server. The signed-in student's own enrollment state is
// per-user, so it's fetched client-side inside <EnrollCta> — keeping this page
// out of dynamic rendering. Regenerates on admin edit (revalidatePath) plus a
// time-based safety net.
export const revalidate = 3600;

export async function generateStaticParams() {
  const classes = await getClasses();
  return classes.map((c) => ({ slug: c.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fluentiaa.ir";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const cls = (await getClasses()).find((c) => c.slug === slug);
    if (!cls) return {};
    return {
      title: cls.title.fa,
      description: cls.excerpt.fa,
      alternates: { canonical: `/classes/${cls.slug}` },
      openGraph: {
        title: cls.title.fa,
        description: cls.excerpt.fa,
        url: `${SITE_URL}/classes/${cls.slug}`,
        images: [{ url: cls.imageUrl }],
      },
    };
  } catch {
    return {};
  }
}

export default async function ClassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const classes = await getClasses();

  return <ClassDetails classes={classes} slug={slug} />;
}
