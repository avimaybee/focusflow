
'use client';

import Link from 'next/link';
import { Logo } from './logo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { href: '#features', label: 'Features' },
      { href: '/premium', label: 'Premium' },
      { href: '#testimonials', label: 'Testimonials' },
      { href: '/login', label: 'Sign In' },
    ],
    resources: [
      { href: '/blog', label: 'Blog' },
      { href: '#faq', label: 'FAQ' },
    ],
    company: [
      { href: '#', label: 'About Us' },
      { href: '#', label: 'Contact' },
    ],
    legal: [
      { href: '#', label: 'Privacy Policy' },
      { href: '#', label: 'Terms of Service' },
    ],
  };

  return (
    <footer className="w-full shrink-0 bg-secondary/30 border-t border-border/60">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Logo className="h-8 w-8" />
              <span className="font-bold text-lg">FocusFlow AI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your AI-powered co-pilot for smarter, faster learning.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:col-span-3 gap-8">
            <div>
              <h3 className="font-semibold text-sm tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wider uppercase mb-4">
                Resources
              </h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wider uppercase mb-4">
                Company
              </h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wider uppercase mb-4">
                Legal
              </h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
          <p className="text-center md:text-left mb-2 md:mb-0">
            &copy; {currentYear} FocusFlow. All rights reserved.
          </p>
          <p className="text-center md:text-right">
            Disclaimer: FocusFlow AI can make mistakes. Please verify important
            information.
          </p>
        </div>
      </div>
    </footer>
  );
};
