"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Trip {
  id: string;
  date: string;
  customerName: string;
  destination: string;
  status: string;
  amount: number;
}

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMockTrips = async () => {
      setIsLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData: Trip[] = [
        { id: "trip_001", date: "2026-05-29", customerName: "Juan Pérez", destination: "Av. Libertador 1234", status: "Completado", amount: 150.00 },
        { id: "trip_002", date: "2026-05-28", customerName: "María López", destination: "Calle Falsa 123", status: "Completado", amount: 120.50 },
        { id: "trip_003", date: "2026-05-27", customerName: "Carlos Gómez", destination: "Ruta 2 Km 50", status: "Cancelado", amount: 0.00 },
        { id: "trip_004", date: "2026-05-26", customerName: "Ana Fernández", destination: "Diagonal Norte 500", status: "Completado", amount: 200.00 },
        // Puedes dejar este array vacío para probar el estado sin viajes:
        // []
      ];

      if (mockData.length > 0) {
        setTrips(mockData);
      } else {
        setTrips([]);
      }
      setIsLoading(false);
    };

    fetchMockTrips();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900/70 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando viajes...</p>
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
              <p className="text-white text-lg font-semibold truncate">{trip.customerName}</p>
              <p className="text-slate-400 text-sm">{trip.date} - {trip.destination}</p>
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
