"use client";

import { TabItem, Tabs } from "@worldcoin/mini-apps-ui-kit-react";
import { Bank, Home, User, Calendar } from "iconoir-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

export const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState("home");

  // Update the selected tab based on current route
  useEffect(() => {
    if (pathname.includes("/wallet")) {
      setValue("wallet");
    } else if (pathname.includes("/profile")) {
      setValue("profile");
    } else if (pathname.includes("/bookings")) {
      setValue("bookings");
    } else {
      setValue("home");
    }
  }, [pathname]);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);

    // Navigate to the corresponding page
    switch (newValue) {
      case "home":
        router.push("/home");
        break;
      case "bookings":
        router.push("/bookings");
        break;
      case "wallet":
        router.push("/wallet");
        break;
      case "profile":
        router.push("/profile");
        break;
      default:
        router.push("/home");
    }
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <TabItem value="home" icon={<Home />} label="Home" />
      <TabItem value="bookings" icon={<Calendar />} label="Bookings" />
      <TabItem value="wallet" icon={<Bank />} label="Wallet" />
      <TabItem value="profile" icon={<User />} label="Profile" />
    </Tabs>
  );
};
