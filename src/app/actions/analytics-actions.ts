
'use server';

import { getAnalytics, saveAnalytics } from '@/lib/cms-store';
import { headers } from 'next/headers';
import { startOfDay, subDays } from 'date-fns';
import type { PageView } from '@/lib/types';

async function writeAnalyticsData(data: PageView[]): Promise<void> {
  await saveAnalytics(data);
}

async function getReferrerType(referrer: string | null, headerStore: Readonly<Headers>): Promise<string> {
    if (!referrer) {
        return 'Direct';
    }
    try {
        const referrerUrl = new URL(referrer);
    const currentHost = headerStore.get('host');

    if (currentHost && referrerUrl.hostname.includes(currentHost)) {
            return 'Direct';
        }
         if (referrerUrl.hostname.includes('localhost')) {
            return 'Direct';
        }
        if (referrerUrl.hostname.includes('google.')) {
            return 'Google';
        }
        if (referrerUrl.hostname.includes('bing.')) {
            return 'Bing';
        }
        if (referrerUrl.hostname.includes('duckduckgo.')) {
            return 'DuckDuckGo';
        }
        if (referrerUrl.hostname.includes('facebook.')) {
            return 'Facebook';
        }
        if (referrerUrl.hostname.includes('t.co') || referrerUrl.hostname.includes('twitter.')) {
            return 'Twitter / X';
        }
        if (referrerUrl.hostname.includes('linkedin.')) {
            return 'LinkedIn';
        }
        if (referrerUrl.hostname.includes('instagram.')) {
            return 'Instagram';
        }
        return 'Other';

  } catch (error) {
    return 'Other';
  }
}


export async function trackPageView(pathname: string) {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown';
  const userAgent = headerStore.get('user-agent') ?? 'unknown';
  const referrer = headerStore.get('referer');

  const newPageView: PageView = {
    path: pathname,
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    referrer,
  };

  const allViews = await getAnalytics();
  allViews.push(newPageView);
  await writeAnalyticsData(allViews);
}

export async function getAnalyticsData() {
  const allViews = await getAnalytics();

  const todayStart = startOfDay(new Date());
  const yesterdayStart = startOfDay(subDays(new Date(), 1));

  const viewsToday = allViews.filter(view => new Date(view.timestamp) >= todayStart);
  const viewsYesterday = allViews.filter(view => {
      const viewDate = new Date(view.timestamp);
      return viewDate >= yesterdayStart && viewDate < todayStart;
  });

  const todayCount = viewsToday.length;
  const yesterdayCount = viewsYesterday.length;

  let dailyChangePercent = 0;
  if (yesterdayCount > 0) {
    dailyChangePercent = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
  } else if (todayCount > 0) {
    dailyChangePercent = 100; // If yesterday was 0 and today is > 0, it's a 100% increase
  }

  const uniqueVisitorsToday = new Set(viewsToday.map(view => view.ip)).size;

  const pageViews = allViews.reduce((acc, view) => {
    acc[view.path] = (acc[view.path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPages = Object.entries(pageViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([path, views]) => ({ path, views }));
    
  // Data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return startOfDay(d);
  }).reverse();

  const dailyViews = last7Days.map(day => {
      const dayString = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const views = allViews.filter(view => {
          const viewDate = new Date(view.timestamp);
          return viewDate >= day && viewDate < new Date(day.getTime() + 24 * 60 * 60 * 1000);
      }).length;
      return { date: dayString, views };
  });

  const headerStore = await headers();
  const trafficSources = await allViews.reduce(async (accP, view) => {
    const acc = await accP;
    const type = await getReferrerType(view.referrer, headerStore);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, Promise.resolve({} as Record<string, number>));

  const trafficSourcesData = Object.entries(trafficSources).map(([source, views]) => ({
      source,
      views
  }));

  return {
    totalViews: allViews.length,
    totalUniqueVisitors: new Set(allViews.map(view => view.ip)).size,
    viewsToday: todayCount,
    dailyChangePercent,
    uniqueVisitorsToday,
    topPages,
    dailyViews,
    trafficSourcesData,
  };
}
