"use client"; // Se necesita "use client" para usar componentes interactivos de Clerk

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          Bienvenido a TowIt
        </h1>
        <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Tu plataforma para servicios de remolque. Inicia sesión o regístrate para empezar.
        </p>
        <div className="flex gap-4 mt-6">
          <SignInButton mode="modal">
            <Button>
              Iniciar Sesión
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline">
              Registrarse
            </Button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}
