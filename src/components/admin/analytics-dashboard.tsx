
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { getAnalyticsData } from "@/app/actions/analytics-actions";
import { Users, Eye, TrendingUp, BarChart } from "lucide-react";
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

type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;

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
    useEffect(() => {
        setIsClient(true);
    }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Analytics Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All-time website visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-time Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.totalUniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Based on unique IP addresses</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialData.viewsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
                <span className={initialData.dailyChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {initialData.dailyChangePercent >= 0 ? '+' : ''}
                    {initialData.dailyChangePercent.toFixed(1)}%
                </span>
                &nbsp;from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Views in Last 7 Days</CardTitle>
             <CardDescription>A line chart showing page views over the past week.</CardDescription>
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
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>The most visited pages on your website.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Path</TableHead>
                    <TableHead className="text-right">Views</TableHead>
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
                            No page views tracked yet.
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
                    <CardTitle>Traffic Sources</CardTitle>
                    <CardDescription>Where your visitors are coming from.</CardDescription>
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
