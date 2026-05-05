"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrototypeStore } from "@/components/prototype-store";

const items = [
  { href: "/", label: "首页" },
  { href: "/profile", label: "我的" }
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearResumeDraft } = usePrototypeStore();

  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {items.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-link${isActive ? " is-active" : ""}`}
            onClick={(event) => {
              if (item.href === "/") {
                if (pathname === "/") {
                  event.preventDefault();
                  clearResumeDraft();
                  return;
                }

                router.push("/");
              }
            }}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
