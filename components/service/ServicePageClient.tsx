"use client";

import dynamic from "next/dynamic";
import ServiceHeader from "@/components/service/ServiceHeader";
import ServiceRequestCard from "@/components/service/ServiceRequestCard";
import React, { useState, useEffect, useCallback } from "react";
import mockServiceRequests from "@/lib/mockServiceRequests.json";

// Importar InteractiveMap dinámicamente con SSR deshabilitado
const DynamicInteractiveMap = dynamic(() => import("@/components/service/InteractiveMap"), {
  ssr: false,
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface ServiceRequest {
  tripId: string;
  customerName: string;
  customerRating?: number;
  vehicleModel: string;
  vehiclePlate: string;
  originAddress: string;
  serviceValue: number;
  originCoordinates: Coordinates;
}

export default function ServicePageClient() {
  // 1. al ingresar a la página, el usuario esté en estado disponible
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [acceptedTrip, setAcceptedTrip] = useState<ServiceRequest | null>(null);
  // Usamos una cola para simular la llegada de múltiples solicitudes
  const [requestQueue, setRequestQueue] = useState<ServiceRequest[]>([]); 

  // Simular la recepción de solicitudes encolando mocks (OMITIDO TEMPORALMENTE)
  useEffect(() => {
    // if (!isAvailable || acceptedTrip) return;
    // const interval = setInterval(() => {
    //   if (requestQueue.length === 0 && mockServiceRequests.length > 0) {
    //     setRequestQueue([...mockServiceRequests]);
    //   }
    //   if (!currentRequest && requestQueue.length > 0) {
    //     const nextRequest = requestQueue[0];
    //     setCurrentRequest(nextRequest);
    //     setRequestQueue(prev => prev.slice(1));
    //   }
    // }, 5000);
    // return () => clearInterval(interval);
  }, [isAvailable, currentRequest, acceptedTrip, requestQueue]);


  // Handler para aceptar una solicitud (OMITIDO TEMPORALMENTE)
  const handleAcceptRequest = useCallback((tripId: string) => {
    // if (currentRequest && currentRequest.tripId === tripId) {
    //   setIsAvailable(false);
    //   setAcceptedTrip(currentRequest);
    //   setCurrentRequest(null);
    // }
  }, [currentRequest]);

  // Handler para cuando el viaje termina (OMITIDO TEMPORALMENTE)
  const onTripEnd = useCallback(() => {
    // setIsAvailable(true);
    // setAcceptedTrip(null);
    // console.log("Viaje terminado. Conductor disponible de nuevo.");
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <ServiceHeader isAvailable={isAvailable} setIsAvailable={setIsAvailable} />
      <div className="flex-1 w-full h-full">
        <DynamicInteractiveMap
          isAvailable={isAvailable}
          setIsAvailable={setIsAvailable}
          currentRequest={currentRequest}
          setCurrentRequest={setCurrentRequest}
          acceptedTrip={acceptedTrip}
          setAcceptedTrip={setAcceptedTrip}
          onTripEnd={onTripEnd}
        />
        {/* La tarjeta de solicitud está omitida temporalmente según el requerimiento del usuario */}
        {/* {currentRequest && !acceptedTrip && (
          <ServiceRequestCard
            {...currentRequest}
            onAccept={handleAcceptRequest}
          />
        )} */}
      </div>
    </div>
  );
}
