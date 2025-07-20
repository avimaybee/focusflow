'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { isUsernameAvailable } from '@/lib/profile-actions';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  initialUsername?: string;
  onStatusChange: (status: 'idle' | 'checking' | 'available' | 'taken') => void;
}

export function UsernameInput({ value, onChange, initialUsername, onStatusChange }: UsernameInputProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [debouncedUsername] = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedUsername && debouncedUsername !== initialUsername) {
      setStatus('checking');
      onStatusChange('checking');
      isUsernameAvailable(debouncedUsername).then(isAvailable => {
        const newStatus = isAvailable ? 'available' : 'taken';
        setStatus(newStatus);
        onStatusChange(newStatus);
      });
    } else {
      setStatus('idle');
      onStatusChange('idle');
    }
  }, [debouncedUsername, initialUsername, onStatusChange]);

  const StatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'taken':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        placeholder="e.g., study-master"
      />
      <div className="absolute inset-y-0 right-3 flex items-center">
        <StatusIcon />
      </div>
    </div>
  );
}
