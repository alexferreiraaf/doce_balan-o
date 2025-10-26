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
    <path d="M17.5 11C17.5 6.58 14.42 3 10 3s-7.5 3.58-7.5 8c0 1.4.34 2.72 1 3.9" />
    <path d="M9 11.5v.5a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2v-.5" />
    <path d="M2.5 16.25a7.5 7.5 0 0 0 15 0" />
    <path d="M2.5 21h15" />
    <path d="m9 16.25 1-4.75" />
    <path d="m15 16.25-1-4.75" />
  </svg>
);
