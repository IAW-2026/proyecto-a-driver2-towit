"use client";

import dynamic from "next/dynamic";
import ServiceHeader from "@/components/service/ServiceHeader";
import ServiceRequestCard from "@/components/service/ServiceRequestCard";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs"; // Importar useUser
import { getTowerData, TowerData } from "@/app/actions/tower"; // Importar la acción para obtener datos de la torre y la interfaz TowerData
import { getTowerVehicles } from "@/app/actions/vehicle"; // NUEVO: Importar la acción para obtener vehículos
import { useRouter } from "next/navigation"; // Nuevo: Importar useRouter
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // NUEVO: Importar componentes de Dialog
import { toggleTowerAvailability, refreshTowerHeartbeatAndLocation } from "@/app/actions/redis-tower"; // Importar las nuevas acciones

interface Vehicle { // Definir la interfaz Vehicle para mayor claridad
  vehicle_id: string;
  brand: string;
  model: string;
  year: number;
  max_load: number;
}

// Importar InteractiveMap dinámicamente con SSR deshabilitado
const DynamicInteractiveMap = dynamic(() => import("@/components/service/InteractiveMap"), {
  ssr: false,
});

interface ServicePageClientProps {
  initialIsAvailable: boolean; // Nueva prop para el estado inicial de disponibilidad
}

export default function ServicePageClient({ initialIsAvailable }: ServicePageClientProps) {
  const { user, isLoaded } = useUser(); // Obtener el usuario de Clerk
  const router = useRouter(); // Nuevo: Inicializar useRouter
  // Inicializar el estado de disponibilidad con la prop recibida de Redis
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [towerData, setTowerData] = useState<TowerData | null>(null); // Estado para los datos de la torre
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null); // NUEVO: Estado para los vehículos del usuario
  const [isLoading, setIsLoading] = useState(true); // Estado unificado para la carga inicial
  const [showRedirectionPopup, setShowRedirectionPopup] = useState(false); // NUEVO: Estado para el popup de redirección
  const [redirectReason, setRedirectReason] = useState("");
  const [recheckTrigger, setRecheckTrigger] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [arePrerequisitesLoaded, setArePrerequisitesLoaded] = useState(false); // NUEVO: Estado para saber si los datos esenciales están cargados

  // NUEVOS ESTADOS para gestionar la oferta
  const [currentOffer, setCurrentOffer] = useState<any | null>(null);
  const [offerTimeRemaining, setOfferTimeRemaining] = useState<number>(0);
  // NUEVOS ESTADOS para las coordenadas de la ruta en el mapa
  const [mapRouteStart, setMapRouteStart] = useState<{ lat: number; lng: number } | null>(null); // Ubicación del Tower
  const [mapRouteEnd, setMapRouteEnd] = useState<{ lat: number; lng: number } | null>(null);     // Origen del Viaje
  const [mapRouteOriginToDestinationEnd, setMapRouteOriginToDestinationEnd] = useState<{ lat: number; lng: number } | null>(null); // Destino final del Viaje

  // Variable para simular si hay un viaje activo
  const [isTripActive, setIsTripActive] = useState(false);

  // Efecto para cargar los datos del servicio (torre y vehículos) y determinar la redirección
  useEffect(() => {
    async function loadServicePrerequisites() {
      if (!isLoaded || !user?.id) { // No esperar por currentLocation para los prerrequisitos
        setIsLoading(true); // Mantener cargando hasta que user?.id esté disponible
        return;
      }

      setIsLoading(true);
      let needsRedirect = false;
      let reason = "";

      try {
        // Ejecutar llamadas a la base de datos en paralelo
        const [towerResult, vehiclesResult] = await Promise.all([
          getTowerData(user.id),
          getTowerVehicles()
        ]);

        if (towerResult.success && towerResult.data) {
          setTowerData(towerResult.data);
          if (!towerResult.data.payments_alias) {
            needsRedirect = true;
            reason = "No se definió alias para pago";
          }
        } else {
          console.error("Error al cargar los datos de la torre:", towerResult.error);
          needsRedirect = true;
          reason = "Error al cargar los datos de la torre";
        }

        if (vehiclesResult.success && vehiclesResult.data && (vehiclesResult.data as any[]).length > 0) {
          setVehicles(vehiclesResult.data as any[]);
        } else {
          if (!needsRedirect) {
            needsRedirect = true;
            reason = "No se definió un vehículo a usar";
          } else {
            reason += " ni vehículo a usar";
          }
        }

        if (needsRedirect) {
          setRedirectReason(reason + ", redirigiendo a dashboard...");
          setShowRedirectionPopup(true);
          setTimeout(() => {
            router.push("/dashboard");
          }, 5000);
        } else {
          setShowRedirectionPopup(false);
        }

      } catch (error) {
        console.error("Error inesperado al cargar los datos del servicio:", error);
        setRedirectReason("Error inesperado al cargar los datos, redirigiendo a dashboard...");
        setShowRedirectionPopup(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } finally {
        setIsLoading(false); // Finaliza la carga de los prerrequisitos
        setArePrerequisitesLoaded(true); // NUEVO: Marca que los prerrequisitos han sido cargados
      }
    }

    loadServicePrerequisites();
  }, [isLoaded, user?.id, router, recheckTrigger]); // Quitar currentLocation de las dependencias

  // NUEVO: Efecto para obtener y actualizar la ubicación del usuario
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, long: longitude });
        },
        (error) => {
          console.error("ServicePageClient: Error obteniendo ubicación:", error.message, `(Code: ${error.code})`);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setWatchId(id);

      return () => {
        if (id !== null) {
          navigator.geolocation.clearWatch(id);
        }
      };
    } else {
      console.warn("ServicePageClient: Geolocation no soportado o no disponible.");
    }
  }, []); // Se ejecuta una vez al montar el componente

  // NUEVO EFECTO: Polling para ofertas de viaje
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const checkOffers = async () => {
      if (!user?.id || !isAvailable || isTripActive) { // Añadido: `isTripActive`
        // Si el tower no está logueado, no está disponible o está en un viaje, no hay ofertas.
        setCurrentOffer(null);
        setOfferTimeRemaining(0);
        return;
      }

      try {
        const response = await fetch(`/api/tower/check-offer?tower_id=${user.id}`);
        const data = await response.json();

        if (data.has_offer) {
          // Solo actualizar si la oferta del viaje ha cambiado para evitar re-renderizados innecesarios
          if (currentOffer?.id !== data.trip.id) {
            setCurrentOffer(data.trip);
            setOfferTimeRemaining(data.time_remaining);
            // Establecer las coordenadas para la ruta si hay una ubicación actual del conductor
            if (currentLocation) {
              setMapRouteStart({ lat: currentLocation.lat, lng: currentLocation.long }); // Tower a Origen
              setMapRouteEnd({ lat: parseFloat(data.trip.origin.lat), lng: parseFloat(data.trip.origin.long) }); // Origen del Viaje
              setMapRouteOriginToDestinationEnd({ lat: parseFloat(data.trip.destination.lat), lng: parseFloat(data.trip.destination.long) }); // Destino Final
            }
          } else {
            // Si la oferta es la misma, solo actualizar el tiempo restante
            setOfferTimeRemaining(data.time_remaining);
          }
        } else {
          // Solo limpiar si realmente había una oferta activa para evitar re-renderizados innecesarios
          if (currentOffer !== null) {
            setCurrentOffer(null);
            setOfferTimeRemaining(0);
            // Limpiar todas las coordenadas de la ruta si no hay oferta
            setMapRouteStart(null);
            setMapRouteEnd(null);
            setMapRouteOriginToDestinationEnd(null);
          }
        }
      } catch (error) {
        console.error("Error checking for offers:", error);
        setCurrentOffer(null);
        setOfferTimeRemaining(0);
      }
    };

    if (isAvailable && user?.id) {
      checkOffers(); // Una verificación inicial inmediata
      pollingInterval = setInterval(checkOffers, 3000); // Poll cada 3 segundos
    } else {
      setCurrentOffer(null);
      setOfferTimeRemaining(0);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isAvailable, user?.id, isTripActive]); // Añadido: `isTripActive` a las dependencias

  // NUEVO EFECTO: Contador regresivo local para la oferta
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout | null = null;
    if (currentOffer && offerTimeRemaining > 0) {
      countdownTimer = setInterval(() => {
        setOfferTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer!);
            setCurrentOffer(null); // La oferta expira
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!currentOffer && countdownTimer) {
      clearInterval(countdownTimer);
    }
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [currentOffer, offerTimeRemaining]);


  // Efecto para gestionar el heartbeat cuando el tower está disponible
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isAvailable && user?.id && currentLocation) {
      // Función para refrescar el heartbeat y la ubicación
      const updateHeartbeat = async () => {
        if (currentLocation) {
          await refreshTowerHeartbeatAndLocation(currentLocation);
        }
      };

      // Iniciar el intervalo para actualizar cada 20 segundos
      intervalId = setInterval(updateHeartbeat, 20000); // 20 segundos

      // Realizar una actualización inmediata al activarse la disponibilidad por primera vez
      updateHeartbeat();

    } else if (intervalId) {
      clearInterval(intervalId); // Limpiar el intervalo si ya no está disponible
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId); // Limpiar el intervalo al desmontar o cambiar la dependencia
      }
    };
  }, [isAvailable, user?.id, currentLocation]); // Depende de isAvailable, user.id y currentLocation

  const handleAliasUpdateSuccess = useCallback(() => {
    setRecheckTrigger(prev => !prev); // Forzar la re-evaluación de los prerrequisitos del servicio
  }, []);

  // Función para manejar el cambio de disponibilidad
  const handleToggleAvailability = async () => {
    if (!user?.id || !currentLocation) {
      // Considerar un log interno o manejo de errores sin toast si es crítico para el usuario
      console.error("No se pudo obtener la información de usuario o la ubicación para cambiar la disponibilidad.");
      return;
    }

    const newAvailabilityState = !isAvailable;

    if (!vehicles || vehicles.length === 0) {
      console.error("No hay vehículos registrados para cambiar la disponibilidad.");
      return;
    }

    const activeVehicle = vehicles[0]; // Seleccionar el primer vehículo como el activo

    const success = await toggleTowerAvailability(
      newAvailabilityState,
      newAvailabilityState ? currentLocation : null,
      newAvailabilityState ? {
        brand: activeVehicle.brand,
        model: activeVehicle.model,
        year: activeVehicle.year,
        max_load: activeVehicle.max_load,
      } : null // Pasar detalles del vehículo solo si se está activando la disponibilidad
    );

    if (success) {
      setIsAvailable(newAvailabilityState);
      // No se notifica al usuario, ya lo ve reflejado en el botón.
    } else {
      // Considerar un log interno o manejo de errores sin toast
      console.error("Hubo un error al actualizar tu estado de disponibilidad en el servidor.");
    }
  };

  // NUEVA FUNCIÓN: Para aceptar una oferta de viaje
  const handleAcceptOffer = async (tripId: string) => {
    if (!user?.id) {
      console.error("User ID not available to accept offer.");
      return;
    }

    try {
      const response = await fetch('/api/tower/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: tripId,
          tower_id: user.id,
          action: 'accept',
        }),
      });
      const data = await response.json();

      if (data.success) {
        console.log("Oferta aceptada:", data);
        setCurrentOffer(null); // Limpiar la oferta actual de la UI
        setOfferTimeRemaining(0);
        setIsTripActive(true); // Marcar que hay un viaje activo. Las rutas se mantendrán dibujadas.
        // NO se limpian las rutas aquí. El mapa se centrará en el tower porque isTripActive es true.
      } else {
        console.error("Error al aceptar la oferta:", data.error);
        // Opcional: Mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error en la solicitud para aceptar oferta:", error);
      // Opcional: Mostrar un mensaje de error de red
    }
  };

  // NUEVA FUNCIÓN: Para rechazar una oferta de viaje
  const handleRejectOffer = async (tripId: string) => {
    if (!user?.id) {
      console.error("User ID not available to reject offer.");
      return;
    }


    setCurrentOffer(null); // Limpiar la oferta actual de la UI
    setOfferTimeRemaining(0);
    // Al rechazar, limpiar las rutas y permitir que el mapa se centre en el tower (punto 3)
    setMapRouteStart(null);
    setMapRouteEnd(null);
    setMapRouteOriginToDestinationEnd(null);

    try {
      const response = await fetch('/api/tower/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: tripId,
          tower_id: user.id,
          action: 'reject',
        }),
      });
      const data = await response.json();

      if (data.success) {
        console.log("Oferta rechazada:", data);
        // El estado isTripActive no cambia porque no se aceptó el viaje
      } else {
        console.error("Error al rechazar la oferta:", data.error);
        // Opcional: Mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error en la solicitud para rechazar oferta:", error);
      // Opcional: Mostrar un mensaje de error de red
    }
  };

  // Mostrar un estado de carga general.
  // if (!isLoaded || isLoading) {
  //   return (
  //     <div className="flex flex-col h-screen w-screen items-center justify-center text-white">
  //       Cargando servicio...
  //     </div>
  //   );
  // }


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <ServiceHeader
        isAvailable={isAvailable}
        setIsAvailable={handleToggleAvailability}
        isTripActive={isTripActive}
        isButtonEnabled={arePrerequisitesLoaded} // NUEVO: Habilitar el botón solo si los prerrequisitos están cargados
      />
      <div className="flex-1 w-full h-full">
        {/* Renderiza el mapa incondicionalmente */}
        <DynamicInteractiveMap
          userLocation={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.long } : null}
          routeStart={mapRouteStart}
          routeEnd={mapRouteEnd}
          tripDestination={mapRouteOriginToDestinationEnd}
          isTripActive={isTripActive}
        />
      </div>

      {/* RENDERIZADO CONDICIONAL DE LA TARJETA DE OFERTA */}
      {currentOffer && offerTimeRemaining > 0 && (
        <ServiceRequestCard
          // Estos datos provienen del `check-offer` o son placeholders
          customerName={`Cliente Nuevo (Quedan ${offerTimeRemaining}s)`} // Placeholder y contador
          vehicleModel={`${currentOffer.vehicle.brand} ${currentOffer.vehicle.model} (${currentOffer.vehicle.year})`}
          vehiclePlate="Pendiente" // No proporcionado por check-offer
          originAddress={`Lat: ${currentOffer.origin.lat}, Long: ${currentOffer.origin.long}`} // Geocodificar para mostrar dirección real
          destinationAddress={`Lat: ${currentOffer.destination.lat}, Long: ${currentOffer.destination.long}`} // Geocodificar para mostrar dirección real
          serviceValue={150.00} // Valor ficticio, no proporcionado por check-offer
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer} // NUEVO: Pasar la función handleRejectOffer
          tripId={currentOffer.id}
        />
      )}

      <Dialog open={showRedirectionPopup}>
        <DialogContent
          className="sm:max-w-[425px] bg-slate-950/90 border-slate-700 text-white backdrop-blur-sm [&>button]:hidden"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Faltan requisitos para el servicio</DialogTitle>
            <DialogDescription className="text-slate-400">
              {redirectReason}
            </DialogDescription>
          </DialogHeader>
          <p className="text-center text-slate-300 mt-4">
            Serás redirigido automáticamente al dashboard en breve.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
