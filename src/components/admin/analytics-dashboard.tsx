
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { getAnalyticsData } from "@/app/actions/analytics-actions";
import { Users, Eye, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Bar as BarPrimitive } from "recharts";
import { BarChart as BarChartComponent } from "recharts";
import { ChartConfig } from "@/components/ui/chart"
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import type { Language } from "@/lib/types";

type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;

const dashboardContent: Record<Language, {
  pageTitle: string;
  totalViews: string;
  totalViewsHint: string;
  uniqueVisitors: string;
  uniqueVisitorsHint: string;
  viewsToday: string;
  fromYesterday: string;
  last7Days: string;
  last7DaysHint: string;
  topPages: string;
  topPagesHint: string;
  pagePath: string;
  views: string;
  noPageViews: string;
  trafficSources: string;
  trafficSourcesHint: string;
}> = {
  en: {
    pageTitle: "Analytics Dashboard",
    totalViews: "Total Views",
    totalViewsHint: "All-time website visits",
    uniqueVisitors: "All-time Unique Visitors",
    uniqueVisitorsHint: "Based on unique IP addresses",
    viewsToday: "Views Today",
    fromYesterday: "from yesterday",
    last7Days: "Views in Last 7 Days",
    last7DaysHint: "A line chart showing page views over the past week.",
    topPages: "Top Pages",
    topPagesHint: "The most visited pages on your website.",
    pagePath: "Page Path",
    views: "Views",
    noPageViews: "No page views tracked yet.",
    trafficSources: "Traffic Sources",
    trafficSourcesHint: "Where your visitors are coming from.",
  },
  de: {
    pageTitle: "Analyse-Dashboard",
    totalViews: "Aufrufe insgesamt",
    totalViewsHint: "Besuche seit Bestehen der Website",
    uniqueVisitors: "Eindeutige Besucher insgesamt",
    uniqueVisitorsHint: "Basierend auf eindeutigen IP-Adressen",
    viewsToday: "Aufrufe heute",
    fromYesterday: "im Vergleich zu gestern",
    last7Days: "Aufrufe der letzten 7 Tage",
    last7DaysHint: "Ein Liniendiagramm der Seitenaufrufe der letzten Woche.",
    topPages: "Top-Seiten",
    topPagesHint: "Die meistbesuchten Seiten Ihrer Website.",
    pagePath: "Pfad",
    views: "Aufrufe",
    noPageViews: "Noch keine Seitenaufrufe erfasst.",
    trafficSources: "Traffic-Quellen",
    trafficSourcesHint: "Woher Ihre Besucher kommen.",
  },
  fa: {
    pageTitle: "داشبورد آمار",
    totalViews: "مجموع بازدیدها",
    totalViewsHint: "بازدید کل از ابتدا تاکنون",
    uniqueVisitors: "بازدیدکنندگان یکتا",
    uniqueVisitorsHint: "بر اساس آدرس‌های IP یکتا",
    viewsToday: "بازدیدهای امروز",
    fromYesterday: "نسبت به دیروز",
    last7Days: "بازدیدهای ۷ روز گذشته",
    last7DaysHint: "نمودار خطی بازدید صفحات در هفته گذشته.",
    topPages: "صفحات پر بازدید",
    topPagesHint: "پر بازدیدترین صفحات وبسایت شما.",
    pagePath: "مسیر صفحه",
    views: "بازدید",
    noPageViews: "هنوز بازدیدی ثبت نشده است.",
    trafficSources: "منابع ترافیک",
    trafficSourcesHint: "بازدیدکنندگان از کجا می‌آیند.",
  },
};

const lineChartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const barChartConfig = {
   views: {
    label: "Views",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function AnalyticsDashboard({ initialData }: { initialData: AnalyticsData }) {
    const [isClient, setIsClient] = useState(false);
    const { language } = useLanguage();
    const t = dashboardContent[language];
    useEffect(() => {
        setIsClient(true);
    }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">{t.pageTitle}</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalViews}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t.totalViewsHint}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.uniqueVisitors}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.totalUniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t.uniqueVisitorsHint}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.viewsToday}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.viewsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
                <span className={initialData.dailyChangePercent >= 0 ? 'text-green-700' : 'text-red-500'}>
                    {`${initialData.dailyChangePercent >= 0 ? '+' : ''}${initialData.dailyChangePercent.toFixed(1)}%`}
                </span>
                &nbsp;{t.fromYesterday}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t.last7Days}</CardTitle>
             <CardDescription>{t.last7DaysHint}</CardDescription>
          </CardHeader>
          <CardContent>
             {isClient && (
                <ChartContainer config={lineChartConfig} className="h-[250px] w-full">
                    <LineChart
                    accessibilityLayer
                    data={initialData.dailyViews}
                    margin={{
                        left: 12,
                        right: 12,
                    }}
                    >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        allowDecimals={false}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Line
                        dataKey="views"
                        type="natural"
                        stroke="var(--color-views)"
                        strokeWidth={2}
                        dot={true}
                    />
                    </LineChart>
                </ChartContainer>
             )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>{t.topPages}</CardTitle>
            <CardDescription>{t.topPagesHint}</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.pagePath}</TableHead>
                    <TableHead className="text-right">{t.views}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.topPages.map((page) => (
                    <TableRow key={page.path}>
                      <TableCell className="font-medium truncate max-w-[200px]">{page.path}</TableCell>
                      <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                   {initialData.topPages.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                            {t.noPageViews}
                        </TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-6 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t.trafficSources}</CardTitle>
                    <CardDescription>{t.trafficSourcesHint}</CardDescription>
                </CardHeader>
                <CardContent>
                     {isClient && (
                        <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                            <BarChartComponent accessibilityLayer data={initialData.trafficSourcesData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="source"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                />
                                 <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    allowDecimals={false}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <BarPrimitive dataKey="views" fill="var(--color-views)" radius={4} />
                            </BarChartComponent>
                        </ChartContainer>
                     )}
                </CardContent>
            </Card>
       </div>

    </div>
  );
}
