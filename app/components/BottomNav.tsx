"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { CollectionIcon, CompassIcon, StarIcon } from "./NavIcons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/reading", label: "阅览", icon: <CollectionIcon /> },
  { href: "/scan", label: "扫描", icon: <CompassIcon /> },
  { href: "/collections", label: "收藏", icon: <StarIcon /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="底部导航"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/40 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-3">
        {NAV_ITEMS.map((item) => {
          const selected =
            item.href === "/scan"
              ? pathname.startsWith("/scan")
              : item.href === "/reading"
                ? pathname.startsWith("/reading")
                : item.href === "/collections"
                  ? pathname.startsWith("/collections")
                  : false;

          const hrefLabel = `跳转到${item.label}`;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={hrefLabel}
              className={[
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 outline-none transition",
                selected
                  ? "text-white"
                  : "text-white/60 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "transition",
                  selected ? "text-[#6D28D9]" : "text-white/60",
                ].join(" ")}
              >
                {item.icon}
              </span>
              <span className="text-[11px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

