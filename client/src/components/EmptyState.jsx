import React from 'react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-14 px-6">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg text-slate-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
