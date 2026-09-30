"use client";

export function PaymentProcessing({
  status = "processing",
}: {
  status?: "processing" | "success";
}) {
  const isSuccess = status === "success";

  return (
    <div className="rounded-2xl border border-border-default bg-surface-raised p-8 text-text-primary shadow-lift max-w-lg">
      <div className="flex flex-col items-center text-center">
        {/* Animated Icon Badge */}
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-soft border border-border-soft">
          {!isSuccess ? (
            <>
              {/* Subtle pulsing background ring that respects reduced motion */}
              <span className="absolute inset-0 rounded-2xl bg-rausch/10 motion-safe:animate-ping" />
              <svg
                viewBox="0 0 24 24"
                className="relative h-8 w-8 text-rausch motion-safe:animate-pulse"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-rausch transition-transform duration-300 scale-110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Status Heading */}
        <h3 className="text-xl font-semibold">
          {isSuccess ? "Payment confirmed!" : "Processing your payment"}
        </h3>

        {/* Reassuring Copy */}
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          {isSuccess
            ? "Your reservation has been confirmed. Preparing your itinerary..."
            : "Processing your payment — this is a demo, no real charge will be made."}
        </p>

        {/* Progress Bar Component */}
        <div className="mt-6 w-full max-w-xs overflow-hidden rounded-full bg-surface-soft h-1.5">
          {!isSuccess ? (
            <div className="h-full w-full bg-rausch origin-left motion-safe:animate-[pulse_1.2s_ease-in-out_infinite]" />
          ) : (
            <div className="h-full w-full bg-rausch transition-all duration-300" />
          )}
        </div>
      </div>
    </div>
  );
}
