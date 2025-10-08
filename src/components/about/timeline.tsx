
"use client";

import { useLanguage } from "@/context/language-context";
import type { TimelineEvent } from "@/lib/types";
import { Briefcase } from "lucide-react";

export function Timeline({ timelineEvents }: { timelineEvents: TimelineEvent[] }) {
  const { language } = useLanguage();
  const timeline = timelineEvents;

  if (!timeline) {
    return <div>Loading timeline...</div>;
  }

  return (
    <div className="relative mt-12 container mx-auto max-w-5xl px-6">
      {/* The vertical line */}
      <div className="absolute left-4 md:left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-border"></div>

      <div className="space-y-12">
        {timeline.map((event, index) => (
          <div key={index} className="relative">
            {/* Dot on the timeline */}
            <div className="absolute left-4 top-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary ring-4 ring-background"></div>

            <div className={`flex flex-col md:flex-row items-start gap-8 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              {/* Year */}
              <div className="md:w-1/2 flex justify-start md:justify-end data-[side=right]:justify-start pt-2" data-side={index % 2 !== 0 ? 'right' : 'left'}>
                 <div className={`w-full text-left md:text-right data-[side=right]:md:text-left ${index % 2 !== 0 ? 'md:pl-16' : 'md:pr-16'}`} data-side={index % 2 !== 0 ? 'right' : 'left'}>
                    <p className="font-headline text-4xl font-bold text-primary opacity-60">{event.year}</p>
                 </div>
              </div>
              
              {/* Card */}
              <div className="md:w-1/2 w-full pl-12 md:pl-0">
                <div className="relative">
                    {/* Horizontal line from dot to card on desktop */}
                    <div className={`hidden md:block absolute top-6 h-0.5 w-16 bg-border ${index % 2 !== 0 ? '-left-16' : '-right-16'}`}></div>
                    
                    <div className="rounded-lg border bg-card p-6 shadow-lg transition-shadow hover:shadow-2xl">
                        <div className="flex items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <h3 className="flex-1 font-headline text-xl font-bold text-card-foreground">
                            {event.title[language]}
                        </h3>
                        </div>
                        <p className="mt-4 text-muted-foreground">
                        {event.description[language]}
                        </p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
