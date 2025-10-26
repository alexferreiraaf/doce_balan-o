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
    <path d="M12 17.5a2.5 2.5 0 0 1-2.5-2.5V12h5v3a2.5 2.5 0 0 1-2.5 2.5Z" />
    <path d="M12 17.5v2.5" />
    <path d="M12 12a5 5 0 0 1 5-5" />
    <path d="M7 7a5 5 0 0 1 5-5" />
    <path d="M12 12H7a5 5 0 0 0-5 5v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v0a5 5 0 0 0-5-5h-5Z" />
  </svg>
);
