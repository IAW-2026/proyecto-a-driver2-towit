"use client";

import React from 'react'; // Ya no se necesita useState ni useEffect
import Link from "next/link";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
// import mockTripsData from '@/lib/mocks/trips.json'; // REMOVIDO: ya no se importa el mock

interface Customer {
  customer_id: string;
  full_name: string;
}

interface Vehicle {
  vehicle_id: string;
  brand: string;
  model: string;
  year: number;
  weight: number;
}

interface Coordinates {
  lat: string;
  long: string;
}

interface Trip {
  id: string; // trip_id del JSON
  tower_id: string;
  customer: Customer;
  vehicle?: Vehicle; // CAMBIO: Hecho opcional
  origin: Coordinates;
  destination: Coordinates;
  date: string;
  time?: string; // CAMBIO: Hecho opcional
  status: string;
  amount?: number; // CAMBIO: Hecho opcional
}

// CAMBIO: Se define la interfaz de las props para TripList
interface TripListProps {
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
}

// CAMBIO: TripList ahora acepta props
export default function TripList({ trips, isLoading, error }: TripListProps) {
  // REMOVIDO: Eliminado useState y useEffect para la carga de datos

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900/70 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando historial de viajes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg text-center bg-red-600/20 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 text-center">
        <p className="text-slate-400 text-lg">Aún no tienes viajes registrados. ¡Es hora de empezar a remolcar!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
      <ul className="space-y-4">
        {trips.map((trip) => (
          <li key={trip.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-lg font-semibold truncate">{trip.customer.full_name}</p>
              <p className="text-slate-400 text-sm">
                {/* CAMBIO: Se usa solo la fecha ya que la hora no viene de la API */}
                {format(new Date(trip.date), 'dd/MM/yyyy', { locale: es })} - Destino: Lat {trip.destination.lat}, Long {trip.destination.long}
              </p>
              <p className="text-slate-500 text-xs mt-1">Status: {trip.status}</p>
            </div>
            <Link href={`/trips/${trip.id}`} className="shrink-0">
              <Button variant="secondary" size="sm">
                Ver Detalles
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
