export default function Logo({ className = "logo" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="16" fill="#1c1b19" />
      <path
        d="M16 32h18a8 8 0 1 0 0-16H28"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M48 32H30a8 8 0 1 0 0 16h6"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
