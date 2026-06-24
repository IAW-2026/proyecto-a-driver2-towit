"use client";

import { Button } from "@/components/ui/button";

interface ServiceTripEndingConfirmationCardProps {
  customerName: string;
  destinationAddress: string; // La dirección de destino a la que se ha llegado
  onConfirmEnd: (tripId: string) => void; // Función para manejar la confirmación de la finalización
  tripId: string;
}

export default function ServiceTripEndingConfirmationCard({
  customerName,
  destinationAddress,
  onConfirmEnd,
  tripId,
}: ServiceTripEndingConfirmationCardProps) {
  const handleConfirmClick = () => {
    onConfirmEnd(tripId);
  };

  return (
    <div className="absolute bottom-4 left-1/2 md:left-4 md:translate-x-0 -translate-x-1/2 w-[95%] md:w-[90%] max-w-sm z-[1001] bg-slate-950/80 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-slate-700 text-white">
      <div className="md:space-y-3 mb-3 md:mb-6">
        <p className="text-base">
          <span className="font-semibold mr-2">Llegando al destino de </span> {customerName}
        </p>
        <p className="text-sm text-slate-300">
          <span className="font-semibold mr-2">Destino:</span> {destinationAddress}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleConfirmClick}
          className="flex-1 bg-blue-600/70 hover:bg-blue-500/90 text-white font-bold py-3 text-lg"
        >
          Confirmar finalización de viaje
        </Button>
      </div>
    </div>
  );
}
