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
  destinationAddress: string; // Nuevo campo
  destinationCoordinates: Coordinates; // Nuevo campo
}

export default function ServicePageClient() {
  // 1. al ingresar a la página, el usuario esté en estado disponible
  const [isAvailable, setIsAvailable] = useState(true); // El usuario debe iniciar como disponible
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [acceptedTrip, setAcceptedTrip] = useState<ServiceRequest | null>(null);
  const [currentTripStage, setCurrentTripStage] = useState<'idle' | 'to_origin' | 'to_destination'>('idle');

  // Usamos un temporizador para la cuenta atrás de la aceptación de la solicitud
  const [acceptanceTimer, setAcceptanceTimer] = useState<NodeJS.Timeout | null>(null);

  // Simular la recepción de solicitudes solo si el conductor está disponible y no hay un viaje activo
  useEffect(() => {
    let requestInterval: NodeJS.Timeout;

    if (isAvailable && !currentRequest && !acceptedTrip && currentTripStage === 'idle') {
      // Generar un intervalo aleatorio entre 5 y 10 segundos para la próxima solicitud
      const randomInterval = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // 5 a 10 segundos

      requestInterval = setInterval(() => {
        if (mockServiceRequests.length === 0) {
          console.warn("mockServiceRequests está vacío. No se pueden generar solicitudes.");
          return;
        }

        const randomIndex = Math.floor(Math.random() * mockServiceRequests.length);
        const newRequest = mockServiceRequests[randomIndex];

        setCurrentRequest(newRequest);

        const randomAcceptTime = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000; // 10 a 15 segundos
        const timer = setTimeout(() => {
          console.log(`Solicitud ${newRequest.tripId} expiró por falta de aceptación.`);
          setCurrentRequest(null);
          setAcceptanceTimer(null);
        }, randomAcceptTime);
        setAcceptanceTimer(timer);

      }, randomInterval);
    }

    return () => {
      clearInterval(requestInterval);
      if (acceptanceTimer) {
        clearTimeout(acceptanceTimer);
        setAcceptanceTimer(null);
      }
    };
  }, [isAvailable, currentRequest, acceptedTrip, acceptanceTimer, currentTripStage]); // Añadir currentTripStage a las dependencias

  // Handler para aceptar una solicitud
  const handleAcceptRequest = useCallback((tripId: string) => {
    if (currentRequest && currentRequest.tripId === tripId) {
      console.log(`Solicitud ${tripId} aceptada.`);
      setIsAvailable(false); // Cambiar a no disponible
      setAcceptedTrip(currentRequest); // Establecer el viaje aceptado
      
      // Limpiar el temporizador de aceptación actual
      if (acceptanceTimer) {
        clearTimeout(acceptanceTimer);
        setAcceptanceTimer(null);
      }
      setCurrentRequest(null); // Ocultar la tarjeta de solicitud
    }
  }, [currentRequest, acceptanceTimer, setIsAvailable, setAcceptedTrip]); // Añadir dependencias necesarias

  // Handler para cuando el viaje termina
  const onTripEnd = useCallback(() => {
    setIsAvailable(true); // La ruta se borra al llegar al destino y vuelve a estado disponible
    setAcceptedTrip(null); // Borrar el viaje aceptado
    console.log("Viaje terminado. Conductor disponible de nuevo.");
  }, [setIsAvailable, setAcceptedTrip]);

  const isTripActive = currentTripStage !== 'idle'; // Determinar si hay un viaje activo

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <ServiceHeader
        isAvailable={isAvailable}
        setIsAvailable={setIsAvailable}
        isTripActive={isTripActive} // Pasar la prop para deshabilitar el botón
      />
      <div className="flex-1 w-full h-full">
        <DynamicInteractiveMap
          isAvailable={isAvailable}
          setIsAvailable={setIsAvailable}
          currentRequest={currentRequest}
          setCurrentRequest={setCurrentRequest}
          acceptedTrip={acceptedTrip}
          setAcceptedTrip={setAcceptedTrip}
          onTripEnd={onTripEnd}
          currentTripStage={currentTripStage} // Pasar el estado y el setter
          setCurrentTripStage={setCurrentTripStage}
        />
        {/* Mostrar la tarjeta de solicitud solo si hay una solicitud actual y el conductor está disponible */}
        {currentRequest && isAvailable && !isTripActive && ( // Solo mostrar si no hay viaje activo
          <ServiceRequestCard
            {...currentRequest}
            onAccept={handleAcceptRequest}
            destinationAddress={currentRequest.destinationAddress}
          />
        )}
      </div>
    </div>
  );
}
