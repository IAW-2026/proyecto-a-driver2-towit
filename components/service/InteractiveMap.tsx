"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useNoVehicleErrorModal } from "@/components/providers/NoVehicleErrorModalProvider";
import { getTowerVehicles } from "@/app/actions/vehicle";

export default function InteractiveMap() {
  // Mover la configuración de iconos de Leaflet a un useEffect para asegurar que se ejecute solo en el cliente
  useEffect(() => {
    // Corrige los problemas de iconos predeterminados de Leaflet con Webpack/Next.js
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
      iconUrl: '/leaflet/images/marker-icon.png',
      shadowUrl: '/leaflet/images/marker-shadow.png',
    });
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  const { user, isLoaded } = useUser();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<L.LatLngExpression>([
    -34.6037, -58.3816,
  ]); // Por defecto, centro de Buenos Aires
  const [hasVehicle, setHasVehicle] = useState(false);
  const { openNoVehicleErrorModal } = useNoVehicleErrorModal();

  useEffect(() => {
    if (isLoaded && user?.id) {
      const checkVehicles = async () => {
        const result = await getTowerVehicles();
        if (result.success && result.data && (result.data as any[]).length > 0) {
          setHasVehicle(true);
        } else {
          setHasVehicle(false);
        }
      };
      checkVehicles();
    }
  }, [isLoaded, user?.id]);

  useEffect(() => {
    // Obtener la ubicación actual del usuario
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

  const mapCenter = useMemo(() => currentPosition, [currentPosition]);

  return (
    <div className="relative flex-1 w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false} // Deshabilitar el control de zoom por defecto
        className="h-full w-full z-0"
      >
        {/* MapUpdater eliminado, MapContainer gestiona el centro directamente */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={currentPosition}></Marker>
        <ZoomControl position="bottomright" /> {/* Añadir control de zoom en la parte inferior derecha */}
      </MapContainer>

      {/* Botón de Disponibilidad superpuesto */}
      <div className="absolute top-16 mt-4 right-4 z-[1001]">
        <Button
          onClick={handleToggleAvailability}
          className={`font-bold ${isAvailable
            ? "bg-green-600 hover:bg-green-500 text-white"
            : "bg-slate-700 hover:bg-slate-600 text-white"
          }`}
          disabled={!hasVehicle} // Deshabilitar si no hay vehículo registrado
        >
          {isAvailable ? "Disponible" : "No Disponible"}
        </Button>
      </div>
    </div>
  );
}
