'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, isUsernameAvailable } from '@/lib/profile-actions';
import { useDebounce } from 'use-debounce';

export default function EditProfilePage() {
  const { user, username: currentUsername, publicProfile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [school, setSchool] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [debouncedUsername] = useDebounce(username, 500);

  useEffect(() => {
    if (publicProfile) {
      setDisplayName(publicProfile.displayName || '');
      setBio(publicProfile.bio || '');
      setSchool(publicProfile.school || '');
    }
    if (currentUsername) {
      setUsername(currentUsername);
    }
  }, [publicProfile, currentUsername]);

  useEffect(() => {
    if (debouncedUsername && debouncedUsername !== currentUsername) {
      setUsernameStatus('checking');
      isUsernameAvailable(debouncedUsername).then(isAvailable => {
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      });
    } else {
      setUsernameStatus('idle');
    }
  }, [debouncedUsername, currentUsername]);

  const handleSubmit = async () => {
    if (!user || usernameStatus === 'taken') return;

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, username, {
        displayName,
        bio,
        school,
        avatarUrl: user.photoURL || '',
      });
      toast({ title: 'Success!', description: 'Your profile has been updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update your profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Edit Public Profile</h1>
      <div className="space-y-6">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={e => setUsername(e.target.value)} />
          {usernameStatus === 'checking' && <p className="text-xs text-muted-foreground mt-1">Checking...</p>}
          {usernameStatus === 'available' && <p className="text-xs text-green-500 mt-1">Available!</p>}
          {usernameStatus === 'taken' && <p className="text-xs text-destructive mt-1">Username is taken.</p>}
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="school">School</Label>
          <Input id="school" value={school} onChange={e => setSchool(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} disabled={isSaving || usernameStatus === 'taken'}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
