"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Importar la utilidad cn
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trip, getTripsForUser } from "@/app/actions/trips"; // Importar la interfaz Trip y la Server Action
import { useUser } from "@clerk/nextjs"; // Importar useUser para obtener el userId del cliente


interface TripDetailProps {
  tripId: string;
}

// Componente auxiliar para renderizar el contenido del viaje
const RenderTripContent: React.FC<{ tripData: Trip }> = ({ tripData }) => {
  const router = useRouter();

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
        <p>
          <strong className="text-white">ID del Viaje:</strong> {tripData.id}
        </p>
        <p>
          <strong className="text-white">Fecha:</strong> {format(new Date(tripData.date), 'dd/MM/yyyy', { locale: es })}
          {tripData.time && <span className="ml-2">- Hora: {tripData.time}</span>}
        </p>
        <p>
          <strong className="text-white">Cliente:</strong> {tripData.customer.full_name}
        </p>
        <p className="md:col-span-2">
          <strong className="text-white">Origen:</strong> Lat {tripData.origin.lat}, Long {tripData.origin.long}
        </p>
        <p className="md:col-span-2">
          <strong className="text-white">Destino:</strong> Lat {tripData.destination.lat}, Long {tripData.destination.long}
        </p>
        <p>
          <strong className="text-white">Estado:</strong> {tripData.status}
        </p>
        <p>
          <strong className="text-white">Monto Pagado:</strong> {tripData.amount ? `$${tripData.amount.toFixed(2)}` : 'No disponible'}
        </p>

        {tripData.vehicle && (
          <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">Detalles del Vehículo Remolcado</h3>
            <p>
              <strong className="text-white">Marca:</strong> {tripData.vehicle.brand}
            </p>
            <p>
              <strong className="text-white">Modelo:</strong> {tripData.vehicle.model}
            </p>
            <p>
              <strong className="text-white">Año:</strong> {tripData.vehicle.year}
            </p>
            <p>
              <strong className="text-white">Peso:</strong> {tripData.vehicle.weight} kg
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-slate-800">
        <Button onClick={() => router.push("/trips")} className="bg-slate-700 hover:bg-slate-600 text-white font-bold">
          Volver a Mis Viajes
        </Button>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`${`${process.env.NEXT_PUBLIC_PAYMENTS_APP_URL}/disbursements/${tripData.id}`}`} passHref>
            <Button variant="secondary" className="w-full sm:w-auto">
              Ver Recibo
            </Button>
          </Link>
          <Link href={`/feedback/report/${tripData.customer.customer_id}`} passHref>
            <Button variant="destructive" className="w-full sm:w-auto">
              Reportar Cliente
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};


export default function TripDetail({ tripId }: TripDetailProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser(); // Obtener user y isLoaded de Clerk
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTripDetails() {
      if (!isLoaded || !user?.id) {
        setIsLoading(true); // Mantener cargando hasta que user?.id esté disponible
        return;
      }

      const userId = user.id;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getTripsForUser(userId);

        if (result.error) {
          throw new Error(result.error);
        }

        const foundTrip = result.trips?.find(t => t.id === tripId);

        if (foundTrip) {
          setTrip(foundTrip);
        } else {
          setError("Viaje no encontrado.");
        }
      } catch (err: any) {
        console.error("Error fetching trip details:", err);
        setError("Error al cargar los detalles del viaje: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTripDetails();
  }, [tripId, isLoaded, user]); // Asegurarse de que el efecto se re-ejecute si userId cambia

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900/70 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando detalles del viaje...</p>
      </div>
    );
  }

  // Si hay un error o no se encontró el viaje, mostrar el mensaje
  if (error || !trip) {
    return (
      <div className="p-4 rounded-lg text-center bg-red-600/20 text-red-400">
        <p>{error || "No se encontraron datos para este viaje."}</p>
        <Button onClick={() => router.push("/trips")} className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
          Volver a Mis Viajes
        </Button>
      </div>
    );
  }

  // Renderizar los detalles reales del viaje
  return <RenderTripContent tripData={trip} />;
}
