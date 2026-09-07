type IconProps = { className?: string };

const base = "h-5 w-5";

export function IconDashboard({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconTruck({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="1" y="6" width="13" height="10" rx="1.2" />
      <path d="M14 10h4l4 3.5V16h-8z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

export function IconUsers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M15.5 14.2c2.9.4 5 2.5 5 5.8" />
    </svg>
  );
}

export function IconReport({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M6 2.5h9l3.5 3.5V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
      <path d="M15 2.5V6a1 1 0 0 0 1 1h3.5" />
      <path d="M8 13h8M8 17h8M8 9h3" />
    </svg>
  );
}

export function IconLogout({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconDownload({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function IconWhatsapp({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2c-5.5 0-10 4.5-10 10 0 1.76.46 3.45 1.34 4.95L2 22l5.2-1.36a9.94 9.94 0 0 0 4.84 1.24h.01c5.5 0 10-4.5 10-10s-4.5-9.88-10.01-9.88zm5.85 14.1c-.25.7-1.46 1.34-2 1.42-.53.08-1.02.35-3.4-.7-2.86-1.25-4.7-4.15-4.85-4.35-.14-.2-1.15-1.53-1.15-2.92s.72-2.07 1-2.35c.26-.28.57-.35.76-.35.2 0 .38 0 .55.01.18.01.42-.07.65.5.25.6.85 2.08.92 2.24.07.15.12.34.02.54-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.75 1.24 1.62 2.01 1.12.99 2.05 1.3 2.35 1.45.3.15.48.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.08.13.08.72-.17 1.42z" />
    </svg>
  );
}

export function IconMail({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}

export function IconAlert({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M12 2.5L1.5 21h21z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconClock({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  );
}

export function IconEdit({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
