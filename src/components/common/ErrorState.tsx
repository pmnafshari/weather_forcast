import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Unable to load weather data.', onRetry }: ErrorStateProps) {
  const isRateLimited = message.toLowerCase().includes('rate limit');
  return (
    <div className="wi-card flex flex-col items-center justify-center py-8 text-center">
      <AlertTriangle className={`h-8 w-8 mb-3 ${isRateLimited ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`} />
      <p className="text-sm font-medium text-[#F8FAFC]">{message}</p>
      {isRateLimited && (
        <p className="text-xs text-[#64748B] mt-2 max-w-sm">
          The free weather API has a daily request limit. Data will refresh automatically when the limit resets.
        </p>
      )}
      {onRetry && !isRateLimited && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#60A5FA] hover:text-[#3B82F6] transition-colors"
          aria-label="Retry loading data"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
      {isRateLimited && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#F59E0B]">
          <Clock className="h-3 w-3" />
          <span>Please wait and try again later</span>
        </div>
      )}
    </div>
  );
}