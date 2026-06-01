"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from "react-leaflet";
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
}: {
  currentPosition: L.LatLngExpression;
  serviceOrigin: L.LatLngExpression | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (serviceOrigin) {
      // Si hay un origen de servicio, centrar el mapa entre la posición actual y el origen del servicio
      const bounds = L.latLngBounds([currentPosition, serviceOrigin]);
      map.flyToBounds(bounds, {
        animate: true,
        duration: 1.5,
        padding: L.point(50, 50), // Añadir padding para que los marcadores no queden en los bordes
      });
    } else {
      // Si no hay origen de servicio, centrar solo en la posición actual
      map.flyTo(currentPosition, map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [currentPosition, serviceOrigin, map]);
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

  const serviceOriginPosition = useMemo(() => {
    if (currentServiceRequest) {
      return [
        currentServiceRequest.originCoordinates.lat,
        currentServiceRequest.originCoordinates.lng,
      ] as L.LatLngExpression;
    }
    return null;
  }, [currentServiceRequest]);

  // Referencias para los IDs de los temporizadores
  const scheduleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const acceptTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar todos los temporizadores y la solicitud actual
  const clearAllTimers = useCallback(() => {
    if (scheduleTimerRef.current) {
      clearTimeout(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }
    if (acceptTimerRef.current) {
      clearTimeout(acceptTimerRef.current);
      acceptTimerRef.current = null;
    }
    setCurrentServiceRequest(null);
    console.log("Todos los temporizadores y la solicitud actual han sido limpiados.");
  }, []);

  // Función para programar una nueva solicitud
  const scheduleNewRequest = useCallback(() => {
    // Asegurarse de que no haya temporizadores pendientes antes de programar una nueva
    clearAllTimers(); 

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

  // Efecto de limpieza global para los temporizadores
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Efecto principal para gestionar el flujo de solicitudes de servicio
  useEffect(() => {
    // Si el conductor está disponible, tiene vehículo, no hay solicitud activa Y no hay un temporizador de programación en curso
    if (isAvailable && hasVehicle && !currentServiceRequest && !scheduleTimerRef.current && !acceptTimerRef.current) {
      scheduleNewRequest();
    } else if (!isAvailable || !hasVehicle) {
      // Si no está disponible o no tiene vehículo, se detiene el flujo de solicitudes
      clearAllTimers();
    }
    // No necesitamos una función de limpieza aquí, ya que el useEffect global de limpieza y clearAllTimers se encargan.
  }, [isAvailable, hasVehicle, currentServiceRequest, scheduleNewRequest, clearAllTimers]);


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
    clearAllTimers(); // Cierra la solicitud actual y limpia sus timers
    setIsAvailable(false); // El conductor pasa a no disponible para nuevas solicitudes
    // Aquí se podría integrar la lógica para iniciar el viaje real,
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
        <ZoomControl position="bottomright" /> {/* Añadir control de zoom en la parte inferior derecha */}
      </MapContainer>

      {/* Botón de Disponibilidad superpuesto */}
      <div className="absolute top-16 mt-4 right-4 z-[1001]">
        <Button
          onClick={handleToggleAvailability}
          className={`font-bold ${
            currentServiceRequest // Si hay una solicitud activa, mostrar color de "Solicitud Activa"
              ? "bg-yellow-600 text-slate-950 cursor-not-allowed"
              : (isAvailable // Si está disponible, mostrar "Disponible", sino "No Disponible"
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-slate-400 hover:bg-slate-600 text-white"
                )
          }`}
          disabled={!hasVehicle || currentServiceRequest !== null} // Deshabilitar si no hay vehículo o hay una solicitud activa
        >
          {!hasVehicle // Si no tiene vehículo
            ? "Añadir Vehículo para Activar"
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
