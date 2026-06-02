"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { getTowerVehicles } from "@/app/actions/vehicle"; // Usar la nueva Server Action para vehículos
import { useEffect, useState, useRef } from "react"; // Importa useRef
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNoVehicleErrorModal } from "@/components/providers/NoVehicleErrorModalProvider";

interface Vehicle {
  vehicle_id: string;
  createdAt: Date; // Asumiendo que createdAt está disponible para ordenar
  brand: string;
  model: string;
  year: number;
  max_load: number;
}

export default function UserProfileSummary() {
  const { user, isLoaded } = useUser();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const { openNoVehicleErrorModal } = useNoVehicleErrorModal();

  // Usa una referencia para rastrear si ya se ha realizado la petición para el userId actual.           
  const fetchExecutedRef = useRef<{ userId: string | null; executed: boolean }>({
    userId: null,
    executed: false,
  });

  useEffect(() => {
    // Si el usuario no está cargado o no hay un objeto de usuario, resetea el estado de la referencia.  
    if (!isLoaded || !user || !user.id) {
      fetchExecutedRef.current = { userId: null, executed: false };
      return;
    }

    // Si el userId es el mismo que el que ya procesamos y ya ejecutamos la petición, no hacemos nada.   
    if (
      fetchExecutedRef.current.userId === user.id &&
      fetchExecutedRef.current.executed
    ) {
      return;
    }

    // Marca la petición como ejecutada para el userId actual.                                           
    fetchExecutedRef.current = { userId: user.id, executed: true };

    // Define la función asíncrona para la carga de vehículos.
    async function fetchVehicles() {
      setIsLoadingVehicles(true);
      try {
        const result = await getTowerVehicles(); // Llamar a la nueva Server Action
        if (result.success && result.data && (result.data as Vehicle[]).length > 0) {
          const fetchedVehicles = result.data as Vehicle[];
          setVehicles(fetchedVehicles);
          // Seleccionar el vehículo más recientemente añadido (el último si está ordenado ascendentemente por createdAt)
          // Asumiendo que result.data ya viene ordenado por createdAt en orden ascendente o el último es el más reciente.
          // Si no, necesitaríamos ordenar aquí:
          // const sortedVehicles = [...fetchedVehicles].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setSelectedVehicleId(fetchedVehicles[fetchedVehicles.length - 1].vehicle_id);
        } else {
          console.error("Error al obtener vehículos del Tower:", result.error);
          setVehicles([]); // Asegurarse de que vehicles sea un array vacío en caso de error
          setSelectedVehicleId(null); // No hay vehículo seleccionado si no hay ninguno
        }
      } catch (error) {
        console.error("Excepción al obtener vehículos del Tower:", error);
        setVehicles([]);
      } finally {
        setIsLoadingVehicles(false);
      }
    }

    fetchVehicles();
  }, [isLoaded, user]); // Las dependencias se mantienen para reaccionar a la carga del usuario.

  const handleToggleAvailability = () => {
    if (!vehicles || vehicles.length === 0) {
      openNoVehicleErrorModal();
      return;
    }
    console.log(`Mock: Updating availability in Redis for user ${user?.id} to ${!isAvailable}`);
    setIsAvailable(!isAvailable);
  };

  if (!isLoaded || isLoadingVehicles) {
    return (
      <div className="flex justify-center items-center h-48 bg-slate-900/70 p-6 rounded-lg shadow-lg     
border border-slate-800">
        <p className="text-slate-400">Cargando perfil y vehículos...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const avgRating = 4.8;
  const currentVehicle = vehicles?.find(v => v.vehicle_id === selectedVehicleId) || null;

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col       
h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full flex-1">
        <div className="flex flex-col items-start justify-between">
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
          <div className="flex gap-4 w-full mt-auto">
            <Button
              onClick={handleToggleAvailability}
              className={`flex-1 font-bold ${isAvailable
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
              disabled={!selectedVehicleId} // Deshabilitar si no hay vehículo seleccionado
            >
              {isAvailable ? "Disponible" : "No Disponible"}
            </Button>
            <Link href="/service" className="flex-1">
              <Button
                className="w-full font-bold bg-yellow-600 hover:bg-yellow-500 text-slate-950"
                disabled={!isAvailable} // El botón "Empezar" se deshabilita si no está disponible
              >
                Empezar
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex flex-col w-full h-full">
          <h3 className="text-md font-bold text-white mb-2">Vehículo Actual</h3>
          {vehicles && vehicles.length > 0 ? (
            <div className="flex flex-col space-y-2 flex-1">
              <Select
                value={selectedVehicleId || ''}
                onValueChange={(value) => setSelectedVehicleId(value)}
              >
                <SelectTrigger className="w-full bg-slate-900/70 border-slate-700 text-white">
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 border-slate-700 text-white">
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.max_load + "kg"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/vehicles" className="mt-auto w-full">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
                  Añadir Vehículos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-800/50 rounded-lg flex-1 flex flex-col              
justify-center items-center">
              <p className="text-slate-400 text-sm mb-3">No tienes vehículos registrados.</p>
              <Link href="/vehicles" className="w-full">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
                  Añadir Vehículo
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
