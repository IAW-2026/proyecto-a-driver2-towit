"use client";

import dynamic from "next/dynamic";
import ServiceHeader from "@/components/service/ServiceHeader";
import ServiceRequestCard from "@/components/service/ServiceRequestCard";
import React, { useState, useEffect, useCallback } from "react";
import mockServiceRequests from "@/lib/mockServiceRequests.json";
import { useUser } from "@clerk/nextjs"; // Importar useUser
import { getTowerData, TowerData } from "@/app/actions/tower"; // Importar la acción para obtener datos de la torre y la interfaz TowerData
import PaymentAliasModal from "@/components/payments/PaymentAliasModal"; // Importar el modal de alias
import { useRouter } from "next/navigation"; // Nuevo: Importar useRouter

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
  const { user, isLoaded } = useUser(); // Obtener el usuario de Clerk
  const router = useRouter(); // Nuevo: Inicializar useRouter
  // 1. al ingresar a la página, el usuario esté en estado disponible
  const [isAvailable, setIsAvailable] = useState(true); // El usuario debe iniciar como disponible
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [acceptedTrip, setAcceptedTrip] = useState<ServiceRequest | null>(null);
  const [currentTripStage, setCurrentTripStage] = useState<'idle' | 'to_origin' | 'to_destination'>('idle');
  const [towerData, setTowerData] = useState<TowerData | null>(null); // Estado para los datos de la torre
  const [isLoadingTowerData, setIsLoadingTowerData] = useState(true); // Estado para la carga de datos de la torre
  const [showPaymentAliasModal, setShowPaymentAliasModal] = useState(false); // Estado para el modal

  // Usamos un temporizador para la cuenta atrás de la aceptación de la solicitud
  const [acceptanceTimer, setAcceptanceTimer] = useState<NodeJS.Timeout | null>(null);

  // Efecto para cargar los datos de la torre del usuario y verificar el alias
  useEffect(() => {
    async function loadTowerData() {
      if (!isLoaded || !user?.id) {
        setIsLoadingTowerData(true); // Mantener cargando hasta que user?.id esté disponible
        return;
      }

      setIsLoadingTowerData(true);
      try {
        const result = await getTowerData(user.id);
        if (result.success && result.data) {
          setTowerData(result.data);
          // Si el alias no está configurado, mostrar el modal
          if (!result.data.payments_alias) {
            setShowPaymentAliasModal(true);
          } else {
            setShowPaymentAliasModal(false);
          }
        } else {
          console.error("Error al cargar los datos de la torre:", result.error);
          // Si hay un error, forzar la apertura del modal para que el usuario configure el alias
          setShowPaymentAliasModal(true);
        }
      } catch (error) {
        console.error("Error inesperado al cargar los datos de la torre:", error);
        setShowPaymentAliasModal(true);
      } finally {
        setIsLoadingTowerData(false);
      }
    }

    loadTowerData();
  }, [isLoaded, user?.id]); // Dependencias: cuando el usuario de Clerk esté cargado o cambie

  // Simular la recepción de solicitudes solo si el conductor está disponible, no hay un viaje activo,
  // no hay una solicitud actual y el modal de alias de pago NO está activo (porque es modal y bloqueante).
  useEffect(() => {
    let requestInterval: NodeJS.Timeout;

    if (
      isAvailable &&
      !currentRequest &&
      !acceptedTrip &&
      currentTripStage === 'idle' &&
      !showPaymentAliasModal && // No generar solicitudes si el modal de alias está abierto
      towerData?.payments_alias // Solo si el alias de pago está configurado
    ) {
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
  }, [isAvailable, currentRequest, acceptedTrip, acceptanceTimer, currentTripStage, showPaymentAliasModal, towerData?.payments_alias]);

  // Efecto para limpiar la solicitud y la ruta cuando el conductor se pone no disponible
  useEffect(() => {
    if (!isAvailable) { // Si el conductor se pone no disponible
      if (currentRequest) { // Y hay una solicitud actual mostrándose
        console.log("Conductor no disponible: Eliminando solicitud y ruta del mapa.");
        setCurrentRequest(null); // Quitar la tarjeta de solicitud
        if (acceptanceTimer) {
          clearTimeout(acceptanceTimer); // Limpiar el temporizador de aceptación
          setAcceptanceTimer(null);
        }
        // La limpieza de la ruta del mapa ocurrirá automáticamente en InteractiveMap
        // debido a que currentRequest se establece en null, lo cual es una dependencia
        // del useEffect que maneja el dibujo de la ruta de la solicitud.
      }
    }
  }, [isAvailable, currentRequest, acceptanceTimer, setCurrentRequest, setAcceptanceTimer]);

  // Handler para aceptar una solicitud
  const handleAcceptRequest = useCallback((tripId: string) => {
    // No permitir aceptar solicitudes si el alias no está configurado
    if (!towerData?.payments_alias) {
      setShowPaymentAliasModal(true); // Asegurarse de que el modal esté visible
      console.warn("Intento de aceptar viaje sin alias de pago configurado.");
      return;
    }

    if (currentRequest && currentRequest.tripId === tripId) {
      console.log(`Solicitud ${tripId} aceptada.`);
      setIsAvailable(false); // Cambiar a no disponible (el botón se deshabilitará por isTripActive)
      setAcceptedTrip(currentRequest); // Establecer el viaje aceptado
      
      // Limpiar el temporizador de aceptación actual
      if (acceptanceTimer) {
        clearTimeout(acceptanceTimer);
        setAcceptanceTimer(null);
      }
      setCurrentRequest(null); // Ocultar la tarjeta de solicitud
    }
  }, [currentRequest, acceptanceTimer, setIsAvailable, setAcceptedTrip, towerData?.payments_alias]);

  // Handler para cuando el viaje termina
  const onTripEnd = useCallback(() => {
    setIsAvailable(true); // La ruta se borra al llegar al destino y vuelve a estado disponible
    setAcceptedTrip(null); // Borrar el viaje aceptado
    console.log("Viaje terminado. Conductor disponible de nuevo.");
  }, [setIsAvailable, setAcceptedTrip]);

  const handleAliasUpdateSuccess = useCallback(() => {
    // Si el alias se actualizó, cerrar el modal y recargar los datos de la torre
    setShowPaymentAliasModal(false);
    // Forzar una recarga de los datos de la torre para asegurar que el alias actualizado esté disponible
    if (user?.id) {
      getTowerData(user.id).then(result => {
        if (result.success && result.data) {
          setTowerData(result.data);
        }
      });
    }
  }, [user?.id]);


  const isTripActive = currentTripStage !== 'idle'; // Determinar si hay un viaje activo

  // Mostrar un estado de carga o el modal del alias si es necesario
  if (!isLoaded || isLoadingTowerData) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center text-white">
        Cargando servicio...
      </div>
    );
  }

  // Si no hay alias de pago, mostrar el modal sin posibilidad de cerrarlo
  if (!towerData?.payments_alias && showPaymentAliasModal) {
    return (
      <PaymentAliasModal
        isOpen={showPaymentAliasModal}
        onClose={() => { /* No hacemos nada porque no es cerrable */ }}
        currentAlias={towerData?.payments_alias || null}
        onSuccess={handleAliasUpdateSuccess}
        isClosable={false} // Hacer el modal no cerrable
        isServiceContext={true} // Nuevo: Indicar que estamos en el contexto de /service
      />
    );
  }


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <ServiceHeader
        isAvailable={isAvailable && !showPaymentAliasModal && !!towerData?.payments_alias} // Deshabilitar si el modal está activo o no hay alias
        setIsAvailable={setIsAvailable}
        isTripActive={isTripActive} // Pasar la prop para deshabilitar el botón
      />
      <div className="flex-1 w-full h-full">
        <DynamicInteractiveMap
          isAvailable={isAvailable && !showPaymentAliasModal && !!towerData?.payments_alias} // Deshabilitar si el modal está activo o no hay alias
          setIsAvailable={setIsAvailable}
          currentRequest={currentRequest}
          setCurrentRequest={setCurrentRequest}
          acceptedTrip={acceptedTrip}
          setAcceptedTrip={setAcceptedTrip}
          onTripEnd={onTripEnd}
          currentTripStage={currentTripStage} // Pasar el estado y el setter
          setCurrentTripStage={setCurrentTripStage}
        />
        {/* Mostrar la tarjeta de solicitud solo si hay una solicitud actual y el conductor está disponible,
            no hay viaje activo, y el modal de alias NO está visible y el alias SI está configurado. */}
        {currentRequest && isAvailable && !isTripActive && !showPaymentAliasModal && !!towerData?.payments_alias && (
          <ServiceRequestCard
            {...currentRequest}
            onAccept={handleAcceptRequest}
            destinationAddress={currentRequest.destinationAddress}
          />
        )}
      </div>

      {/* Renderizar el PaymentAliasModal aquí, pero su visibilidad está controlada por la lógica anterior.
          Este bloque es para cuando el alias ya se configuró (ej. desde el dashboard), pero el usuario quiere cambiarlo. */}
      {showPaymentAliasModal && towerData?.payments_alias && (
        <PaymentAliasModal
          isOpen={showPaymentAliasModal}
          onClose={() => setShowPaymentAliasModal(false)}
          currentAlias={towerData.payments_alias || null}
          onSuccess={handleAliasUpdateSuccess}
          isClosable={true} // Permitir cerrar si ya está configurado (ej. si vino de dashboard)
          isServiceContext={false} // No es el contexto de servicio bloqueante aquí
        />
      )}
    </div>
  );
}
