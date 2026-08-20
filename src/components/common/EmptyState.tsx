import { CloudOff } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({ title = 'Data unavailable', message = 'Not provided by the weather service.' }: EmptyStateProps) {
  return (
    <div className="wi-card flex flex-col items-center justify-center py-8 text-center">
      <CloudOff className="h-8 w-8 text-[#64748B] mb-3" />
      <p className="text-sm font-medium text-[#94A3B8]">{title}</p>
      {message && <p className="text-xs text-[#64748B] mt-1">{message}</p>}
    </div>
  );
}
