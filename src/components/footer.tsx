'use client';

import { Logo } from '@/components/logo';
import Link from 'next/link';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/premium' },
    { name: 'FAQ', href: '#faq' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  social: [
    { name: 'Twitter', href: '#' },
    { name: 'LinkedIn', href: '#' },
    { name: 'GitHub', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-secondary/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Logo and Branding */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-semibold">FocusFlow AI</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Your personal AI study partner.
            </p>
          </div>

          {/* Column 2: Product Links */}
          <div>
            <h3 className="font-semibold">Product</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company Links */}
          <div>
            <h3 className="font-semibold">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Social Links */}
          <div>
            <h3 className="font-semibold">Connect</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.social.map(link => (
                <li key={link.name}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FocusFlow AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}