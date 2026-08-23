
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getClasses } from "@/lib/cms-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Admin dashboards must always render live data, never a build-time snapshot.
export const dynamic = 'force-dynamic';

export default async function AdminLmsPage() {
  const classes = await getClasses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LMS Content</h1>
        <p className="text-muted-foreground">
          Author the curriculum tree (modules, lessons and questions) for each class.
        </p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No classes yet. Create a class first — curriculum content hangs off classes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.slug} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{cls.title.en || cls.title.fa}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline">{cls.slug}</Badge>
                  <Badge variant="secondary">{cls.level}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex justify-end">
                <Button asChild size="sm">
                  <Link href={`/admin/lms/${cls.slug}`}>
                    Manage
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
