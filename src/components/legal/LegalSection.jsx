import React from 'react';

export default function LegalSection({ title, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}