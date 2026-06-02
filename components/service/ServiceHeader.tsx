import Link from "next/link";
import { Button } from "../ui/button";
import { UserButton } from "@clerk/nextjs";
import React from "react";

interface ServiceHeaderProps {
  isAvailable: boolean;
  setIsAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  isTripActive: boolean; // Nueva prop para indicar si un viaje está activo
}

export default function ServiceHeader({ isAvailable, setIsAvailable, isTripActive }: ServiceHeaderProps) {
  const handleToggleAvailability = () => {
    setIsAvailable(prev => !prev);
  };

  return (
    <header className="absolute top-0 left-0 w-full z-[1000] p-4 bg-slate-950/85 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-2xl font-black tracking-wider text-yellow-500 hover:text-yellow-400 transition-colors">
            Tow<span className="text-white">It</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-slate-800/50">Dashboard</Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleToggleAvailability}
            className={`font-bold ${
              isAvailable
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
            disabled={isTripActive} // Deshabilitar si hay un viaje activo
          >
            {isAvailable ? "Disponible" : "No Disponible"}
          </Button>
        </div>
      </div>
    </header>
  );
}
