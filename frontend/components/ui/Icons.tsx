export function AirbnbLogo({ className = "h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        fill="#FF385C"
        d="M16 1c2 4.5 8.5 14.3 11.6 19.6 1.8 3.1 1.2 7-1.9 8.8-3 1.7-6.9 1-8.8-1.8L16 26l-.9 1.6c-1.9 2.8-5.8 3.5-8.8 1.8-3.1-1.8-3.7-5.7-1.9-8.8C7.5 15.3 14 5.5 16 1z"
      />
    </svg>
  );
}

export function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
      <path
        d="M16 28c-.3 0-.5-.1-.7-.2C11.6 25.4 2 17.8 2 10.8 2 6.6 5.4 3.5 9.4 3.5c2.3 0 4.4 1.1 5.8 2.9C16.6 4.6 18.7 3.5 21 3.5 25 3.5 28.4 6.6 28.4 10.8c0 7-9.6 14.6-13.3 16.9-.2.2-.5.3-.8.3z"
        fill={filled ? "#FF385C" : "rgba(0,0,0,0.5)"}
        stroke={filled ? "#FF385C" : "#fff"}
        strokeWidth="2"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="m28 28-7.3-7.3M13.3 22.7A9.3 9.3 0 1 1 13.3 4a9.3 9.3 0 0 1 0 18.7Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="m16 2.7 4.1 8.4 9.2 1.3-6.7 6.5 1.6 9.2L16 23.7 7.8 28.1l1.6-9.2-6.7-6.5 9.2-1.3L16 2.7z"
      />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M2 8h28v2.5H2V8zm0 7h28v2.5H2V15zm0 7h28v2.5H2V22z"
      />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM1.5 8a6.5 6.5 0 0 1 4-6v1.5h1.5V1.7A6.5 6.5 0 0 1 8 1.5c.5 0 1 .06 1.5.17v1.63H11V2.1A6.5 6.5 0 0 1 14.5 8H13v1.5h1.4A6.5 6.5 0 0 1 11 13.9v-1.6H9.5v1.63A6.5 6.5 0 0 1 8 14.5c-.5 0-1-.06-1.5-.17V12.7H5v1.6A6.5 6.5 0 0 1 1.6 9.5H3V8H1.5Z"
      />
    </svg>
  );
}

export function FiltersIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15 3H7.95A2.5 2.5 0 0 0 3.05 3H1v1h2.05A2.5 2.5 0 0 0 7.95 4H15V3ZM11 12.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM1 12h7.05a2.5 2.5 0 0 0 4.9 0H15v1h-2.05a2.5 2.5 0 0 0-4.9 0H1v-1Z"
      />
    </svg>
  );
}

export function CategoryGlyph({ icon }: { icon: string }) {
  const common = "h-6 w-6";
  switch (icon) {
    case "waves":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 12c2 2 4 2 6 0s4-2 6 0 4 2 6 0" />
          <path d="M3 17c2 2 4 2 6 0s4-2 6 0 4 2 6 0" />
        </svg>
      );
    case "cabin":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "villa":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 20V8l8-4 8 4v12" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "whatshot":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3s6 6 6 11a6 6 0 1 1-12 0c0-2 2-5 4-7 0 3 2 4 2 4" />
        </svg>
      );
    case "landscape":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="m3 18 6-8 4 5 3-4 5 7H3Z" />
        </svg>
      );
    case "water":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3c4 6 7 9 7 12a7 7 0 1 1-14 0c0-3 3-6 7-12Z" />
        </svg>
      );
    case "park":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3 5 13h14L12 3Z" />
          <path d="M12 13v8" />
        </svg>
      );
    case "architecture":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="8" width="16" height="12" />
          <path d="M4 12h16M12 8v12" />
        </svg>
      );
    case "palmtree":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 22V10" />
          <path d="M12 10c-4-1-7 2-8 5 5 0 8-2 8-5Z" />
          <path d="M12 10c4-1 7 2 8 5-5 0-8-2-8-5Z" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="m12 2 2.4 7.2H22l-6 4.4 2.3 7.2L12 16.8 5.7 20.8 8 13.6 2 9.2h7.6L12 2z" />
        </svg>
      );
    case "bed":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 18v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6" />
          <path d="M3 14h18M6 9V6h5v3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 11 12 4l8 7v9H4v-9Z" />
        </svg>
      );
  }
}

export function ChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

export function MapPinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function CheckShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
