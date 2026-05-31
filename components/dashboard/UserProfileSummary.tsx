"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";

export default function UserProfileSummary() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-48 bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Datos mockeados para la calificación general
  const avgRating = 4.8; 

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex items-center space-x-4">
      <Image
        src={user.imageUrl}
        alt={user.fullName || "User Avatar"}
        width={80}
        height={80}
        className="rounded-full border-2 border-yellow-500 object-cover"
        loading="eager"
      />
      <div className="flex-1">
        <h2 className="text-xl font-bold text-white leading-tight">
          {user.fullName}
        </h2>
        <p className="text-sm text-yellow-400 mt-1">
          Calificación: {avgRating}
        </p>
      </div>
    </div>
  );
}
