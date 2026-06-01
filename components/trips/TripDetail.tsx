"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Importar la utilidad cn

interface TripDetailData {
  id: string;
  date: string;
  customerName: string;
  customerRating: number | null;
  origin: string; // e.g., "Calle Falsa 123"
  destination: string; // e.g., "Av. Siempreviva 742"
  status: string;
  amount: number;
  vehicle: {
    brand: string;
    model: string;
    year: number;
  };
  receiptLink: string; // Placeholder for now
  reportCustomerLink: string; // Placeholder for now
}

const mockTripDetails: Record<string, TripDetailData> = {
  "trip_001": {
    id: "trip_001",
    date: "2026-05-29",
    customerName: "Juan Pérez",
    customerRating: 4.5,
    origin: "Av. Libertador 1234, CABA",
    destination: "Av. Corrientes 800, CABA",
    status: "Completado",
    amount: 150.00,
    vehicle: { brand: "Ford", model: "Fiesta", year: 2015 },
    receiptLink: "/payments/receipt/pay_001",
    reportCustomerLink: "/feedback/report/customer/trip_001",
  },
  "trip_002": {
    id: "trip_002",
    date: "2026-05-28",
    customerName: "María López",
    customerRating: 3.9,
    origin: "Calle Falsa 123, Bernal",
    destination: "Quilmes Centro",
    status: "Completado",
    amount: 120.50,
    vehicle: { brand: "Chevrolet", model: "Corsa", year: 2010 },
    receiptLink: "/payments/receipt/pay_002",
    reportCustomerLink: "/feedback/report/customer/trip_002",
  },
  "trip_003": {
    id: "trip_003",
    date: "2026-05-27",
    customerName: "Carlos Gómez",
    customerRating: null, // No calificado
    origin: "Ruta 2 Km 50, La Plata",
    destination: "City Bell",
    status: "Cancelado",
    amount: 0.00,
    vehicle: { brand: "Volkswagen", model: "Gol", year: 2018 },
    receiptLink: "#",
    reportCustomerLink: "/feedback/report/customer/trip_003",
  },
  "trip_004": {
    id: "trip_004",
    date: "2026-05-26",
    customerName: "Ana Fernández",
    customerRating: 5.0,
    origin: "Diagonal Norte 500, CABA",
    destination: "Obelisco, CABA",
    status: "Completado",
    amount: 200.00,
    vehicle: { brand: "Toyota", model: "Corolla", year: 2020 },
    receiptLink: "/payments/receipt/pay_004",
    reportCustomerLink: "/feedback/report/customer/trip_004",
  },
};

// Define un viaje mockeado de fallback que se usará para la vista previa.
const FALLBACK_MOCK_TRIP: TripDetailData = mockTripDetails["trip_001"];

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
          <strong className="text-white">Fecha:</strong> {tripData.date}
        </p>
        <p>
          <strong className="text-white">Cliente:</strong> {tripData.customerName}
        </p>
        <p>
          <strong className="text-white">Calificación del Cliente:</strong>{" "}
          {tripData.customerRating !== null ? `${tripData.customerRating}/5` : "No calificado"}
        </p>
        <p className="md:col-span-2">
          <strong className="text-white">Origen:</strong> {tripData.origin}
        </p>
        <p className="md:col-span-2">
          <strong className="text-white">Destino:</strong> {tripData.destination}
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
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-slate-800">
        <Button onClick={() => router.push("/trips")} className="bg-slate-700 hover:bg-slate-600 text-white font-bold">
          Volver a Mis Viajes
        </Button>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={tripData.receiptLink} passHref>
            <Button variant="secondary" className="w-full sm:w-auto">
              Ver Recibo
            </Button>
          </Link>
          <Link href={tripData.reportCustomerLink} passHref>
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
    const fetchTripDetails = async () => {
      setIsLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula latencia de API

      const foundTrip = mockTripDetails[tripId];

      if (foundTrip) {
        setTrip(foundTrip);
      } else {
        setError("Viaje no encontrado.");
        setTrip(null); // Asegurar que trip es null si no se encuentra
      }
      setIsLoading(false);
    };

    fetchTripDetails();
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
