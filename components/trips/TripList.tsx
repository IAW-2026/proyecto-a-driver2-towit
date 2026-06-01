"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import mockTripsData from '@/lib/mocks/trips.json'; // Importa el archivo JSON

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
  vehicle: Vehicle;
  origin: Coordinates;
  destination: Coordinates;
  date: string;
  time: string;
  status: string;
  amount: number; // Agregado para mantener la consistencia con el display existente
}

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Como es un mock local, la carga es instantánea
    setIsLoading(true);
    setError(null);
    try {
      // Usar los datos importados directamente
      setTrips(mockTripsData as Trip[]); // Castear para asegurar el tipo
      setIsLoading(false);
    } catch (err: any) {
      setError("Error al cargar los viajes: " + err.message);
      setIsLoading(false);
    }
  }, []);

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
                {format(new Date(`${trip.date}T${trip.time}`), 'dd/MM/yyyy - HH:mm', { locale: es })} - Destino: Lat {trip.destination.lat}, Long {trip.destination.long}
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
