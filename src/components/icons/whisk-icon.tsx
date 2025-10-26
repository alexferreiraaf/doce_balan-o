import type { SVGProps } from 'react';

export const WhiskIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 18L10 12" />
    <path d="M14 18L12 12" />
    <path d="M11 6c-2.5 0-4.5 2-4.5 4.5S8.5 15 11 15s4.5-2 4.5-4.5S13.5 6 11 6z" />
    <path d="M12 6c-2.5 0-4.5 2-4.5 4.5S9.5 15 12 15s4.5-2 4.5-4.5S14.5 6 12 6z" />
    <path d="M11 6c1.23 0 2.4.38 3.32 1.08" />
    <path d="M14.24 7.76c.63-.63 1.35-1.12 2.12-1.5" />
    <path d="M16.36 6.36C17.6 5.12 19.2 4 21 4" />
    <path d="M7.76 16.24c-.63.63-1.35 1.12-2.12 1.5" />
    <path d="M7.64 17.64C6.4 18.88 4.8 20 3 20" />
  </svg>
);
