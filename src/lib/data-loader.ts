
import 'server-only';
import { 
    getHomeContent, 
    getAboutContent, 
    getContactContent,
    getAdminUser,
    getPosts,
    getClasses,
    getTimeline
} from './cms-store';

// This file is now a facade for functions that can be called from Server Components.
// The direct data fetching at the top level has been removed.

export const homeContent = await getHomeContent();
export const aboutContent = await getAboutContent();
export const contactContent = await getContactContent();
export const adminUser = await getAdminUser();
export const posts = await getPosts();
export const classes = await getClasses();
export const timeline = await getTimeline();
