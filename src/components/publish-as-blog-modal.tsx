
// src/components/publish-as-blog-modal.tsx
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { slugify } from '@/lib/utils';
import { publishAsBlog } from '@/lib/content-actions';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ContentItem } from '@/app/my-content/page';

const formSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters.'),
    excerpt: z.string().min(20, 'Excerpt must be at least 20 characters.').max(200, 'Excerpt must be less than 200 characters.'),
    slug: z.string().min(5, 'Slug must be at least 5 characters.'),
    tags: z.string().optional(),
});

interface PublishAsBlogModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    contentItem: ContentItem | null;
    onSuccess: () => void;
}

export function PublishAsBlogModal({ isOpen, onOpenChange, contentItem, onSuccess }: PublishAsBlogModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isPublishing, setIsPublishing] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (contentItem) {
            form.reset({
                title: contentItem.title.startsWith('Saved:') ? '' : contentItem.title,
                excerpt: contentItem.description.substring(0, 190),
                slug: slugify(contentItem.title),
                tags: '',
            });
        }
    }, [contentItem, form]);


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user || !contentItem) return;
        setIsPublishing(true);
        try {
            const tagsArray = values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag) || [];
            const slug = await publishAsBlog(user.id, contentItem.id, contentItem.type, { ...values, tags: tagsArray });
            
            toast({
                title: "Published!",
                description: `Your blog post is now live at /blog/${slug}`,
            });

            onSuccess(); // Refresh the content on the parent page
            onOpenChange(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to publish as blog:', error);
            toast({
                variant: 'destructive',
                title: 'Publishing Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-w-[95vw] p-0 overflow-hidden border-border/60">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl font-bold">Publish as Blog Post</DialogTitle>
                    <DialogDescription className="text-foreground/70 font-medium">
                        Review and edit the SEO details for your new blog post.
                    </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter a catchy blog title" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="excerpt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Excerpt (Meta Description)</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL Slug</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tags (comma-separated)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. AI, productivity, learning" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPublishing}>
                                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Publish
                            </Button>
                        </div>
                    </form>
                </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

    