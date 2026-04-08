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
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M14.6 9.4L13 13L9.4 14.6L11 11L14.6 9.4Z"
        fill="currentColor"
        opacity="0.9"
      />
    </Svg>
  );
}

export function CollectionIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M4 7C4 5.895 4.895 5 6 5H18C19.105 5 20 5.895 20 7V17C20 18.105 19.105 19 18 19H6C4.895 19 4 18.105 4 17V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 9H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 13H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        d="M12 2.5L14.8 8.5L21.3 9.1L16.3 13.4L17.8 19.8L12 16.5L6.2 19.8L7.7 13.4L2.7 9.1L9.2 8.5L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.95"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

