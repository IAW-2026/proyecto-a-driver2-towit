"use client";

import { Button } from "@/components/ui/button";

// Interfaz para los datos del pedido de servicio
interface ServiceRequestCardProps {
  customerName: string;
  customerRating?: number | null; // Opcional, si se obtiene de Feedback App (puede ser null para N/D)
  vehicleModel: string;
  originAddress: string;
  destinationAddress: string; // Nuevo: dirección de destino
  serviceValue: number;
  onAccept: (tripId: string) => void; // Función para manejar la aceptación del pedido
  onReject: (tripId: string) => void; // NUEVO: Función para manejar el rechazo del pedido
  tripId: string; // ID del viaje asociado al pedido
}

export default function ServiceRequestCard({
  customerName,
  customerRating,
  vehicleModel,
  originAddress,
  destinationAddress,
  serviceValue,
  onAccept,
  onReject, // NUEVO: Desestructurar la función onReject
  tripId,
}: ServiceRequestCardProps) {
  const handleAcceptClick = () => {
    onAccept(tripId);
  };

  // NUEVO: Función para manejar el clic en el botón de rechazar
  const handleRejectClick = () => {
    onReject(tripId);
  };

  return (
    <div className="absolute bottom-4 left-1/2 md:left-4 md:translate-x-0 -translate-x-1/2 w-full md:w-[90%] max-w-sm z-[1001] bg-slate-950/80 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 text-white">
      <h3 className="text-xl font-bold text-yellow-400 mb-2 md:mb-4">Nueva solicitud</h3>

      <div className="md:space-y-3 mb-3 md:mb-6">
        <p className="text-lg flex items-center">
          <span className="font-semibold mr-1">Cliente:</span> {customerName}
          <span className="ml-2 inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-0.5 text-sm font-medium text-yellow-400 ring-1 ring-inset ring-yellow-400/20">
            {typeof customerRating === 'number' ? `${customerRating.toFixed(1)} ★` : 'N/D'}
          </span>
        </p>
        <p className="text-base text-slate-300">
          <span className="font-semibold">Vehículo:</span> {vehicleModel}
        </p>
        <p className="text-base text-slate-300">
          <span className="font-semibold">Origen:</span> {originAddress}
        </p>
        <p className="text-base text-slate-300">
          <span className="font-semibold">Destino:</span> {destinationAddress}
        </p>
        <p className="text-right text-2xl font-bold text-green-400">
          ${serviceValue}
        </p>
      </div>

      <div className="flex gap-3"> {/* Contenedor flex para los botones */}
        <Button
          onClick={handleRejectClick}
          variant="outline"
          className="flex-1 bg-transparent border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold py-3 text-lg"
        >
          Rechazar
        </Button>
        <Button
          onClick={handleAcceptClick}
          className="flex-1 bg-green-600/70 hover:bg-green-500/90 text-white font-bold py-3 text-lg"
        >
          Aceptar
        </Button>
      </div>
    </div>
  );
}
