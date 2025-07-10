
'use client';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full shrink-0">
      <div className="container mx-auto flex h-12 items-center justify-between px-4 text-xs text-muted-foreground">
        <p className="text-left">
          FocusFlow AI can make mistakes. Verify important information.
        </p>
        <p className="text-right">
          &copy; {currentYear} FocusFlow. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
