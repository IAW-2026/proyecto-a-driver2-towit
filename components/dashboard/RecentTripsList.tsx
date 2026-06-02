"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import mockTripsData from '@/lib/mocks/trips.json'; // Importa el archivo JSON

interface Customer {
  full_name: string;
}

interface Coordinates {
  lat: string;
  long: string;
}

interface Trip {
  id: string;
  date: string;
  time: string; // Incluir la hora para ordenar correctamente
  customer: Customer;
  destination: Coordinates;
  status: string;
}

export default function RecentTripsList() {
  // Obtener los últimos 2 viajes del JSON
  const recentTrips: Trip[] = mockTripsData
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()) // Ordenar por fecha y hora descendente
    .slice(0, 2) as Trip[]; // Tomar los dos más recientes

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Últimos viajes</h3>
      <ul className="space-y-3 flex-1">
        {recentTrips.map((trip) => (
          <li key={trip.id} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
            <p className="text-white text-base">{trip.customer.full_name}</p>
            <p className="text-slate-400 text-sm">
              {format(new Date(`${trip.date}T${trip.time}`), 'dd/MM/yyyy - HH:mm', { locale: es })} - Destino: Lat {trip.destination.lat}, Long {trip.destination.long}
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
