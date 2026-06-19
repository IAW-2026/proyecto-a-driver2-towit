'use client';

import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function AppHeaderClientGuest() {
  return (
    <>
      <SignInButton mode="modal" forceRedirectUrl={"/dashboard"} signUpForceRedirectUrl={"/dashboard"}>
        <button className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
          Iniciar Sesión
        </button>
      </SignInButton>
      <SignUpButton mode="modal" unsafeMetadata={{role: "tower"}} forceRedirectUrl="/dashboard" signInFallbackRedirectUrl={"/dashboard"}>
        <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-yellow-500/10">
          Registrarse
        </button>
      </SignUpButton>
    </>
  );
}
