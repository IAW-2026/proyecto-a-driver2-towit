import { auth } from "@clerk/nextjs/server";
import LandingPage from "@/components/LandingPage";
import TowerDashboard from "@/components/TowerDashboard";

export default async function HomePage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return isSignedIn ? <TowerDashboard /> : <LandingPage />;
}
