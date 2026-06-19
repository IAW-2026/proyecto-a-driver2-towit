
import { auth } from "@clerk/nextjs/server";
import AppHeaderClient from "./AppHeaderClient"; // Importar el componente cliente

export default async function AppHeader() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return <AppHeaderClient isSignedIn={isSignedIn} />;
}