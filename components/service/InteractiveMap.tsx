"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useNoVehicleErrorModal } from "@/components/providers/NoVehicleErrorModalProvider";
import { getTowerVehicles } from "@/app/actions/vehicle";
import ServiceRequestCard from "./ServiceRequestCard";
import mockServiceRequests from "@/lib/mockServiceRequests.json"; // Importar el archivo JSON

// Interfaz para los datos del pedido de servicio
interface ServiceRequest {
  tripId: string;
  customerName: string;
  customerRating?: number;
  vehicleModel: string;
  vehiclePlate: string;
  originAddress: string;
  serviceValue: number;
  originCoordinates: { lat: number; lng: number };
}

// Componente para re-centrar el mapa cuando la posición o la solicitud de servicio cambian
function MapRecenter({
  currentPosition,
  serviceOrigin,
  simulationTarget, // Añadir simulationTarget aquí
}: {
  currentPosition: L.LatLngExpression;
  serviceOrigin: L.LatLngExpression | null;
  simulationTarget: L.LatLngExpression | null; // Nuevo prop para el destino de la simulación
}) {
  const map = useMap();
  useEffect(() => {
    const target = simulationTarget || serviceOrigin; // Usar el destino de simulación si existe, de lo contrario el origen del servicio

    if (target) {
      // Si hay un objetivo (origen de servicio o destino de simulación), centrar el mapa entre la posición actual y el objetivo
      const bounds = L.latLngBounds([currentPosition, target]);
      map.flyToBounds(bounds, {
        animate: true,
        duration: 1.5,
        padding: L.point(50, 50), // Añadir padding para que los marcadores no queden en los bordes
      });
    } else {
      // Si no hay objetivo, centrar solo en la posición actual
      map.flyTo(currentPosition, map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [currentPosition, serviceOrigin, simulationTarget, map]);
  return null;
}

export default function InteractiveMap() {
  // Mover la configuración de iconos de Leaflet a un useEffect para asegurar que se ejecute solo en el cliente
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
      iconUrl: '/leaflet/images/marker-icon.png',
      shadowUrl: '/leaflet/images/marker-shadow.png',
      iconSize: [25, 41],   // Tamaño del icono
      iconAnchor: [12, 41], // Punto del icono que corresponde a la ubicación del marcador
      popupAnchor: [1, -34], // Punto desde el que se abrirán los popups
      shadowSize: [41, 41]  // Tamaño de la sombra
    });
  }, []); // Dependencias vacías para que se ejecute solo una vez al montar

  const serviceMarkerIcon = useMemo(() => new L.Icon({
    iconUrl: '/leaflet/images/marker-icon.png', // Un nuevo icono para los pedidos de servicio
    iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
    iconSize: [25, 41],   // Tamaño del icono
    iconAnchor: [12, 41], // Punto del icono que corresponde a la ubicación del marcador
    popupAnchor: [1, -34], // Punto desde el que se abrirán los popups
    shadowSize: [41, 41]  // Tamaño de la sombra]
  }), []);


  const { user, isLoaded } = useUser();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<L.LatLngExpression>([
    -34.6037, -58.3816,
  ]); // Por defecto, centro de Buenos Aires
  const [hasVehicle, setHasVehicle] = useState(false);
  const { openNoVehicleErrorModal } = useNoVehicleErrorModal();

  const [currentServiceRequest, setCurrentServiceRequest] = useState<ServiceRequest | null>(null); // Inicializar como null
  const [routeCoordinates, setRouteCoordinates] = useState<L.LatLngExpression[]>([]); // Estado para las coordenadas de la ruta
  const [isSimulatingMovement, setIsSimulatingMovement] = useState(false); // Nuevo estado para controlar la simulación de movimiento
  const [destinationForSimulation, setDestinationForSimulation] = useState<L.LatLngExpression | null>(null); // Destino final de la simulación

  // Referencia para el ID del temporizador de la simulación de movimiento
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Referencia para almacenar la posición de inicio de la simulación
  const simulationStartPositionRef = useRef<L.LatLngExpression | null>(null);

  const serviceOriginPosition = useMemo(() => {
    if (currentServiceRequest) {
      return [
        currentServiceRequest.originCoordinates.lat,
        currentServiceRequest.originCoordinates.lng,
      ] as L.LatLngExpression;
    }
    return null;
  }, [currentServiceRequest]);

  // Función para obtener la ruta de OSRM
  const fetchRoute = useCallback(async (start: L.LatLngExpression, end: L.LatLngExpression) => {
    if (!Array.isArray(start) || !Array.isArray(end)) {
      console.error("Coordenadas de inicio o fin no válidas para la ruta.");
      setRouteCoordinates([]);
      return;
    }

    const startCoords = `${start[1]},${start[0]}`; // OSRM espera longitud, latitud
    const endCoords = `${end[1]},${end[0]}`;     // OSRM espera longitud, latitud
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords};${endCoords}?geometries=geojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error de OSRM: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeGeoJSON = data.routes[0].geometry.coordinates;
        // OSRM devuelve [lng, lat], Leaflet espera [lat, lng]
        const formattedCoordinates = routeGeoJSON.map((coord: [number, number]) => [coord[1], coord[0]]);
        setRouteCoordinates(formattedCoordinates);
      } else {
        setRouteCoordinates([]);
        console.warn("No se encontró una ruta.");
      }
    } catch (error) {
      console.error("Error al obtener la ruta:", error);
      setRouteCoordinates([]);
    }
  }, []);

  // Referencias para los IDs de los temporizadores
  // Referencias para los IDs de los temporizadores de solicitudes
  const scheduleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const acceptTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar solo los temporizadores y el estado de la solicitud
  const clearServiceRequestState = useCallback(() => {
    if (scheduleTimerRef.current) {
      clearTimeout(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }
    if (acceptTimerRef.current) {
      clearTimeout(acceptTimerRef.current);
      acceptTimerRef.current = null;
    }
    setCurrentServiceRequest(null);
    setRouteCoordinates([]); // Limpiar la ruta asociada a la solicitud
    console.log("Temporizadores de solicitud y solicitud actual limpiados.");
  }, []);

  // Función para limpiar todos los estados y detener cualquier proceso (reseteo completo)
  const clearAllTimers = useCallback(() => {
    clearServiceRequestState(); // Limpiar lo relacionado con la solicitud
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulatingMovement(false); // Asegurarse de detener la simulación
    setDestinationForSimulation(null); // Limpiar el destino de la simulación
    setIsAvailable(false); // Forzar a no disponible en un reseteo completo
    simulationStartPositionRef.current = null; // Limpiar la referencia de posición inicial
    console.log("Todos los temporizadores y estados (incluida simulación) han sido limpiados.");
  }, [clearServiceRequestState, simulationStartPositionRef]); // Depende de clearServiceRequestState y simulationStartPositionRef

  // Función para programar una nueva solicitud
  const scheduleNewRequest = useCallback(() => {
    // Asegurarse de que no haya temporizadores pendientes antes de programar una nueva
    clearServiceRequestState(); // Usar la limpieza granular

    if (isAvailable && hasVehicle) {
      const delay = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 1000; // Retraso aleatorio de 5 a 15 segundos
      console.log(`Programando nueva solicitud en ${delay / 1000} segundos.`);

      scheduleTimerRef.current = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * mockServiceRequests.length);
        const randomRequest = mockServiceRequests[randomIndex];
        setCurrentServiceRequest(randomRequest);
        console.log(`Nueva solicitud ${randomRequest.tripId} mostrada.`);

        // Establece un temporizador de 5 segundos para que la solicitud sea aceptada
        acceptTimerRef.current = setTimeout(() => {
          console.log(`Solicitud ${randomRequest.tripId} caducó.`);
          clearAllTimers(); // La solicitud caduca, se limpia y se permite programar otra
        }, 5000); // 5 segundos para aceptar
      }, delay);
    }
  }, [isAvailable, hasVehicle, clearAllTimers]);

  // Efecto para verificar vehículos del Tower al cargar o cambiar el usuario
  useEffect(() => {
    if (isLoaded && user?.id) {
      const checkVehicles = async () => {
        const result = await getTowerVehicles();
        if (result.success && result.data && (result.data as any[]).length > 0) {
          setHasVehicle(true);
        } else {
          setHasVehicle(false);
          setIsAvailable(false); // Si no hay vehículo, no puede estar disponible
          clearAllTimers(); // Limpia cualquier solicitud pendiente
        }
      };
      checkVehicles();
    }
  }, [isLoaded, user?.id, clearAllTimers]);

  // Efecto para obtener la ubicación actual del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error al obtener geolocalización:", error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("La geolocalización no es compatible con este navegador.");
    }
  }, []);

  // Efecto de limpieza global para los temporizadores (al desmontar el componente)
  useEffect(() => {
    return () => {
      clearAllTimers(); // Resetea todo al desmontar
    };
  }, [clearAllTimers]);


  // Efecto principal para gestionar el flujo de solicitudes de servicio
  useEffect(() => {
    // Si el conductor está disponible, tiene vehículo, no hay solicitud activa Y no hay temporizadores de solicitud
    // Y NO se está simulando movimiento.
    if (isAvailable && hasVehicle && !currentServiceRequest && !scheduleTimerRef.current && !acceptTimerRef.current && !isSimulatingMovement) {
      scheduleNewRequest();
    } 
    // Si NO está disponible O NO tiene vehículo, Y NO se está simulando movimiento,
    // entonces se detiene el flujo de solicitudes y la simulación.
    // Esto previene que clearAllTimers() detenga una simulación en curso si isAvailable se vuelve false
    // como parte del inicio de la simulación.
    else if ((!isAvailable || !hasVehicle) && !isSimulatingMovement) {
      clearAllTimers();
    }
    // Si isSimulatingMovement es true, simplemente se deja que la simulación termine por su cuenta,
    // este useEffect no interfiere con ella.
  }, [isAvailable, hasVehicle, currentServiceRequest, scheduleNewRequest, clearAllTimers, isSimulatingMovement]);


  // Efecto para dibujar la ruta cuando las posiciones cambian (tanto para solicitud activa como para simulación)
  useEffect(() => {
    if (isSimulatingMovement && destinationForSimulation) {
      fetchRoute(currentPosition, destinationForSimulation);
    } else if (currentServiceRequest && serviceOriginPosition) {
      fetchRoute(currentPosition, serviceOriginPosition);
    } else {
      setRouteCoordinates([]); // Limpiar la ruta si no hay solicitud y no hay simulación
    }
  }, [currentPosition, serviceOriginPosition, currentServiceRequest, destinationForSimulation, isSimulatingMovement, fetchRoute]); // Añadir dependencias de simulación

  // Efecto para la simulación de movimiento del conductor
  useEffect(() => {
    if (isSimulatingMovement && destinationForSimulation) {
      // Capturar la posición inicial para la simulación SOLO cuando comienza
      if (!simulationStartPositionRef.current) {
        simulationStartPositionRef.current = currentPosition;
        console.log("SIMULACION: Posición inicial capturada:", currentPosition);
      }

      const startCoords = simulationStartPositionRef.current; // Usar la posición capturada
      const endCoords = destinationForSimulation;

      if (!Array.isArray(startCoords) || !Array.isArray(endCoords)) {
        console.error("Coordenadas de inicio o fin no válidas para simulación de movimiento.");
        setIsSimulatingMovement(false);
        // Limpiar la referencia de posición inicial en caso de error
        simulationStartPositionRef.current = null;
        return;
      }

      const totalDuration = 10000; // 10 segundos
      const updateInterval = 100; // Actualizar cada 100 ms
      const totalSteps = totalDuration / updateInterval;
      let currentStep = 0;

      // Calcular las diferencias basadas en la posición inicial capturada
      const latDiff = (endCoords[0] - startCoords[0]) / totalSteps;
      const lngDiff = (endCoords[1] - startCoords[1]) / totalSteps;
      console.log("SIMULACION: startCoords", startCoords, "endCoords", endCoords);
      console.log("SIMULACION: latDiff", latDiff, "lngDiff", lngDiff);
      console.log("SIMULACION: Estableciendo el intervalo de simulación."); // Log para el establecimiento del intervalo

      simulationIntervalRef.current = setInterval(() => {
        console.log(`SIMULACION: Intervalo de movimiento ejecutándose. Paso: ${currentStep}`); // Log dentro del callback del intervalo
        if (currentStep < totalSteps) {
          setCurrentPosition((prevPos) => {
            const currentLat = (prevPos as number[])[0];
            const currentLng = (prevPos as number[])[1];
            
            const newPos: L.LatLngExpression = [
              currentLat + latDiff,
              currentLng + lngDiff,
            ];
            // Log detallado de la actualización de posición
            console.log(`SIMULACION: Paso ${currentStep} - Actualizando posición: De [${currentLat}, ${currentLng}] a [${newPos[0]}, ${newPos[1]}]`);
            return newPos;
          });
          currentStep++;
        } else {
          // Simulación completa o muy cerca del destino
          setCurrentPosition(endCoords); // Ajustar a la posición final
          setIsSimulatingMovement(false); // Detener explícitamente la simulación
          setDestinationForSimulation(null); // Limpiar el destino
          setIsAvailable(true); // Una vez completado el viaje, el conductor vuelve a estar disponible
          clearServiceRequestState(); // Asegurarse de que no haya residuos de solicitud
          simulationStartPositionRef.current = null; // Limpiar la referencia al finalizar
          console.log("Simulación de movimiento completada. Conductor ahora disponible.");
        }
      }, updateInterval);
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      // También limpiar la referencia de posición inicial si el efecto se limpia por otras razones
      simulationStartPositionRef.current = null;
    };
  }, [isSimulatingMovement, destinationForSimulation, clearServiceRequestState, setIsAvailable]); // currentPosition no es una dependencia para evitar re-crear el intervalo. clearAllTimers ya no se llama al final.

  const handleToggleAvailability = () => {
    if (!hasVehicle) {
      openNoVehicleErrorModal();
      return;
    }
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);

    console.log(`Mock: Actualizando disponibilidad para el usuario ${user?.id} a ${newAvailability}`);
    // Aquí se integraría con Redis para actualizar el estado del conductor
    // Por ejemplo: updateDriverAvailability(user.id, newAvailability ? 'AVAILABLE' : 'UNAVAILABLE');
  };

  const handleAcceptServiceRequest = (tripId: string) => {
    console.log(`Pedido ${tripId} aceptado!`);
    
    // 1. Capturar el destino de la solicitud ANTES de limpiar currentServiceRequest
    let targetDestination: L.LatLngExpression | null = null;
    if (currentServiceRequest) {
      targetDestination = [
        currentServiceRequest.originCoordinates.lat,
        currentServiceRequest.originCoordinates.lng,
      ];
    } else {
      console.error("No se encontró currentServiceRequest al aceptar. La simulación no puede iniciar.");
      return; // No hay solicitud, no se puede aceptar
    }

    // 2. Limpiar solo el estado de la solicitud pendiente
    clearServiceRequestState(); 
    
    // 3. Establecer el estado para iniciar la simulación
    setIsAvailable(false); // El conductor pasa a no disponible para nuevas solicitudes
    setDestinationForSimulation(targetDestination); // Establecer el destino de la simulación
    setIsSimulatingMovement(true); // Iniciar la simulación de movimiento

    console.log("Simulación de movimiento iniciada con destino:", targetDestination);

    // Aquí se integraría la lógica para iniciar el viaje real,
    // enviar notificaciones, etc.
  };

  return (
    <div className="relative flex-1 w-full h-full">
      <MapContainer
        center={currentPosition} // El centro inicial del mapa será la posición actual (por defecto o real)
        zoom={17}
        scrollWheelZoom={true}
        zoomControl={false} // Deshabilitar el control de zoom por defecto
        className="h-full w-full z-0"
      >
        <MapRecenter
          currentPosition={currentPosition}
          serviceOrigin={serviceOriginPosition}
          simulationTarget={destinationForSimulation} // Pasar el destino de la simulación
        />{" "}
        {/* Componente para re-centrar el mapa dinámicamente */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={currentPosition}></Marker>
        {serviceOriginPosition && (
          <Marker position={serviceOriginPosition} icon={serviceMarkerIcon}></Marker>
        )}
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#4F46E5" weight={5} /> // Color azul para la ruta
        )}
        <ZoomControl position="bottomright" /> {/* Añadir control de zoom en la parte inferior derecha */}
      </MapContainer>

      {/* Botón de Disponibilidad superpuesto */}
      <div className="absolute top-16 mt-4 right-4 z-[1001]">
        <Button
          onClick={handleToggleAvailability}
          className={`font-bold ${
            isSimulatingMovement // Si se está simulando movimiento
              ? "bg-indigo-600 text-white cursor-not-allowed"
              : currentServiceRequest // Si hay una solicitud activa, mostrar color de "Solicitud Activa"
                ? "bg-yellow-600 text-slate-950 cursor-not-allowed"
                : (isAvailable // Si está disponible, mostrar "Disponible", sino "No Disponible"
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-slate-400 hover:bg-slate-600 text-white"
                  )
          }`}
          disabled={!hasVehicle || currentServiceRequest !== null || isSimulatingMovement} // Deshabilitar si no hay vehículo, hay una solicitud activa o está simulando movimiento
        >
          {!hasVehicle // Si no tiene vehículo
            ? "Añadir Vehículo para Activar"
            : isSimulatingMovement // Si se está simulando movimiento
              ? "En Camino"
              : (currentServiceRequest // Si hay una solicitud activa
                  ? "Solicitud Activa"
                  : (isAvailable ? "Esperando Solicitud" : "No Disponible") // Si está disponible o no
                )
          }
        </Button>
      </div>

      {/* Tarjeta de Pedido de Servicio superpuesta */}
      {currentServiceRequest && ( // Mostrar la tarjeta si hay un pedido activo
        <div className="absolute bottom-4 left-4 z-[1001] w-[90%] max-w-sm"> {/* Posicionado a la izquierda */}
          <ServiceRequestCard
            {...currentServiceRequest} // Pasar los datos de la solicitud aleatoria
            onAccept={handleAcceptServiceRequest} // Usar la nueva función de aceptación
          />
        </div>
      )}
    </div>
  );
}
