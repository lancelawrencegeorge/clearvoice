import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LegalLinks from './LegalLinks';

export default function LegalLayout({ title, subtitle, updated, children }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/ccdfa1a60_image.png"
              alt="ClearVoice"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="font-bold text-lg">ClearVoice</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{title}</h1>
        {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}
        <div className="space-y-5">{children}</div>
        <p className="text-xs text-muted-foreground/60 mt-10">Last updated {updated}.</p>
      </main>

      <footer className="border-t border-border/30 py-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col items-center gap-2 text-xs text-muted-foreground/60">
          <LegalLinks className="justify-center" />
          <p>© {new Date().getFullYear()} ClearVoice · A product of SONKAY</p>
        </div>
      </footer>
    </div>
  );
}