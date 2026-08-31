import { getClasses } from '@/lib/cms-store';
import { getCurriculum } from '@/app/actions/lms-actions';
import { getHomeworkForAdmin } from '@/app/actions/homework-actions';
import { HomeworkManager } from '@/components/admin/homework-manager';

// Homework rows and per-lesson completion change as students work.
export const dynamic = 'force-dynamic';

export default async function AdminHomeworkPage() {
    const [classes, homework] = await Promise.all([getClasses(), getHomeworkForAdmin()]);

    const lessonsByClass: Record<string, Array<{ id: string; titleFa: string }>> = {};
    const curricula = await Promise.all(classes.map((c) => getCurriculum(c.slug)));
    curricula.forEach((modules, i) => {
        const slug = classes[i]?.slug;
        if (!slug) return;
        lessonsByClass[slug] = modules.flatMap((m) =>
            m.lessons.map((l) => ({ id: l.id, titleFa: l.title.fa || l.title.en }))
        );
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">تکالیف</h1>
                <p className="text-muted-foreground">
                    برای کلاسها درسِ تکلیف با مهلت تعیین کن؛ هنرجویان تأییدشده خودکار اطلاع مییابند و پیشرفتشان همینجا دیده میشود.
                </p>
            </div>

            <HomeworkManager initialHomework={homework} lessonsByClass={lessonsByClass} />
        </div>
    );
}
