
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

interface BackButtonProps extends Omit<ButtonProps, 'onClick'> {
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function BackButton({
  label = 'Go back',
  href,
  onClick,
  disabled = false,
  className,
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const commonProps = {
    className: cn(
      'inline-flex items-center space-x-2 h-10 px-4 bg-transparent text-foreground/90 font-semibold hover:bg-secondary/80 hover:text-primary active:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all duration-200 border border-border/60 hover:border-primary/50',
      className
    ),
    disabled,
    'aria-label': label,
    ...props,
  };

  const content = (
    <>
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-semibold">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} passHref legacyBehavior>
        <Button asChild variant="ghost" {...commonProps}>
          <a>{content}</a>
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="ghost" onClick={handleClick} {...commonProps}>
      {content}
    </Button>
  );
}
