"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Importar la utilidad cn
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

interface TripDetailData {
  id: string; // trip_id del JSON
  tower_id: string;
  customer: Customer;
  vehicle: Vehicle;
  origin: Coordinates;
  destination: Coordinates;
  date: string;
  time: string;
  status: string;
  amount: number;
  // customerRating: number | null; // La calificación del cliente vendría de Feedback App
  receiptLink: string; // Placeholder for now
  reportCustomerLink: string; // Placeholder for now
}

// Define un viaje mockeado de fallback que se usará para la vista previa.
// Usamos el primer elemento del JSON para el fallback, o un objeto vacío si el JSON está vacío.
const FALLBACK_MOCK_TRIP: TripDetailData = (mockTripsData[0] || {
  id: "trip_fallback",
  tower_id: "tower_fallback_id",
  customer: { customer_id: "cust_fallback_id", full_name: "Cliente de Ejemplo" },
  vehicle: { vehicle_id: "veh_fallback_id", brand: "Marca", model: "Modelo", year: 2000, weight: 1000 },
  origin: { lat: "-34.0000", long: "-58.0000" },
  destination: { lat: "-34.1000", long: "-58.1000" },
  date: "2026-01-01",
  time: "12:00",
  status: "Completado",
  amount: 100.00,
  receiptLink: "#",
  reportCustomerLink: "#"
}) as TripDetailData;


interface TripDetailProps {
  tripId: string;
}

// Componente auxiliar para renderizar el contenido del viaje
const RenderTripContent: React.FC<{ tripData: TripDetailData; isMock?: boolean }> = ({ tripData, isMock }) => {
  const router = useRouter(); // Se necesita useRouter para el botón "Volver a Mis Viajes" aquí también

  return (
    <div className={cn(
      "bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800",
      isMock && "relative opacity-50 grayscale pointer-events-none" // Estilo para la vista previa
    )}>
      {isMock && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 text-white text-xl font-bold rounded-lg">
          Vista Previa (Datos de Ejemplo)
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
        <p>
          <strong className="text-white">ID del Viaje:</strong> {tripData.id}
        </p>
        <p>
          <strong className="text-white">Fecha y Hora:</strong> {format(new Date(`${tripData.date}T${tripData.time}`), 'dd/MM/yyyy - HH:mm', { locale: es })}
        </p>
        <p>
          <strong className="text-white">Cliente:</strong> {tripData.customer.full_name}
        </p>
        {/* La calificación del cliente se obtendría de Feedback App, por ahora se omite */}
        {/* <p>
          <strong className="text-white">Calificación del Cliente:</strong>{" "}
          {tripData.customerRating !== null ? `${tripData.customerRating}/5` : "No calificado"}
        </p> */}
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
          <strong className="text-white">Monto Pagado:</strong> ${tripData.amount.toFixed(2)}
        </p>
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
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-slate-800">
        <Button onClick={() => router.push("/trips")} className="bg-slate-700 hover:bg-slate-600 text-white font-bold">
          Volver a Mis Viajes
        </Button>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={tripData.receiptLink || "#"} passHref>
            <Button variant="secondary" className="w-full sm:w-auto">
              Ver Recibo
            </Button>
          </Link>
          <Link href={tripData.reportCustomerLink || "#"} passHref>
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
  const [trip, setTrip] = useState<TripDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const foundTrip = mockTripsData.find(t => t.id === tripId) as TripDetailData | undefined;
      if (foundTrip) {
        setTrip(foundTrip);
        // Aquí podrías mockear receiptLink y reportCustomerLink si fueran dinámicos,
        // pero por ahora, los hardcodeamos en el mock JSON si es necesario.
        // Si no están en el JSON, se podrían generar aquí.
        foundTrip.receiptLink = `/payments/${foundTrip.id}`; // Asumimos un enlace directo al pago
        foundTrip.reportCustomerLink = `/feedback/report/${foundTrip.customer.customer_id}`; // Placeholder
      } else {
        setError("Viaje no encontrado.");
      }
      setIsLoading(false);
    } catch (err: any) {
      setError("Error al cargar los detalles del viaje: " + err.message);
      setIsLoading(false);
    }
  }, [tripId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900/70 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando detalles del viaje...</p>
      </div>
    );
  }

  // Si hay un error o no se encontró el viaje, mostrar el mensaje y luego la vista previa
  if (error || !trip) {
    return (
      <div className="flex flex-col gap-8">
        {error && (
          <div className="p-4 rounded-lg text-center bg-red-600/20 text-red-400">
            <p>{error}</p>
            <Button onClick={() => router.push("/trips")} className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
              Volver a Mis Viajes
            </Button>
          </div>
        )}
        {!error && !trip && ( // Caso para "viaje no encontrado" sin un error explícito de la API
          <div className="p-4 rounded-lg text-center bg-slate-900/70 text-slate-400">
            <p>No se encontraron datos para este viaje.</p>
            <Button onClick={() => router.push("/trips")} className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
              Volver a Mis Viajes
            </Button>
          </div>
        )}
        <div className="mt-4">
          <p className="text-slate-400 text-center mb-4">Así se vería la página sin errores (ejemplo):</p>
          <RenderTripContent tripData={FALLBACK_MOCK_TRIP} isMock={true} />
        </div>
      </div>
    );
  }

  // Renderizar los detalles reales del viaje
  return <RenderTripContent tripData={trip} />;
}
