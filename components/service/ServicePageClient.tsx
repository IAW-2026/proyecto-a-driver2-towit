"use client";

import dynamic from "next/dynamic";
import ServiceHeader from "@/components/service/ServiceHeader";
import ServiceRequestCard from "@/components/service/ServiceRequestCard";
import ServiceTripStartConfirmationCard from "@/components/service/ServiceTripStartConfirmationCard";
import ServiceTripEndingConfirmationCard from "@/components/service/ServiceTripEndingConfirmationCard"; // NUEVO: Importar la tarjeta de finalización
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { getTowerData, TowerData } from "@/app/actions/tower";
import { getTowerVehicles } from "@/app/actions/vehicle";
import { getCustomerName } from "@/app/actions/customer";
import { getAverageRatingForCustomer } from "@/app/actions/feedback";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // NUEVO: Importar componentes de Dialog
import { toggleTowerAvailability, refreshTowerHeartbeatAndLocation, VehicleProfileData } from "@/app/actions/redis-tower";

interface Vehicle {
  vehicle_id: string;
  brand: string;
  model: string;
  year: number;
  max_load: number;
  deactivated: boolean;
}

// Importar InteractiveMap dinámicamente con SSR deshabilitado
const DynamicInteractiveMap = dynamic(() => import("@/components/service/InteractiveMap"), {
  ssr: false,
});

interface ServicePageClientProps {
  initialIsAvailable: boolean;
  initialVehicle: VehicleProfileData | null;
}

// Función auxiliar para calcular distancia (Mover a utils.ts si ya existe, pero por ahora aquí)
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius of Earth in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}


export default function ServicePageClient({ initialIsAvailable, initialVehicle }: ServicePageClientProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [towerData, setTowerData] = useState<TowerData | null>(null);

  const [allUserVehiclesFromDB, setAllUserVehiclesFromDB] = useState<Vehicle[] | null>(null);
  const [selectedVehicleForAvailability, setSelectedVehicleForAvailability] = useState<VehicleProfileData | null>(initialVehicle);

  const [isLoading, setIsLoading] = useState(true);
  const [showRedirectionPopup, setShowRedirectionPopup] = useState(false);
  const [redirectReason, setRedirectReason] = useState("");
  const [recheckTrigger, setRecheckTrigger] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [arePrerequisitesLoaded, setArePrerequisitesLoaded] = useState(false);

  const [currentOffer, setCurrentOffer] = useState<any | null>(null);
  const [offerTimeRemaining, setOfferTimeRemaining] = useState<number>(0);
  const [customerNameForOffer, setCustomerNameForOffer] = useState<string | null>(null);
  const [customerRatingForOffer, setCustomerRatingForOffer] = useState<number | null>(null);
  const [mapRouteStart, setMapRouteStart] = useState<{ lat: number; lng: number } | null>(null);
  const [mapRouteEnd, setMapRouteEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [mapRouteOriginToDestinationEnd, setMapRouteOriginToDestinationEnd] = useState<{ lat: number; lng: number } | null>(null);

  const [isTripActive, setIsTripActive] = useState(false);
  // NUEVO ESTADO: Para controlar la visibilidad de la tarjeta de confirmación de inicio de viaje
  const [showStartTripConfirmation, setShowStartTripConfirmation] = useState(false);
  // NUEVO ESTADO: Para el estado local después de confirmar el inicio (dummy por ahora)
  const [isTripStartedLocallyConfirmed, setIsTripStartedLocallyConfirmed] = useState(false);
  // NUEVO ESTADO: Para controlar la visibilidad de la tarjeta de confirmación de finalización de viaje
  const [showEndTripConfirmation, setShowEndTripConfirmation] = useState(false);
  // NUEVO ESTADO: Para el estado local después de confirmar la finalización (dummy por ahora)
  const [isTripEndedLocallyConfirmed, setIsTripEndedLocallyConfirmed] = useState(false);


  // Efecto para cargar los datos del servicio (torre y vehículos) y determinar la redirección
  useEffect(() => {
    async function loadServicePrerequisites() {
      if (!isLoaded || !user?.id) {
        setIsLoading(true);
        return;
      }

      setIsLoading(true);
      let needsRedirect = false;
      let reason = "";

      try {
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

        // NUEVO: Manejar la lista completa de vehículos y el vehículo seleccionado
        if (vehiclesResult.success && vehiclesResult.data && (vehiclesResult.data as any[]).length > 0) {
          setAllUserVehiclesFromDB(vehiclesResult.data as Vehicle[]); // Guardar todos los vehículos

          // Si no hay un vehículo seleccionado aún (por prop inicial o por fallback)
          if (!selectedVehicleForAvailability) {
            const firstDbVehicle = (vehiclesResult.data as Vehicle[])[0]; // Tomar el primer vehículo de la DB
            setSelectedVehicleForAvailability({
              brand: firstDbVehicle.brand,
              model: firstDbVehicle.model,
              year: firstDbVehicle.year,
              max_load: firstDbVehicle.max_load,
            });
          }
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
        setIsLoading(false);
        setArePrerequisitesLoaded(true);
      }
    }

    loadServicePrerequisites();
  }, [isLoaded, user?.id, router, recheckTrigger, selectedVehicleForAvailability]);

  // Efecto para obtener y actualizar la ubicación del usuario
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
  }, []);

  // EFECTO 1: Polling para ofertas de viaje (EXISTENTE)
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const checkOffers = async () => {
      if (!user?.id || !isAvailable || isTripActive) {
        setCurrentOffer(null);
        setOfferTimeRemaining(0);
        setCustomerNameForOffer(null);
        setCustomerRatingForOffer(null);
        return;
      }

      try {
        const response = await fetch(`/api/tower/check-offer?tower_id=${user.id}`);
        const data = await response.json();

        if (data.has_offer) {
          if (currentOffer?.id !== data.trip.id) {
            setCurrentOffer(data.trip);
            setOfferTimeRemaining(data.time_remaining);
            console.log(data)

            if (data.trip.customer_id) {
              try {
                const customerNameResult = await getCustomerName(data.trip.customer_id);
                if (customerNameResult.success && customerNameResult.fullname) {
                  setCustomerNameForOffer(customerNameResult.fullname);
                } else {
                  console.error("Error al obtener el nombre del cliente:", customerNameResult.error);
                  setCustomerNameForOffer("Cliente desconocido");
                }
              } catch (nameError) {
                console.error("Error al invocar Server Action getCustomerName:", nameError);
                setCustomerNameForOffer("Cliente desconocido (error)");
              }
              try {
                const customerRatingResult = await getAverageRatingForCustomer(data.trip.customer_id);
                if (customerRatingResult.success) {
                  setCustomerRatingForOffer(customerRatingResult.rating ?? null);
                } else {
                  console.error("Error al obtener la calificación del cliente:", customerRatingResult.error);
                  setCustomerRatingForOffer(null);
                }
              } catch (ratingError) {
                console.error("Error al invocar Server Action getAverageRatingForCustomer:", ratingError);
                setCustomerRatingForOffer(null);
              }
            } else {
              setCustomerNameForOffer("Cliente desconocido (ID no disponible)");
              setCustomerRatingForOffer(null);
            }

            if (currentLocation) {
              setMapRouteStart({ lat: currentLocation.lat, lng: currentLocation.long });
              setMapRouteEnd({ lat: parseFloat(data.trip.origin.lat), lng: parseFloat(data.trip.origin.long) });
              setMapRouteOriginToDestinationEnd({ lat: parseFloat(data.trip.destination.lat), lng: parseFloat(data.trip.destination.long) });
            }
          } else {
            setOfferTimeRemaining(data.time_remaining);
          }
        } else {
          if (currentOffer !== null) {
            setCurrentOffer(null);
            setOfferTimeRemaining(0);
            setCustomerNameForOffer(null);
            setCustomerRatingForOffer(null);
            setMapRouteStart(null);
            setMapRouteEnd(null);
            setMapRouteOriginToDestinationEnd(null);
          }
        }
      } catch (error) {
        console.error("Error checking for offers:", error);
        setCurrentOffer(null);
        setOfferTimeRemaining(0);
        setCustomerNameForOffer(null);
        setCustomerRatingForOffer(null);
      }
    };

    if (isAvailable && user?.id) {
      checkOffers();
      pollingInterval = setInterval(checkOffers, 3000);
    } else {
      setCurrentOffer(null);
      setOfferTimeRemaining(0);
      setCustomerNameForOffer(null);
      setCustomerRatingForOffer(null);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isAvailable, user?.id, isTripActive, currentOffer?.id, currentLocation]);

  // NUEVO EFECTO 2: Para detectar cercanía al origen del viaje y mostrar la tarjeta de confirmación
  useEffect(() => {
    if (isTripActive && !isTripStartedLocallyConfirmed && currentLocation && currentOffer) {
      const originLat = parseFloat(currentOffer.origin.lat);
      const originLong = parseFloat(currentOffer.origin.long);

      if (!isNaN(originLat) && !isNaN(originLong)) {
        const distance = getDistanceInMeters(
          currentLocation.lat,
          currentLocation.long,
          originLat,
          originLong
        );

        if (distance <= 50) { // Si está a 50 metros o menos del origen
          setShowStartTripConfirmation(true);
        } else {
          setShowStartTripConfirmation(false);
        }
      }
    } else {
      // Reiniciar si el viaje no está activo, ya se confirmó localmente, o faltan datos
      setShowStartTripConfirmation(false);
    }
  }, [isTripActive, isTripStartedLocallyConfirmed, currentLocation, currentOffer]); // Dependencias clave

  // NUEVO EFECTO 3: Para detectar cercanía al destino del viaje y mostrar la tarjeta de confirmación de finalización
  useEffect(() => {
    // Solo si el viaje está activo, el inicio ya fue confirmado, el final NO fue confirmado,
    // tenemos ubicación y datos de la oferta
    if (isTripActive && isTripStartedLocallyConfirmed && !isTripEndedLocallyConfirmed && currentLocation && currentOffer) {
      const destinationLat = parseFloat(currentOffer.destination.lat);
      const destinationLong = parseFloat(currentOffer.destination.long);

      if (!isNaN(destinationLat) && !isNaN(destinationLong)) {
        const distance = getDistanceInMeters(
          currentLocation.lat,
          currentLocation.long,
          destinationLat,
          destinationLong
        );

        if (distance <= 50) { // Si está a 50 metros o menos del destino
          setShowEndTripConfirmation(true);
        } else {
          setShowEndTripConfirmation(false);
        }
      }
    } else {
      // Reiniciar si el viaje no está en el estado correcto, ya se confirmó localmente, o faltan datos
      setShowEndTripConfirmation(false);
    }
  }, [isTripActive, isTripStartedLocallyConfirmed, isTripEndedLocallyConfirmed, currentLocation, currentOffer]); // Dependencias clave

  // Contador regresivo local para la oferta (EXISTENTE)
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout | null = null;
    if (currentOffer && offerTimeRemaining > 0) {
      countdownTimer = setInterval(() => {
        setOfferTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer!);
            setCurrentOffer(null);
            setMapRouteStart(null);
            setMapRouteEnd(null);
            setMapRouteOriginToDestinationEnd(null);
            setCustomerNameForOffer(null);
            setCustomerRatingForOffer(null);
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

  // Efecto para gestionar el heartbeat cuando el tower está disponible (EXISTENTE)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isAvailable && user?.id && currentLocation) {
      const updateHeartbeat = async () => {
        if (currentLocation) {
          await refreshTowerHeartbeatAndLocation(currentLocation);
        }
      };

      intervalId = setInterval(updateHeartbeat, 20000);

      updateHeartbeat();

    } else if (intervalId) {
      clearInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAvailable, user?.id, currentLocation]);

  const handleAliasUpdateSuccess = useCallback(() => {
    setRecheckTrigger(prev => !prev);
  }, []);

  // Función para manejar el cambio de disponibilidad (EXISTENTE)
  const handleToggleAvailability = async () => {
    if (!user?.id || !currentLocation) {
      console.error("No se pudo obtener la información de usuario o la ubicación para cambiar la disponibilidad.");
      return;
    }

    const newAvailabilityState = !isAvailable;

    // Usar selectedVehicleForAvailability para enviar a Redis
    if (!selectedVehicleForAvailability) {
      console.error("No hay un vehículo seleccionado para cambiar la disponibilidad.");
      return;
    }

    const success = await toggleTowerAvailability(
      newAvailabilityState,
      newAvailabilityState ? currentLocation : null,
      newAvailabilityState ? selectedVehicleForAvailability : null // Pasar el vehículo seleccionado
    );

    if (success) {
      setIsAvailable(newAvailabilityState);
    } else {
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
        setCurrentOffer(null);
        setOfferTimeRemaining(0);
        setIsTripActive(true);
        setCustomerNameForOffer(null);
        setCustomerRatingForOffer(null);
      } else {
        console.error("Error al aceptar la oferta:", data.error);
      }
    } catch (error) {
      console.error("Error en la solicitud para aceptar oferta:", error);
    }
  };

  // NUEVA FUNCIÓN: Para rechazar una oferta de viaje
  const handleRejectOffer = async (tripId: string) => {
    if (!user?.id) {
      console.error("User ID not available to reject offer.");
      return;
    }

    setCurrentOffer(null);
    setOfferTimeRemaining(0);
    setCustomerNameForOffer(null);
    setCustomerRatingForOffer(null);
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
      } else {
        console.error("Error al rechazar la oferta:", data.error);
      }
    } catch (error) {
      console.error("Error en la solicitud para rechazar oferta:", error);
    }
  };

  // NUEVA FUNCIÓN: Para manejar la confirmación de inicio de viaje (dummy por ahora)
  const handleConfirmTripStart = (tripId: string) => {
    console.log(`Inicio de viaje ${tripId} confirmado localmente.`);
    setIsTripStartedLocallyConfirmed(true); // Marca el viaje como iniciado localmente
    setShowStartTripConfirmation(false); // Oculta la tarjeta de confirmación
    // A futuro: Aquí se enviará una llamada a la API para actualizar el estado del viaje en el backend.
  };

  // NUEVA FUNCIÓN: Para manejar la confirmación de finalización de viaje (dummy por ahora)
  const handleConfirmTripEnd = (tripId: string) => {
    console.log(`Finalización de viaje ${tripId} confirmada localmente.`);
    setIsTripEndedLocallyConfirmed(true); // Marca el viaje como finalizado localmente
    setShowEndTripConfirmation(false); // Oculta la tarjeta de confirmación
    setIsTripActive(false); // Considerar el viaje como no activo
    // Limpiar rutas del mapa y oferta
    setCurrentOffer(null);
    setMapRouteStart(null);
    setMapRouteEnd(null);
    setMapRouteOriginToDestinationEnd(null);
    // A futuro: Aquí se enviará una llamada a la API para actualizar el estado del viaje en el backend.
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <ServiceHeader
        isAvailable={isAvailable}
        setIsAvailable={handleToggleAvailability}
        isTripActive={isTripActive}
        isButtonEnabled={arePrerequisitesLoaded && !!selectedVehicleForAvailability}
      />
      <div className="flex-1 w-full h-full">
        <DynamicInteractiveMap
          userLocation={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.long } : null}
          routeStart={mapRouteStart}
          routeEnd={mapRouteEnd}
          tripDestination={mapRouteOriginToDestinationEnd}
          isTripActive={isTripActive}
        />
      </div>

      {/* Renderizado condicional de la tarjeta de solicitud de servicio */}
      {currentOffer && offerTimeRemaining > 0 && customerNameForOffer !== null && !isTripActive && (
        <ServiceRequestCard
          customerName={customerNameForOffer || ""}
          vehicleModel={`${currentOffer.vehicle.brand} ${currentOffer.vehicle.model} (${currentOffer.vehicle.year})`}
          vehiclePlate="N/D"
          originAddress={`Lat: ${currentOffer.origin.lat}, Long: ${currentOffer.origin.long}`}
          destinationAddress={`Lat: ${currentOffer.destination.lat}, Long: ${currentOffer.destination.long}`}
          serviceValue={150.00} // Asume un valor fijo por ahora, o tómalo de currentOffer
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
          tripId={currentOffer.id}
          customerRating={customerRatingForOffer}
        />
      )}

      {/* Renderizado condicional de la tarjeta de confirmación de inicio de viaje */}
      {isTripActive && showStartTripConfirmation && !isTripStartedLocallyConfirmed && currentOffer && (
        <ServiceTripStartConfirmationCard
          customerName={customerNameForOffer || ""}
          vehicleModel={`${currentOffer.vehicle.brand} ${currentOffer.vehicle.model} (${currentOffer.vehicle.year})`}
          destinationAddress={`Lat: ${currentOffer.destination.lat}, Long: ${currentOffer.destination.long}`}
          onConfirmStart={handleConfirmTripStart}
          tripId={currentOffer.id}
        />
      )}

      {/* NUEVO: Renderizado condicional de la tarjeta de confirmación de finalización de viaje */}
      {isTripActive && isTripStartedLocallyConfirmed && showEndTripConfirmation && !isTripEndedLocallyConfirmed && currentOffer && (
        <ServiceTripEndingConfirmationCard
          customerName={customerNameForOffer || ""}
          destinationAddress={`Lat: ${currentOffer.destination.lat}, Long: ${currentOffer.destination.long}`} // Mostrar la dirección de destino
          onConfirmEnd={handleConfirmTripEnd}
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
