"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, CalendarDays, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNavigation = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Explore",
      icon: Search,
      href: "/home",
      isActive: pathname === "/home",
    },
    {
      label: "Wishlists",
      icon: Heart,
      href: "/wishlists",
      isActive: pathname === "/wishlists",
    },
    {
      label: "Trips",
      icon: CalendarDays,
      href: "/bookings",
      isActive: pathname === "/bookings",
    },
    {
      label: "Messages",
      icon: MessageCircle,
      href: "/messages",
      isActive: pathname === "/messages",
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
      isActive: pathname === "/profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-2 px-1 min-w-0 flex-1"
            >
              <IconComponent
                className={cn(
                  "w-6 h-6 mb-1",
                  item.isActive ? "text-red-500" : "text-gray-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium truncate",
                  item.isActive ? "text-red-500" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
