
import type { Metadata } from "next";
import { GrammarIndex } from "@/components/grammar/grammar-index";
import { getGrammarTopics } from "@/lib/cms-store";

// ISR: cached, regenerated on admin edit (revalidatePath('/grammar')) or hourly.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  // Server render is language-neutral; Persian is the site default (same pick
  // as every other server-side metadata surface). The visible header picks
  // de/en client-side inside <GrammarIndex>.
  return {
    title: "بانک گرامر آلمانی",
    description:
      "توضیح‌های روشن گرامر زبان آلمانی با مثال‌های واقعی، مرتب‌شده از سطح A1 تا C2.",
    alternates: { canonical: "/grammar" },
  };
}

export default async function GrammarPage() {
  const topics = await getGrammarTopics();

  return <GrammarIndex topics={topics} />;
}
