"use client";

import { Settings } from "./components/Settings";

export default function SettingsPage() {
  const handleDataChanged = () => {
    // This could trigger a global data refresh if needed
    // For now, individual components handle their own refreshing
  };

  return <Settings onDataChanged={handleDataChanged} />;
}
