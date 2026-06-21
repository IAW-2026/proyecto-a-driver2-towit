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
  const [redirectReason, setRedirectReason] = useState(""); // NUEVO: Estado para el mensaje de redirección
  const [recheckTrigger, setRecheckTrigger] = useState(false); // NUEVO: Estado para forzar re-evaluación
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null); // Estado para la ubicación actual
  const [watchId, setWatchId] = useState<number | null>(null); // NEW: Para el ID de watchPosition

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
        // Cargar datos de la torre
        const towerResult = await getTowerData(user.id);
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

        // Cargar vehículos
        const vehiclesResult = await getTowerVehicles();
        if (vehiclesResult.success && vehiclesResult.data && (vehiclesResult.data as any[]).length > 0) {
          setVehicles(vehiclesResult.data as any[]);
        } else {
          // Si no hay vehículos, añadir la razón a la redirección
          if (!needsRedirect) { // Si aún no se requiere redirección por alias
            needsRedirect = true;
            reason = "No se definió un vehículo a usar";
          } else { // Si ya se requiere redirección por alias, combinamos las razones
            reason += " ni vehículo a usar";
          }
        }

        if (needsRedirect) {
          setRedirectReason(reason + ", redirigiendo a dashboard...");
          setShowRedirectionPopup(true);
          setTimeout(() => {
            router.push("/dashboard");
          }, 5000); // 3 segundos de delay
        } else {
          setShowRedirectionPopup(false); // Asegurarse de que el popup de redirección no se muestre
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

  const isTripActive = false; // Hardcoded a false como se indicó.

  // Mostrar un estado de carga general. No se espera por currentLocation para permitir que el mapa se inicie.
  if (!isLoaded || isLoading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center text-white">
        Cargando servicio...
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <ServiceHeader
        isAvailable={isAvailable}
        setIsAvailable={handleToggleAvailability} // Pasar la función de manejo del toggle
        isTripActive={isTripActive} // Pasar la prop para deshabilitar el botón
      />
      <div className="flex-1 w-full h-full">
        {currentLocation && ( // Renderizar el mapa solo si tenemos una ubicación inicial
          <DynamicInteractiveMap />
        )}
      </div>

      {/* NUEVO: Popup de redirección flotante sobre el mapa */}
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
