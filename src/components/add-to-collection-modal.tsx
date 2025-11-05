'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getCollections, createCollection, addContentToCollection } from '@/lib/collections-actions';
import type { ContentItem } from '@/app/my-content/page';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contentItem: ContentItem | null;
  onSuccess: () => void;
}

export function AddToCollectionModal({
  isOpen,
  onOpenChange,
  contentItem,
  onSuccess,
}: AddToCollectionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collections, setCollections] = useState<{ id: string; title: string }[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      getCollections(user.id).then(setCollections);
    }
  }, [isOpen, user]);

  const handleAddToCollection = async () => {
    if (!user || !contentItem || !selectedCollection) return;
    
    try {
      await addContentToCollection(user.id, selectedCollection, contentItem.id);
      toast({ title: 'Success', description: `Added to ${collections.find(c => c.id === selectedCollection)?.title}` });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add to collection.' });
    }
  };

  const handleCreateAndAdd = async () => {
    if (!user || !contentItem || !newCollectionTitle.trim()) return;
    
    setIsCreating(true);
    try {
      const newCollectionId = await createCollection(user.id, newCollectionTitle.trim());
      await addContentToCollection(user.id, newCollectionId, contentItem.id);
      toast({ title: 'Success', description: `Created collection and added item.` });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create collection.' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-w-[95vw] p-0 overflow-hidden border-border/60">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">Add to Collection</DialogTitle>
          <DialogDescription className="text-foreground/70 font-medium">
            Organize your content by adding it to a study collection.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="space-y-5">
            <div>
              <h4 className="font-semibold mb-3 text-sm">Add to Existing</h4>
              <div className="flex items-center gap-2">
                <Select onValueChange={setSelectedCollection} value={selectedCollection}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddToCollection} disabled={!selectedCollection}>Add</Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border/40" />
              <span className="text-xs text-muted-foreground font-medium">OR</span>
              <div className="flex-1 border-t border-border/40" />
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Create New</h4>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="e.g. Biology Midterm Prep"
                  value={newCollectionTitle}
                  onChange={(e) => setNewCollectionTitle(e.target.value)}
                  className="bg-background"
                />
                <Button onClick={handleCreateAndAdd} disabled={!newCollectionTitle.trim() || isCreating}>
                  {isCreating ? 'Creating...' : 'Create & Add'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
