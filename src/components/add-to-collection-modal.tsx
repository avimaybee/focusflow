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
      getCollections(user.uid).then(setCollections);
    }
  }, [isOpen, user]);

  const handleAddToCollection = async () => {
    if (!user || !contentItem || !selectedCollection) return;
    
    try {
      await addContentToCollection(user.uid, selectedCollection, contentItem.id);
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
      const newCollectionId = await createCollection(user.uid, newCollectionTitle.trim());
      await addContentToCollection(user.uid, newCollectionId, contentItem.id);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Organize your content by adding it to a study collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-medium mb-2">Add to Existing</h4>
            <div className="flex items-center gap-2">
              <Select onValueChange={setSelectedCollection} value={selectedCollection}>
                <SelectTrigger>
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
          <div className="text-center text-sm text-muted-foreground">OR</div>
          <div>
            <h4 className="font-medium mb-2">Create New</h4>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="e.g. Biology Midterm Prep"
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
              />
              <Button onClick={handleCreateAndAdd} disabled={!newCollectionTitle.trim() || isCreating}>
                {isCreating ? 'Creating...' : 'Create & Add'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
