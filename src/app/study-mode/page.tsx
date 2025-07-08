'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { handleTutorChat } from './actions';
import type { TutorChatInput } from '@/ai/flows/tutor-chat';
import { ChatMessage, ChatMessageProps } from '@/components/chat-message';
import { Loader2, Send, Paperclip, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

type ChatFormValues = {
  message: string;
};

function StudyModeComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isPremium } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState('');
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ file: File, dataUri: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam) {
      const decodedSubject = decodeURIComponent(subjectParam);
      setSubject(decodedSubject);
      setMessages([
        { role: 'model', text: `Hello! I'm your AI tutor for ${decodedSubject}. How can I help you study today?` }
      ]);
    } else {
        router.push('/tracker');
        toast({ variant: 'destructive', title: 'Error', description: 'No subject selected for study mode.' });
    }
  }, [searchParams, router, toast]);

  const form = useForm<ChatFormValues>({ defaultValues: { message: '' } });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload an image file.' });
        return;
      }
      try {
        const dataUri = await fileToDataUri(file);
        setSelectedImage({ file, dataUri });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not process the image file.' });
      }
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const onSubmit = async (data: ChatFormValues) => {
    if (!data.message.trim() && !selectedImage) return;

    setIsLoading(true);
    const userMessage: ChatMessageProps = {
      role: 'user',
      text: data.message,
      image: selectedImage?.dataUri,
      userAvatar: user?.photoURL,
      userName: user?.displayName || user?.email || 'User'
    };
    setMessages(prev => [...prev, userMessage]);
    form.reset();
    clearImage();

    const chatHistory = messages.map(m => ({ role: m.role, text: m.text }));
    const input: TutorChatInput = {
      subject,
      history: chatHistory,
      message: data.message,
      image: selectedImage?.dataUri,
    };

    const result = await handleTutorChat(input);

    if (result) {
      setMessages(prev => [...prev, { role: 'model', text: result.response }]);
    } else {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollEl = scrollAreaRef.current.querySelector('div');
        if (scrollEl) {
          scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [messages]);

  if (!user) {
      return null; // Auth context will handle redirect
  }
  
  if (!isPremium) {
    return (
        <div className="container mx-auto max-w-2xl py-20">
            <AlertDialog open={true}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/> Premium Feature</AlertDialogTitle>
                        <AlertDialogDescription>
                            The AI Tutor Study Mode is a premium feature. Upgrade to FocusFlow AI Premium to get on-demand, contextual help during your study sessions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel asChild><Link href="/tracker">Go Back</Link></AlertDialogCancel>
                        <AlertDialogAction asChild><Link href="/premium">Go Premium</Link></AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 h-[calc(100vh-8rem)] flex flex-col">
       <Card className="flex-grow flex flex-col">
         <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Study Mode: {subject}</CardTitle>
            <CardDescription>Your distraction-free space with an AI tutor.</CardDescription>
         </CardHeader>
         <CardContent className="flex-grow flex flex-col min-h-0">
            <ScrollArea className="flex-grow pr-4 -mr-4" viewportRef={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((msg, index) => <ChatMessage key={index} {...msg} />)}
                    {isLoading && <ChatMessage role="model" text={<Loader2 className="h-5 w-5 animate-spin" />} />}
                </div>
            </ScrollArea>
            <div className="mt-4 pt-4 border-t">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                        <div className="flex-grow space-y-2">
                            {selectedImage && (
                                <div className="relative w-24 h-24">
                                    <Image src={selectedImage.dataUri} alt="Selected preview" layout="fill" className="rounded-md object-cover"/>
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearImage}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ask a question about your subject..."
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    form.handleSubmit(onSubmit)();
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                        <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            <Paperclip className="h-5 w-5"/>
                            <span className="sr-only">Attach Image</span>
                        </Button>
                        <Button type="submit" size="icon" disabled={isLoading || (!form.getValues('message').trim() && !selectedImage)}>
                            <Send className="h-5 w-5" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                 </Form>
            </div>
         </CardContent>
       </Card>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function StudyModePage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <StudyModeComponent />
        </Suspense>
    )
}
