"use client";

import dynamic from "next/dynamic";
import ServiceHeader from "@/components/service/ServiceHeader";
import ServiceRequestCard from "@/components/service/ServiceRequestCard";
import ServiceTripStartConfirmationCard from "@/components/service/ServiceTripStartConfirmationCard";
import ServiceTripEndingConfirmationCard from "@/components/service/ServiceTripEndingConfirmationCard"; // NUEVO: Importar la tarjeta de finalización
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { getTowerData, getTowerIdByClerkId, TowerData } from "@/app/actions/tower";
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
import { recordAcceptedAssignment, completeAssignment } from "@/app/actions/assignments";
import { createDisbursement } from "@/app/actions/payments"; // NUEVO: Importar createDisbursement
import * as turf from '@turf/turf'

interface Vehicle {
  vehicle_id: string;
  brand: string;
  model: string;
  year: number;
  max_load: number;
  deactivated: boolean;
}

// Definir la interfaz Coordinates para compatibilidad con InteractiveMap
interface Coordinates {
  lat: number;
  long: number;
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
  const [mapRouteStart, setMapRouteStart] = useState<Coordinates | null>(null);
  const [mapRouteEnd, setMapRouteEnd] = useState<Coordinates | null>(null);
  const [mapRouteOriginToDestinationEnd, setMapRouteOriginToDestinationEnd] = useState<Coordinates | null>(null);

  const [isTripActive, setIsTripActive] = useState(false);
  // NUEVO ESTADO: Para controlar la visibilidad de la tarjeta de confirmación de inicio de viaje
  const [showStartTripConfirmation, setShowStartTripConfirmation] = useState(false);
  // NUEVO ESTADO: Para el estado local después de confirmar el inicio (dummy por ahora)
  const [isTripStartedLocallyConfirmed, setIsTripStartedLocallyConfirmed] = useState(false);
  // NUEVO ESTADO: Para controlar la visibilidad de la tarjeta de confirmación de finalización de viaje
  const [showEndTripConfirmation, setShowEndTripConfirmation] = useState(false);
  // NUEVO ESTADO: Para el estado local después de confirmar la finalización (dummy por ahora)
  const [isTripEndedLocallyConfirmed, setIsTripEndedLocallyConfirmed] = useState(false);

  // NUEVO: Estado para almacenar los detalles del viaje activo una vez aceptado
  const [activeTripDetails, setActiveTripDetails] = useState<any | null>(null);
  const [activeTripCustomerName, setActiveTripCustomerName] = useState<string | null>(null);
  const [activeTripCustomerRating, setActiveTripCustomerRating] = useState<number | null>(null);

  // NUEVO: Estados para la notificación de pago
  const [showPaymentSuccessMessage, setShowPaymentSuccessMessage] = useState(false);
  const [paymentNotificationMessage, setPaymentNotificationMessage] = useState("");

  // NUEVO: Estado para el modo de ubicación manual
  const [isManualLocationMode, setIsManualLocationMode] = useState(false);

  // NUEVO: Función para alternar el modo de ubicación manual
  const toggleManualLocationMode = useCallback(() => {
    setIsManualLocationMode(prevMode => !prevMode);
  }, []);

  // NUEVO: Función para manejar el cambio de ubicación desde el mapa en modo manual
  const handleManualLocationChange = useCallback((location: Coordinates) => {
    setCurrentLocation({ lat: location.lat, long: location.long });
    console.log("Ubicación manual establecida:", location);
  }, []);

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
        }, 5000);
      } finally {
        setIsLoading(false);
        setArePrerequisitesLoaded(true);
      }
    }

    loadServicePrerequisites();
  }, [isLoaded, user?.id, router, recheckTrigger, selectedVehicleForAvailability]);

  // Efecto para obtener y actualizar la ubicación del usuario
  useEffect(() => {
    if (isManualLocationMode) {
      // Si está en modo manual, no uses navigator.geolocation
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      return;
    }

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
          setWatchId(null); // Asegurarse de limpiar el watchId al desmontar o cambiar de modo
        }
      };
    } else {
      console.warn("ServicePageClient: Geolocation no soportado o no disponible.");
    }
  }, [isManualLocationMode]); // Dependencia clave: isManualLocationMode

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
            console.log(data);
            setIsTripStartedLocallyConfirmed(false); // NUEVO: Asegurarse de que sea falso para una nueva oferta

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
              setMapRouteStart({ lat: currentLocation.lat, long: currentLocation.long }); // NUEVO: Actualizar inicio de ruta a ubicación actual del conductor
              setMapRouteEnd({ lat: parseFloat(data.trip.origin.lat), long: parseFloat(data.trip.origin.long) });
              setMapRouteOriginToDestinationEnd({ lat: parseFloat(data.trip.destination.lat), long: parseFloat(data.trip.destination.long) });
            }
          } else {
            setOfferTimeRemaining(data.time_remaining);
            // NUEVO: Si es la misma oferta, pero la ubicación del conductor ha cambiado, actualizar mapRouteStart
            if (currentLocation && isAvailable && !isTripActive) {
              setMapRouteStart({ lat: currentLocation.lat, long: currentLocation.long });
            }
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
            setIsTripStartedLocallyConfirmed(false); // NUEVO: Resetear al limpiar oferta
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
    // Usar activeTripDetails en lugar de currentOffer para el viaje activo
    if (isTripActive && !isTripStartedLocallyConfirmed && currentLocation && activeTripDetails) {
      const originLat = parseFloat(activeTripDetails.origin.lat);
      const originLong = parseFloat(activeTripDetails.origin.long);

      if (!isNaN(originLat) && !isNaN(originLong)) {
        const currentLocationPoint = turf.point([currentLocation.lat, currentLocation.long]);
        const originLocationPoint = turf.point([originLat, originLong]);
        const distance = turf.distance(currentLocationPoint, originLocationPoint, { units: 'meters' });

        if (distance <= 50) {
          setShowStartTripConfirmation(true);
        } else {
          setShowStartTripConfirmation(false);
        }
      } else {
        console.error("  Coordenadas de origen no válidas:", activeTripDetails.origin); // Usar activeTripDetails
        setShowStartTripConfirmation(false);
      }
    } else {
      setShowStartTripConfirmation(false);
    }
  }, [isTripActive, isTripStartedLocallyConfirmed, currentLocation, activeTripDetails]); // Dependencia: activeTripDetails

  // NUEVO EFECTO 3: Para detectar cercanía al destino del viaje y mostrar la tarjeta de confirmación de finalización
  useEffect(() => {
    // Solo si el viaje está activo, el inicio ya fue confirmado, el final NO fue confirmado,
    // tenemos ubicación y datos del viaje activo
    if (isTripActive && isTripStartedLocallyConfirmed && !isTripEndedLocallyConfirmed && currentLocation && activeTripDetails) {
      const destinationLat = parseFloat(activeTripDetails.destination.lat); // Usar activeTripDetails
      const destinationLong = parseFloat(activeTripDetails.destination.long); // Usar activeTripDetails

      if (!isNaN(destinationLat) && !isNaN(destinationLong)) {
        const currentLocationPoint = turf.point([currentLocation.lat, currentLocation.long]);
        const destinationLocationPoint = turf.point([destinationLat, destinationLong]);
        const distance = turf.distance(currentLocationPoint, destinationLocationPoint, { units: 'meters' });

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
  }, [isTripActive, isTripStartedLocallyConfirmed, isTripEndedLocallyConfirmed, currentLocation, activeTripDetails]); // Dependencia: activeTripDetails

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
        setOfferTimeRemaining(0);
        setIsTripActive(true);
        setIsTripStartedLocallyConfirmed(false); // IMPORTANTE: Resetear para el nuevo viaje

        // Almacenar los detalles de la oferta como el viaje activo
        setActiveTripDetails(currentOffer);

        // Fetch y almacenar el nombre y rating del cliente para el viaje activo
        if (currentOffer?.customer_id) {
          try {
            const customerNameResult = await getCustomerName(currentOffer.customer_id);
            if (customerNameResult.success && customerNameResult.fullname) {
              setActiveTripCustomerName(customerNameResult.fullname);
            } else {
              console.error("Error al obtener el nombre del cliente para viaje activo:", customerNameResult.error);
              setActiveTripCustomerName("Cliente desconocido");
            }
          } catch (nameError) {
            console.error("Error al invocar Server Action getCustomerName para viaje activo:", nameError);
            setActiveTripCustomerName("Cliente desconocido (error)");
          }
          try {
            const customerRatingResult = await getAverageRatingForCustomer(currentOffer.customer_id);
            if (customerRatingResult.success) {
              setActiveTripCustomerRating(customerRatingResult.rating ?? null);
            } else {
              console.error("Error al obtener la calificación del cliente para viaje activo:", customerRatingResult.error);
              setActiveTripCustomerRating(null);
            }
          } catch (ratingError) {
            console.error("Error al invocar Server Action getAverageRatingForCustomer para viaje activo:", ratingError);
            setActiveTripCustomerRating(null);
          }
        } else {
          setActiveTripCustomerName("Cliente desconocido (ID no disponible)");
          setActiveTripCustomerRating(null);
        }

        // Configurar las rutas para la primera pierna del viaje: conductor -> origen del viaje
        // (Usa currentOffer aquí antes de que se limpie, o activeTripDetails que ya lo almacena)
        if (currentLocation && currentOffer && currentOffer.origin && currentOffer.destination) {
          setMapRouteStart({ lat: currentLocation.lat, long: currentLocation.long }); // Driver's current location
          setMapRouteEnd({ lat: parseFloat(currentOffer.origin.lat), long: parseFloat(currentOffer.origin.long) }); // Trip origin
          setMapRouteOriginToDestinationEnd({ lat: parseFloat(currentOffer.destination.lat), long: parseFloat(currentOffer.destination.long) }); // Final destination for context
        }

        // NUEVO: Registrar el viaje aceptado como una asignación en la base de datos
        if (user?.id && currentOffer) { // Usar activeTripDetails que ya tiene la info de la oferta
          const assignmentData = {
            tripId: currentOffer.id,
            towerId: (await getTowerIdByClerkId(user.id)).towerId!,
            location: { // La ubicación del origen del viaje
              lat: currentOffer.origin.lat,
              long: currentOffer.origin.long,
            },
          };
          const assignmentResult = await recordAcceptedAssignment(assignmentData);
          if (assignmentResult.success) {
            console.log("Asignación de viaje aceptada registrada en la DB con ID:", assignmentResult.assignmentId);
          } else {
            console.error("Fallo al registrar la asignación de viaje aceptada en la DB:", assignmentResult.error);
          }
        }

        // Limpiar la oferta pendiente una vez aceptada
        setCurrentOffer(null);
        setOfferTimeRemaining(0);
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
    console.log(`Inicio de viaje ${tripId} confirmado localmente. Ahora hacia el destino final.`);
    setIsTripStartedLocallyConfirmed(true); // Marca el viaje como iniciado localmente
    setShowStartTripConfirmation(false); // Oculta la tarjeta de confirmación
    // A futuro: Aquí se enviará una llamada a la API para actualizar el estado del viaje en el backend.

    // Configurar las rutas para la segunda pierna del viaje: conductor -> destino final
    if (activeTripDetails && currentLocation) { // Usar activeTripDetails
      setMapRouteStart({ lat: currentLocation.lat, long: currentLocation.long }); // Driver's current location
      setMapRouteEnd({ lat: parseFloat(activeTripDetails.destination.lat), long: parseFloat(activeTripDetails.destination.long) }); // Final destination
      // mapRouteOriginToDestinationEnd ya contiene el destino final, no necesita cambiarse
    }
  };

  // NUEVA FUNCIÓN: Para manejar la confirmación de finalización de viaje (dummy por ahora)
  const handleConfirmTripEnd = async (tripId: string) => { // CAMBIO: Ahora es asíncrona
    console.log(`Finalización de viaje ${tripId} confirmada localmente.`);
    setIsTripEndedLocallyConfirmed(true); // Marca el viaje como finalizado localmente
    setShowEndTripConfirmation(false); // Oculta la tarjeta de confirmación
    setIsTripActive(false); // Considerar el viaje como no activo
    setIsTripStartedLocallyConfirmed(false); // Resetear también para el próximo viaje
    setIsTripEndedLocallyConfirmed(false); // Resetear también para el próximo viaje

    // NUEVO: Actualizar la asignación en la base de datos
    if (activeTripDetails && currentLocation && user?.id) { // Añadir user?.id a la condición
      const completionData = {
        tripId: tripId, // Usa el tripId que se pasa a la función
        finalLocation: {
          lat: String(currentLocation.lat), // Asegurarse de que sean strings
          long: String(currentLocation.long),
        },
      };
      const completionResult = await completeAssignment(completionData);
      if (completionResult.success) {
        console.log("Asignación completada y actualizada en la DB con ID:", completionResult.assignmentId);

        // NUEVO: Generar el desembolso del pago
        // Asumiendo un feePercentage del 100% para el tower por simplicidad, o podrías derivarlo de activeTripDetails.service_value
        // Se asume que activeTripDetails.service_value está disponible y es numérico para calcular el feePercentage.
        // Por ahora, usaremos un valor fijo como 100 si no se especifica.
        const feePercentage = activeTripDetails.service_value ? 100 : 100; // Ajustar según la lógica de negocio
        const disbursementResult = await createDisbursement(tripId, user.id, feePercentage); 
        if (disbursementResult.success) {
          setPaymentNotificationMessage("Se acreditó el pago en su cuenta asociada.");
          setShowPaymentSuccessMessage(true);
          console.log("Desembolso de pago generado exitosamente.");
        } else {
          setPaymentNotificationMessage(`Error al acreditar el pago en su cuenta. Contacte al soporte técnico.`);
          setShowPaymentSuccessMessage(true);
          console.error("Fallo al generar el desembolso de pago:", disbursementResult.error);
        }
      } else {
        console.error("Fallo al completar la asignación en la DB:", completionResult.error);
      }
    } else {
      console.error("No se pudo completar la asignación: faltan activeTripDetails, currentLocation o user?.id.");
    }

    // Limpiar todas las referencias del viaje activo
    setCurrentOffer(null);
    setMapRouteStart(null);
    setMapRouteEnd(null);
    setMapRouteOriginToDestinationEnd(null);
    setActiveTripDetails(null);
    setActiveTripCustomerName(null);
    setActiveTripCustomerRating(null);

    // NUEVO: Redirigir a la Feedback App para calificar el viaje, DESPUÉS de limpiar los estados locales
    const feedbackAppUrl = process.env.NEXT_PUBLIC_FEEDBACK_APP_URL;
    if (feedbackAppUrl) {
      const currentServiceUrl = window.location.origin + '/service';
      const encodedReturnUrl = encodeURIComponent(currentServiceUrl); // Codificar la URL completa
      setTimeout(() => {
        router.push(`${feedbackAppUrl}/rate/${tripId}?return_url=${encodedReturnUrl}`);
      }, 3000); // 3 segundos para mostrar la notificación antes de redirigir
    } else {
      console.error("NEXT_PUBLIC_FEEDBACK_APP_URL no está configurada, no se pudo redirigir para calificar.");
      // Opcional: Podrías redirigir a una ruta por defecto si la URL no está disponible
      // router.push("/dashboard"); 
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* NUEVO: Notificación de éxito/error de pago */}
      {showPaymentSuccessMessage && (
        <div className={`absolute w-full top-20 left-1/2 -translate-x-1/2 z-[1002] transition-opacity duration-500`}>
          <p className={`mx-4  rounded-md shadow-lg text-white font-semibold p-4 text-center ${paymentNotificationMessage.includes("Error") || true ? "bg-red-600/80" : "bg-green-600/80"}`}>
            {paymentNotificationMessage || "Error al acreditar el pago en su cuenta. Contacte al soporte técnico."}
          </p>
        </div>
      )}
      <ServiceHeader
        isAvailable={isAvailable}
        setIsAvailable={handleToggleAvailability}
        isTripActive={isTripActive}
        isButtonEnabled={arePrerequisitesLoaded && !!selectedVehicleForAvailability}
        isManualLocationMode={isManualLocationMode} // NUEVO: Pasar la prop
        toggleManualLocationMode={toggleManualLocationMode} // NUEVO: Pasar la prop
      />
      <div className="flex-1 w-full h-full">
        <DynamicInteractiveMap
          userLocation={currentLocation ? { lat: currentLocation.lat, long: currentLocation.long } : null}
          routeStart={mapRouteStart}
          routeEnd={mapRouteEnd}
          tripDestination={mapRouteOriginToDestinationEnd}
          isTripActive={isTripActive}
          isEnRouteToDestination={isTripStartedLocallyConfirmed} // NUEVA PROP
          isManualLocationMode={isManualLocationMode} // NUEVO: Pasar el estado del modo manual
          onManualLocationChange={handleManualLocationChange} // NUEVO: Pasar el callback
        />
      </div>

      {/* Renderizado condicional de la tarjeta de solicitud de servicio */}
      {currentOffer && offerTimeRemaining > 0 && customerNameForOffer !== null && !isTripActive && (
        <ServiceRequestCard
          customerName={customerNameForOffer || ""}
          vehicleModel={`${currentOffer.vehicle.brand} ${currentOffer.vehicle.model} (${currentOffer.vehicle.year})`}
          originAddress={currentOffer.origin.address}
          destinationAddress={currentOffer.destination.address}
          serviceValue={currentOffer.service_value}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
          tripId={currentOffer.id}
          customerRating={customerRatingForOffer}
        />
      )}

      {/* Renderizado condicional de la tarjeta de confirmación de inicio de viaje */}
      {isTripActive && showStartTripConfirmation && !isTripStartedLocallyConfirmed && activeTripDetails && (
        <ServiceTripStartConfirmationCard
          customerName={activeTripCustomerName || ""} // Usar activeTripCustomerName
          vehicleModel={`${activeTripDetails.vehicle.brand} ${activeTripDetails.vehicle.model} (${activeTripDetails.vehicle.year})`}
          destinationAddress={activeTripDetails.destination.address} // Usar la dirección completa
          onConfirmStart={handleConfirmTripStart}
          tripId={activeTripDetails.id}
        />
      )}

      {/* NUEVO: Renderizado condicional de la tarjeta de confirmación de finalización de viaje */}
      {isTripActive && isTripStartedLocallyConfirmed && showEndTripConfirmation && !isTripEndedLocallyConfirmed && activeTripDetails && ( // Usar activeTripDetails
        <ServiceTripEndingConfirmationCard
          customerName={activeTripCustomerName || ""}
          destinationAddress={activeTripDetails.destination.address} // Usar la dirección completa
          onConfirmEnd={handleConfirmTripEnd}
          tripId={activeTripDetails.id}
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
