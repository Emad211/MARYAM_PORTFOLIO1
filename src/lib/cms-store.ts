import 'server-only';
import { put, head } from '@vercel/blob';
import type { 
    Post, 
    Class, 
    TimelineEvent, 
    HomeContent, 
    AboutContent, 
    ContactContent, 
    AdminUser,
    ClassRegistration,
    PageView,
} from './types';
import { getEmptyCMSData } from './empty-data';

// Re-export types for convenience
export type { 
    Post, 
    Class, 
    TimelineEvent, 
    HomeContent, 
    AboutContent, 
    ContactContent, 
    AdminUser,
    ClassRegistration,
    Language,
    PageView,
} from './types';

// Define paths for our data blobs
const DATA_PATHS = {
    home: 'cms/homeContent.json',
    about: 'cms/aboutContent.json',
    contact: 'cms/contactContent.json',
    adminUser: 'cms/adminUser.json',
    posts: 'cms/posts.json',
    classes: 'cms/classes.json',
    timeline: 'cms/timeline.json',
    registrations: 'cms/registrations.json',
    messages: 'cms/messages.json',
    analytics: 'cms/analytics.json',
}

// Helper function to fetch a blob
async function getBlob<T>(path: string, emptyValue: T): Promise<T> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(`Vercel Blob token not found. Serving empty data for ${path}.`);
    return emptyValue;
  }

  try {
    const blobInfo = await head(path);
    const response = await fetch(blobInfo.url);
    const text = await response.text();
    if (!text) {
        return emptyValue;
    }
    return JSON.parse(text) as T;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      console.log(`Blob not found at ${path}. Initializing with empty data.`);
      // If the blob doesn't exist, create it with the empty value
      await saveBlob(path, emptyValue);
      return emptyValue;
    }
    console.error(`Failed to load blob from ${path}:`, error);
    return emptyValue;
  }
}

// Helper function to save a blob
async function saveBlob<T>(path: string, data: T): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(`Vercel Blob token not found. Skipping save operation for ${path}.`);
    return;
  }
  
  await put(
    path,
    JSON.stringify(data, null, 2),
    {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    }
  );
}

// --- Getter and Setter functions for each data type ---

const EMPTY_DATA = getEmptyCMSData();

// Home Content
export const getHomeContent = () => getBlob(DATA_PATHS.home, EMPTY_DATA.homeContent);
export const saveHomeContent = (data: HomeContent) => saveBlob(DATA_PATHS.home, data);

// About Content
export const getAboutContent = () => getBlob(DATA_PATHS.about, EMPTY_DATA.aboutContent);
export const saveAboutContent = (data: AboutContent) => saveBlob(DATA_PATHS.about, data);

// Contact Content
export const getContactContent = () => getBlob(DATA_PATHS.contact, EMPTY_DATA.contactContent);
export const saveContactContent = (data: ContactContent) => saveBlob(DATA_PATHS.contact, data);

// Admin User
export async function getAdminUser(): Promise<AdminUser> {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (email && password) {
        return { email, password };
    }
    
    // Fallback to blob storage if env vars are not set
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables. Falling back to blob storage for admin user. This is not recommended for production.");
    return getBlob(DATA_PATHS.adminUser, EMPTY_DATA.adminUser);
}
export async function saveAdminUser(data: AdminUser): Promise<void> {
     const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (email && password) {
        console.warn("Cannot save admin user when defined by environment variables.");
        return;
    }
    await saveBlob(DATA_PATHS.adminUser, data);
}

// Posts
export const getPosts = () => getBlob(DATA_PATHS.posts, EMPTY_DATA.posts);
export const savePosts = (data: Post[]) => saveBlob(DATA_PATHS.posts, data);

// Classes
export const getClasses = () => getBlob(DATA_PATHS.classes, EMPTY_DATA.classes);
export const saveClasses = (data: Class[]) => saveBlob(DATA_PATHS.classes, data);

// Timeline
export const getTimeline = () => getBlob(DATA_PATHS.timeline, EMPTY_DATA.timeline);
export const saveTimeline = (data: TimelineEvent[]) => saveBlob(DATA_PATHS.timeline, data);

// Registrations
export const getRegistrations = () => getBlob(DATA_PATHS.registrations, EMPTY_DATA.registrations);
export const saveRegistrations = (data: ClassRegistration[]) => saveBlob(DATA_PATHS.registrations, data);

// Messages
export const getMessages = () => getBlob(DATA_PATHS.messages, EMPTY_DATA.messages);
export const saveMessages = (data: unknown[]) => saveBlob(DATA_PATHS.messages, data);

// Analytics
export const getAnalytics = () => getBlob(DATA_PATHS.analytics, EMPTY_DATA.analytics);
export const saveAnalytics = (data: PageView[]) => saveBlob(DATA_PATHS.analytics, data);