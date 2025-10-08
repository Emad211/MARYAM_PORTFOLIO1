
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import type { PostCategory, Post } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, PlusCircle, Search, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { de, faIR } from 'date-fns/locale';
import Link from "next/link";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { deletePost } from "@/app/actions/content-actions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const blogAdminContent = {
  en: {
    title: "Manage Blog Posts",
    description: "Here you can create, edit, and delete your blog articles.",
    newPost: "New Post",
    postTitle: "Title",
    category: "Category",
    date: "Date",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    search: "Search posts...",
    allCategories: "All Categories",
    deleteTitle: "Are you sure you want to delete this post?",
    deleteDescription: "This action cannot be undone. This will permanently delete the post.",
    deleteSuccess: "Post deleted successfully.",
    deleteError: "Failed to delete post.",
  },
  de: {
    title: "Blogbeiträge verwalten",
    description: "Hier können Sie Ihre Blogartikel erstellen, bearbeiten und löschen.",
    newPost: "Neuer Beitrag",
    postTitle: "Titel",
    category: "Kategorie",
    date: "Datum",
    actions: "Aktionen",
    edit: "Bearbeiten",
    delete: "Löschen",
    search: "Beiträge suchen...",
    allCategories: "Alle Kategorien",
    deleteTitle: "Möchten Sie diesen Beitrag wirklich löschen?",
    deleteDescription: "Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Beitrag dauerhaft gelöscht.",
    deleteSuccess: "Beitrag erfolgreich gelöscht.",
    deleteError: "Fehler beim Löschen des Beitrags.",
  },
  fa: {
    title: "مدیریت پست‌های وبلاگ",
    description: "در اینجا می‌توانید مقالات وبلاگ خود را ایجاد، ویرایش و حذف کنید.",
    newPost: "پست جدید",
    postTitle: "عنوان",
    category: "دسته‌بندی",
    date: "تاریخ",
    actions: "عملیات",
    edit: "ویرایش",
    delete: "حذف",
    search: "جستجوی پست‌ها...",
    allCategories: "همه دسته‌بندی‌ها",
    deleteTitle: "آیا از حذف این پست مطمئن هستید؟",
    deleteDescription: "این عمل قابل بازگشت نیست. این کار پست را برای همیشه حذف خواهد کرد.",
    deleteSuccess: "پست با موفقیت حذف شد.",
    deleteError: "حذف پست ناموفق بود.",
  },
};

const locales = { de, fa: faIR, en: undefined };
const categories: PostCategory[] = ['language', 'culture', 'tips'];

export function AdminBlogPageContent({ posts }: { posts: Post[] }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const content = blogAdminContent[language];

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<PostCategory | 'all'>('all');
  
  const filteredPosts = posts.filter(post => {
    const categoryMatch = activeCategory === 'all' || post.category === activeCategory;
    const searchMatch = searchTerm === "" || 
      post.title[language].toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleDelete = async (slug: string) => {
    const result = await deletePost(slug);
    if (result.success) {
      toast({ title: content.deleteSuccess });
      router.refresh();
    } else {
      toast({
        title: content.deleteError,
        description: result.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
            <p className="text-muted-foreground">{content.description}</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            {content.newPost}
          </Link>
        </Button>
      </div>

       <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={content.search}
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as PostCategory | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={content.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{content.allCategories}</SelectItem>
                {categories.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{content.postTitle}</TableHead>
                <TableHead className="hidden md:table-cell">{content.category}</TableHead>
                <TableHead className="hidden sm:table-cell">{content.date}</TableHead>
                <TableHead className="text-right">{content.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.slug}>
                  <TableCell className="font-medium">
                    {post.title[language]}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {format(new Date(post.date), "PPP", { locale: locales[language] })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild className="mr-2">
                      <Link href={`/admin/blog/edit/${post.slug}`}>
                        <Pencil className="mr-0 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">{content.edit}</span>
                      </Link>
                    </Button>
                    <DeleteConfirmationDialog 
                        onConfirm={() => handleDelete(post.slug)}
                        title={content.deleteTitle}
                        description={content.deleteDescription}
                        deleteButtonText={content.delete}
                    >
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{content.delete}</span>
                      </Button>
                    </DeleteConfirmationDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       {filteredPosts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No posts match the current filters.</p>
          </div>
        )}
    </div>
  );
}
