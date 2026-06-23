"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react"; // CAMBIO: Añadir useState y useEffect
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser } from "@clerk/nextjs"; // CAMBIO: Importar useUser para obtener el userId del cliente

// REMOVIDO: Eliminado mockTripsData

import { getTripsForUser, Trip } from "@/app/actions/trips"; // CAMBIO: Importar la Server Action y la interfaz Trip

export default function RecentTripsList() {
  const { user, isLoaded } = useUser(); // CAMBIO: Obtener user y isLoaded de Clerk
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentTrips() {
      if (!isLoaded || !user?.id) {
        setIsLoading(true);
        return;
      }

      const userId = user.id;

      setIsLoading(true);
      setError(null);

      try {
        // CAMBIO: Llamar directamente a la Server Action
        const result = await getTripsForUser(userId);

        if (result.error) {
          throw new Error(result.error);
        }
        
        const apiTrips: Trip[] = result.trips || []; // La Server Action ya maneja el caso de no encontrar viajes

        // Ordenar por fecha y tomar los 2 más recientes
        const sortedRecentTrips = apiTrips
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ordenar por fecha descendente
          .slice(0, 2); // Tomar los dos más recientes

        setRecentTrips(sortedRecentTrips);

      } catch (err: any) {
        console.error("Error fetching recent trips:", err);
        setError("Error al cargar los últimos viajes: " + err.message);
        setRecentTrips([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentTrips();
  }, [isLoaded, user]);

  if (!isLoaded || isLoading) {
    return (
      <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full items-center justify-center">
        <p className="text-slate-400">Cargando últimos viajes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full items-center justify-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (recentTrips.length === 0) {
    return (
      <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full items-center justify-center">
        <p className="text-slate-400">Aún no hay viajes recientes para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Últimos viajes</h3>
      <ul className="space-y-3 flex-1">
        {recentTrips.map((trip) => (
          <li key={trip.id} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
            <p className="text-white text-base">{trip.customer.full_name}</p>
            <p className="text-slate-400 text-sm">
              {/* CAMBIO: Se usa solo la fecha ya que la hora no viene de la API */}
              {format(new Date(trip.date), 'dd/MM/yyyy', { locale: es })} - Destino: Lat {trip.destination.lat}, Long {trip.destination.long}
            </p>
          </li>
        ))}
      </ul>
      <Link href="/trips" className="mt-6 w-full block">
        <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
          Ver todos los viajes
        </Button>
      </Link>
    </div>
  );
}
