
'use server';

import { revalidatePath } from 'next/cache';
import {
  getPosts,
  savePosts,
  getClasses,
  saveClasses,
  getTimeline,
  saveTimeline,
  getHomeContent,
  saveHomeContent,
  getAboutContent,
  saveAboutContent,
  getContactContent,
  saveContactContent,
  getAdminUser,
  saveAdminUser
} from '@/lib/cms-store';
import type { HomeContent, Post, Class, TimelineEvent, AboutContent, ContactContent, AdminUser, Language, LocalizedString, PostCategory, ClassType, ClassLevel, ClassStatus } from '@/lib/types';

// --- Utility Functions ---

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') 
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

const languages: Language[] = ['en', 'de', 'fa'];

// --- Content Update Functions ---

export async function updateHomeContent(newHomeContent: HomeContent) {
    try {
        await saveHomeContent(newHomeContent);
        revalidatePath('/');
        revalidatePath('/(main)', 'layout');
        return { success: true, message: 'Home page content updated successfully!' };
    } catch (error) {
        console.error('Failed to update home content:', error);
        return { success: false, message: 'Failed to update content.' };
    }
}

export async function updateAboutContent(newAboutContent: AboutContent) {
    try {
        await saveAboutContent(newAboutContent);
        revalidatePath('/about');
        revalidatePath('/(main)', 'layout');
        return { success: true, message: 'About page content updated successfully!' };
    } catch (error) {
        console.error('Failed to update about content:', error);
        return { success: false, message: 'Failed to update content.' };
    }
}

export async function updateContactContent(newContactContent: ContactContent) {
    try {
        await saveContactContent(newContactContent);
        revalidatePath('/contact');
        revalidatePath('/(main)', 'layout');
        return { success: true, message: 'Contact page content updated successfully!' };
    } catch (error) {
        console.error('Failed to update contact content:', error);
        return { success: false, message: 'Failed to update content.' };
    }
}

export async function updateTimeline(newTimeline: TimelineEvent[]) {
    try {
        await saveTimeline(newTimeline);
        revalidatePath('/about');
        revalidatePath('/(main)', 'layout');
        return { success: true, message: 'Timeline updated successfully!' };
    } catch (error) {
        console.error('Failed to update timeline:', error);
        return { success: false, message: 'Failed to update timeline.' };
    }
}

// --- Post Management ---

export async function createPost(prevState: any, formData: FormData) {
    const titleEn = formData.get('title-en') as string;
    if (!titleEn) {
        return { success: false, message: "title_required" };
    }

    const postData: Omit<Post, 'slug' | 'date'> = {
        title: { en: '', de: '', fa: '' },
        excerpt: { en: '', de: '', fa: '' },
        content: { en: '', de: '', fa: '' },
        author: formData.get('author') as string,
        category: formData.get('category') as PostCategory,
        imageUrl: formData.get('imageUrl') as string,
        imageHint: formData.get('imageHint') as string,
        tags: [],
        seo: {
            title: { en: '', de: '', fa: '' },
            description: { en: '', de: '', fa: '' },
        },
    };

    const tags: { [key in Language]: string[] } = {
        en: (formData.get('tags-en') as string || '').split(',').map(t => t.trim()).filter(Boolean),
        de: (formData.get('tags-de') as string || '').split(',').map(t => t.trim()).filter(Boolean),
        fa: (formData.get('tags-fa') as string || '').split(',').map(t => t.trim()).filter(Boolean),
    };
    
    const maxTags = Math.max(tags.en.length, tags.de.length, tags.fa.length);
    for (let i = 0; i < maxTags; i++) {
        postData.tags.push({
            en: tags.en[i] || '',
            de: tags.de[i] || '',
            fa: tags.fa[i] || '',
        });
    }
    
    languages.forEach(lang => {
        postData.title[lang] = formData.get(`title-${lang}`) as string;
        postData.excerpt[lang] = formData.get(`excerpt-${lang}`) as string;
        postData.content[lang] = formData.get(`content-${lang}`) as string;
        postData.seo.title[lang] = formData.get(`seo-title-${lang}`) as string;
        postData.seo.description[lang] = formData.get(`seo-desc-${lang}`) as string;
    });

    try {
        const posts = await getPosts();
        const slug = slugify(titleEn);
        if (posts.find(p => p.slug === slug)) {
            return { success: false, message: `A post with slug "${slug}" already exists.` };
        }
        const newPost: Post = { ...postData, slug, date: new Date().toISOString() };
        await savePosts([newPost, ...posts]);
        
        revalidatePath('/blog');
        revalidatePath(`/blog/${newPost.slug}`);
        revalidatePath('/admin/blog');
        return { success: true, message: 'Post created successfully!', slug: newPost.slug };
    } catch (error) {
        console.error('Failed to create post:', error);
        return { success: false, message: 'Failed to create post.' };
    }
}

export async function updatePost(updatedPost: Post) {
    try {
        const posts = await getPosts();
        const postIndex = posts.findIndex(p => p.slug === updatedPost.slug);
        if (postIndex === -1) return { success: false, message: 'Post not found.' };
        
        posts[postIndex] = updatedPost;
        await savePosts(posts);
        
        revalidatePath('/blog');
        revalidatePath(`/blog/${updatedPost.slug}`);
        return { success: true, message: 'Post updated successfully!' };
    } catch (error) {
        console.error('Failed to update post:', error);
        return { success: false, message: 'Failed to update post.' };
    }
}

export async function deletePost(slug: string) {
    try {
        const posts = await getPosts();
        const updatedPosts = posts.filter(p => p.slug !== slug);
        await savePosts(updatedPosts);

        revalidatePath('/blog');
        revalidatePath('/admin/blog');
        return { success: true, message: 'Post deleted successfully!' };
    } catch (error) {
        console.error('Failed to delete post:', error);
        return { success: false, message: 'Failed to delete post.' };
    }
}

// --- Class Management ---

export async function createClass(prevState: any, formData: FormData) {
    const titleEn = formData.get('title-en') as string;
     if (!titleEn) {
        return { success: false, message: "title_required" };
    }
    
    const objectives: { [key in Language]: string[] } = {
        en: (formData.get('objectives-en') as string || '').split('\n').map(o => o.trim()).filter(Boolean),
        de: (formData.get('objectives-de') as string || '').split('\n').map(o => o.trim()).filter(Boolean),
        fa: (formData.get('objectives-fa') as string || '').split('\n').map(o => o.trim()).filter(Boolean),
    };
    const prerequisites: { [key in Language]: string[] } = {
        en: (formData.get('prerequisites-en') as string || '').split('\n').map(p => p.trim()).filter(Boolean),
        de: (formData.get('prerequisites-de') as string || '').split('\n').map(p => p.trim()).filter(Boolean),
        fa: (formData.get('prerequisites-fa') as string || '').split('\n').map(p => p.trim()).filter(Boolean),
    };

    const classData: Omit<Class, 'slug'> = {
        title: { en: '', de: '', fa: '' },
        excerpt: { en: '', de: '', fa: '' },
        description: { en: '', de: '', fa: '' },
        type: formData.get('type') as ClassType,
        level: formData.get('level') as ClassLevel,
        status: formData.get('status') as ClassStatus,
        imageUrl: formData.get('imageUrl') as string,
        imageHint: formData.get('imageHint') as string,
        schedule: {
            days: { en: '', de: '', fa: '' },
            time: formData.get('scheduleTime') as string,
        },
        objectives: [],
        prerequisites: [],
        seo: {
            title: { en: '', de: '', fa: '' },
            description: { en: '', de: '', fa: '' },
        },
        price: formData.get('price') ? Number(formData.get('price')) : undefined,
        maxStudents: formData.get('maxStudents') ? Number(formData.get('maxStudents')) : undefined,
    };
    
    languages.forEach(lang => {
        classData.title[lang] = formData.get(`title-${lang}`) as string;
        classData.excerpt[lang] = formData.get(`excerpt-${lang}`) as string;
        classData.description[lang] = formData.get(`description-${lang}`) as string;
        classData.schedule.days[lang] = formData.get(`schedule-days-${lang}`) as string;
        classData.seo.title[lang] = formData.get(`seo-title-${lang}`) as string;
        classData.seo.description[lang] = formData.get(`seo-desc-${lang}`) as string;
    });

    const maxObjectives = Math.max(...Object.values(objectives).map(arr => arr.length));
    for (let i = 0; i < maxObjectives; i++) {
        classData.objectives.push({
            en: objectives.en[i] || '',
            de: objectives.de[i] || '',
            fa: objectives.fa[i] || '',
        });
    }

    const maxPrerequisites = Math.max(...Object.values(prerequisites).map(arr => arr.length));
    for (let i = 0; i < maxPrerequisites; i++) {
        classData.prerequisites.push({
            en: prerequisites.en[i] || '',
            de: prerequisites.de[i] || '',
            fa: prerequisites.fa[i] || '',
        });
    }

    try {
        const classes = await getClasses();
        const slug = slugify(titleEn);
        if (classes.find(c => c.slug === slug)) {
            return { success: false, message: `A class with slug "${slug}" already exists.` };
        }
        const newClass: Class = { ...classData, slug };
        await saveClasses([newClass, ...classes]);
        
        revalidatePath('/classes');
        revalidatePath(`/classes/${newClass.slug}`);
        revalidatePath('/admin/classes');
        return { success: true, message: 'Class created successfully!', slug: newClass.slug };
    } catch (error) {
        console.error('Failed to create class:', error);
        return { success: false, message: 'Failed to create class.' };
    }
}

export async function updateClass(updatedClass: Class) {
    try {
        const classes = await getClasses();
        const classIndex = classes.findIndex(c => c.slug === updatedClass.slug);
        if (classIndex === -1) return { success: false, message: 'Class not found.' };

        classes[classIndex] = updatedClass;
        await saveClasses(classes);

        revalidatePath('/classes');
        revalidatePath(`/classes/${updatedClass.slug}`);
        return { success: true, message: 'Class updated successfully!' };
    } catch (error) {
        console.error('Failed to update class:', error);
        return { success: false, message: 'Failed to update class.' };
    }
}

export async function deleteClass(slug: string) {
    try {
        const classes = await getClasses();
        const updatedClasses = classes.filter(c => c.slug !== slug);
        await saveClasses(updatedClasses);
        
        revalidatePath('/classes');
        revalidatePath('/admin/classes');
        return { success: true, message: 'Class deleted successfully!' };
    } catch (error) {
        console.error('Failed to delete class:', error);
        return { success: false, message: 'Failed to delete class.' };
    }
}

// --- User Credentials ---

export async function updateUserCredentials(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string;
    const newEmail = formData.get('newEmail') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newEmail) {
        return { success: false, message: 'Missing required fields.' };
    }
    
    const adminUser = await getAdminUser();

    if (adminUser.password !== currentPassword) {
        return { success: false, message: 'Incorrect current password.' };
    }

    if (newPassword && newPassword !== confirmPassword) {
        return { success: false, message: 'New passwords do not match.' };
    }
    
    const updatedUser: AdminUser = {
        email: newEmail,
        password: newPassword || adminUser.password 
    };
    
    try {
        await saveAdminUser(updatedUser);
        revalidatePath('/login');
        return { success: true, message: 'Credentials updated successfully!' };
    } catch (error) {
        console.error('Failed to update user credentials:', error);
        return { success: false, message: 'Failed to update credentials.' };
    }
}
