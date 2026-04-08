import React from "react";

type IconProps = {
  className?: string;
};

function Svg({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? "h-4 w-4"}
    >
      {children}
    </svg>
  );
}

export function StarFilledIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 2.5L14.8 8.5L21.3 9.1L16.3 13.4L17.8 19.8L12 16.5L6.2 19.8L7.7 13.4L2.7 9.1L9.2 8.5L12 2.5Z"
        fill="currentColor"
        opacity="0.98"
      />
    </Svg>
  );
}

export function StarOutlineIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 2.5L14.8 8.5L21.3 9.1L16.3 13.4L17.8 19.8L12 16.5L6.2 19.8L7.7 13.4L2.7 9.1L9.2 8.5L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.98"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M5 12H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 7L18 12L13 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M6.5 9.5L12 15L17.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

