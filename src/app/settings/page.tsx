"use client";

import { useState } from "react";
import { Settings } from "./components/Settings";

export default function SettingsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataChanged = () => {
    // Trigger a refresh of goals and other data
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Settings
      onDataChanged={handleDataChanged}
      refreshTrigger={refreshTrigger}
    />
  );
}
