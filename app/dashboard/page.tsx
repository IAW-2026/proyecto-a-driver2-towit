'use client';

import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import TowerDashboard from "@/components/TowerDashboard";

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <TowerDashboard />
      <AppFooter />
    </>
  );
}
