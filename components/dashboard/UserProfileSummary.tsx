"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { getTowerVehicles } from "@/app/actions/tower";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useNoVehicleErrorModal } from "@/components/providers/NoVehicleErrorModalProvider"; // Importar el hook

interface Vehicle {
  vehicle_id: string;
  brand: string;
  model: string;
  year: number;
  max_load: number;
}

export default function UserProfileSummary() {
  const { user, isLoaded } = useUser();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const { openNoVehicleErrorModal } = useNoVehicleErrorModal(); // Usar el hook para abrir el modal de error

  useEffect(() => {
    async function fetchVehicles() {
      if (isLoaded && user) {
        setIsLoadingVehicles(true);
        const fetchedVehicles = await getTowerVehicles();
        setVehicles(fetchedVehicles);
        setIsLoadingVehicles(false);
      }
    }
    fetchVehicles();
  }, [isLoaded, user]);

  const handleToggleAvailability = () => {
    if (!vehicles || vehicles.length === 0) {
      openNoVehicleErrorModal(); // Abrir el modal personalizado en lugar de alert
      return;
    }
    // Mocking Redis update
    console.log(`Mock: Updating availability in Redis for user ${user?.id} to ${!isAvailable}`);
    setIsAvailable(!isAvailable);
  };

  if (!isLoaded || isLoadingVehicles) {
    return (
      <div className="flex justify-center items-center h-48 bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando perfil y vehículos...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Datos mockeados para la calificación general
  const avgRating = 4.8;
  const currentVehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col items-start h-full justify-between">
      <div className="flex items-center space-x-4 w-full border-b border-slate-800 pb-4 mb-4">
        <Image
          src={user.imageUrl}
          alt={user.fullName || "User Avatar"}
          width={60}
          height={60}
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

      <div className="w-full mb-6"> {/* Added mb-6 for spacing before the new button */}
        <h3 className="text-md font-bold text-white mb-2">Vehículo Actual</h3>
        {currentVehicle ? (
          <div className="space-y-1 text-slate-400 text-sm">
            <p><span className="font-semibold text-white">Marca:</span> {currentVehicle.brand}</p>
            <p><span className="font-semibold text-white">Modelo:</span> {currentVehicle.model}</p>
            <p><span className="font-semibold text-white">Año:</span> {currentVehicle.year}</p>
            <p><span className="font-semibold text-white">Carga Máx.:</span> {currentVehicle.max_load} kg</p>
          </div>
        ) : (
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-3">No tienes vehículos registrados.</p>
            <Link href="/vehicles">
              <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
                Añadir Vehículo
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Botón de disponibilidad */}
      <Button
        onClick={handleToggleAvailability}
        className={`w-full font-bold ${
          isAvailable
            ? "bg-green-600 hover:bg-green-500 text-white"
            : "bg-slate-700 hover:bg-slate-600 text-white"
        }`}
      >
        {isAvailable ? "Disponible" : "No Disponible"}
      </Button>
    </div>
  );
}
