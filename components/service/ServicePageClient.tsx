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

  // Usamos un temporizador para la cuenta atrás de la aceptación de la solicitud
  const [acceptanceTimer, setAcceptanceTimer] = useState<NodeJS.Timeout | null>(null);

  // Simular la recepción de solicitudes
  useEffect(() => {
    let requestInterval: NodeJS.Timeout;

    if (isAvailable && !currentRequest && !acceptedTrip) {
      // Generar un intervalo aleatorio entre 5 y 10 segundos para la próxima solicitud
      const randomInterval = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // 5 a 10 segundos

      requestInterval = setInterval(() => {
        // Asegurarse de que mockServiceRequests no esté vacío
        if (mockServiceRequests.length === 0) {
          console.warn("mockServiceRequests está vacío. No se pueden generar solicitudes.");
          return;
        }

        // Obtener una solicitud aleatoria de los mocks
        const randomIndex = Math.floor(Math.random() * mockServiceRequests.length);
        const newRequest = mockServiceRequests[randomIndex];

        setCurrentRequest(newRequest); // Mostrar la nueva solicitud

        // Iniciar el temporizador para la aceptación (10 a 15 segundos)
        const randomAcceptTime = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000; // 10 a 15 segundos
        const timer = setTimeout(() => {
          console.log(`Solicitud ${newRequest.tripId} expiró por falta de aceptación.`);
          setCurrentRequest(null); // La solicitud expira
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
  }, [isAvailable, currentRequest, acceptedTrip, acceptanceTimer]); // Dependencias

  // Handler para aceptar una solicitud
  const handleAcceptRequest = useCallback((tripId: string) => {
    if (currentRequest && currentRequest.tripId === tripId) {
      console.log(`Solicitud ${tripId} aceptada. (Flujo de viaje aún no implementado)`);
      // OMITIDO: No cambia isAvailable ni acceptedTrip, ni inicia el movimiento.
      // Esto se implementará en etapas posteriores.
      
      // Limpiar el temporizador de aceptación actual
      if (acceptanceTimer) {
        clearTimeout(acceptanceTimer);
        setAcceptanceTimer(null);
      }
      setCurrentRequest(null); // Ocultar la tarjeta de solicitud, ya que se "aceptó"
    }
  }, [currentRequest, acceptanceTimer]);

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
        {/* Mostrar la tarjeta de solicitud solo si hay una solicitud actual y el conductor está disponible */}
        {currentRequest && isAvailable && (
          <ServiceRequestCard
            {...currentRequest}
            onAccept={handleAcceptRequest}
          />
        )}
      </div>
    </div>
  );
}
