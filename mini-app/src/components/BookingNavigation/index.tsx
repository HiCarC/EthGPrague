"use client";

import { useState } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { Home, Building, Calendar, User } from "lucide-react";

export type NavigationTab =
  | "browse"
  | "my-properties"
  | "my-bookings"
  | "profile";

interface BookingNavigationProps {
  activeTab?: NavigationTab;
  onTabChange?: (tab: NavigationTab) => void;
}

export const BookingNavigation = ({
  activeTab = "browse",
  onTabChange,
}: BookingNavigationProps) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>(activeTab);

  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: "browse" as NavigationTab, label: "Browse", icon: Home },
    {
      id: "my-properties" as NavigationTab,
      label: "My Properties",
      icon: Building,
    },
    {
      id: "my-bookings" as NavigationTab,
      label: "My Bookings",
      icon: Calendar,
    },
    { id: "profile" as NavigationTab, label: "Profile", icon: User },
  ];

  return (
    <div className="flex gap-2 p-4 bg-white rounded-lg shadow-sm border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <Button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            variant={isActive ? "primary" : "secondary"}
            size="sm"
            className="flex-1 flex items-center gap-2"
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
