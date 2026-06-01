"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

export default function RecentTripsList() {
  // Datos mockeados
  const recentTrips = [
    { id: "trip_001", date: "2026-05-28", customer: "Juan Pérez", destination: "Av. Libertador 1234" },
    { id: "trip_002", date: "2026-05-27", customer: "María López", destination: "Calle Falsa 123" },
  ];

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Últimos viajes</h3>
      <ul className="space-y-3 flex-1">
        {recentTrips.map((trip) => (
          <li key={trip.id} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
            <p className="text-white text-base">{trip.customer}</p>
            <p className="text-slate-400 text-sm">{trip.date} - {trip.destination}</p>
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
