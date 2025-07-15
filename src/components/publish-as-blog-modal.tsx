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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters.'),
    excerpt: z.string().min(20, 'Excerpt must be at least 20 characters.').max(200, 'Excerpt must be less than 200 characters.'),
    slug: z.string().min(5, 'Slug must be at least 5 characters.'),
    tags: z.string(),
});

interface PublishAsBlogModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    summary: { id: string; title: string; description: string; };
}

export function PublishAsBlogModal({ isOpen, onOpenChange, summary }: PublishAsBlogModalProps) {
    const { user } = useAuth();
    const [isPublishing, setIsPublishing] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: summary.title,
            excerpt: summary.description.substring(0, 190),
            slug: slugify(summary.title),
            tags: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        setIsPublishing(true);
        try {
            const tagsArray = values.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            const slug = await publishAsBlog(user.uid, summary.id, { ...values, tags: tagsArray });
            // You would typically show a success toast here and redirect
            alert(`Successfully published! Blog post available at /blog/${slug}`);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to publish as blog:', error);
            // You would typically show an error toast here
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Publish as Blog Post</DialogTitle>
                    <DialogDescription>
                        Review and edit the SEO details for your new blog post.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
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
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPublishing}>
                                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Publish
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
