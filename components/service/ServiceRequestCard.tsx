"use client";

import { Button } from "@/components/ui/button";

// Interfaz para los datos del pedido de servicio
interface ServiceRequestCardProps {
  customerName: string;
  customerRating?: number; // Opcional, si se obtiene de Feedback App
  vehicleModel: string;
  vehiclePlate: string; // Patente
  originAddress: string;
  serviceValue: number;
  onAccept: (tripId: string) => void; // Función para manejar la aceptación del pedido
  tripId: string; // ID del viaje asociado al pedido
}

export default function ServiceRequestCard({
  customerName,
  customerRating,
  vehicleModel,
  vehiclePlate,
  originAddress,
  serviceValue,
  onAccept,
  tripId,
}: ServiceRequestCardProps) {
  const handleAcceptClick = () => {
    onAccept(tripId);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[1001] bg-slate-900/90 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 text-white">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Nuevo Pedido de Servicio</h3>
      
      <div className="space-y-3 mb-6">
        <p className="text-lg">
          <span className="font-semibold">Cliente:</span> {customerName}
          {customerRating && (
            <span className="ml-2 text-yellow-400">({customerRating.toFixed(1)} ★)</span>
          )}
        </p>
        <p className="text-base text-slate-300">
          <span className="font-semibold">Vehículo:</span> {vehicleModel} (Patente: {vehiclePlate})
        </p>
        <p className="text-base text-slate-300">
          <span className="font-semibold">Recoger en:</span> {originAddress}
        </p>
        <p className="text-xl font-bold text-green-400">
          <span className="font-semibold text-white">Valor:</span> ${serviceValue.toFixed(2)}
        </p>
      </div>

      <Button
        onClick={handleAcceptClick}
        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 text-lg"
      >
        Aceptar Pedido
      </Button>
    </div>
  );
}
