export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h2 className="text-[22px] font-semibold">Something went wrong</h2>
      <p className="mt-3 text-text-secondary">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-6 h-12 rounded-lg border border-text-primary px-6 font-semibold"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
