import React from 'react';
import { Link } from 'react-router-dom';

export default function LegalLinks({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${className}`}>
      <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
        Privacy
      </Link>
      <Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
        Cookies
      </Link>
    </div>
  );
}