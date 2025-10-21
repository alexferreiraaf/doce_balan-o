import type { SVGProps } from 'react';

export const WhiskIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 18a2 2 0 0 0-2 2h12a2 2 0 0 0-2-2Z" />
    <path d="M8 18V7.5c0-2 2-3.5 4-3.5s4 1.5 4 3.5V18" />
    <path d="M12 4v2" />
    <path d="M12 11h.01" />
    <path d="M15 7.5c0 3.11-2.5 5.5-2.5 5.5" />
    <path d="M9 7.5c0 3.11 2.5 5.5 2.5 5.5" />
  </svg>
);
