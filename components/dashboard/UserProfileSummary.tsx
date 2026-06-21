"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { getTowerVehicles } from "@/app/actions/vehicle";
import { getTowerDetails, TowerData } from "@/app/actions/tower"; // Importamos getTowerDetails y la interfaz TowerData
import { getTowerAvailabilityStatus, toggleTowerAvailability } from "@/app/actions/redis-tower"; // Importar la acción de Redis para disponibilidad y la acción de toggle
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNoVehicleErrorModal } from "@/components/providers/NoVehicleErrorModalProvider";
import PaymentAliasModal from "@/components/payments/PaymentAliasModal"; // Importamos el nuevo modal

interface Vehicle {
  vehicle_id: string;
  createdAt: Date;
  brand: string;
  model: string;
  year: number;
  max_load: number;
}

// Ubicación mockeada para el contexto del dashboard, ya que no se rastrea la ubicación en tiempo real aquí.
// Esta es una solución temporal.
const DASHBOARD_MOCK_LOCATION = { lat: -38.7196, long: -62.2651 }; // Ejemplo: Bahía Blanca

export default function UserProfileSummary() {
  const { user, isLoaded } = useUser();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [towerData, setTowerData] = useState<TowerData | null>(null); // Nuevo estado para towerData
  const [isLoadingTowerData, setIsLoadingTowerData] = useState(true); // Nuevo estado para la carga de towerData
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true); // Estado para la carga de disponibilidad
  const [showPaymentAliasModal, setShowPaymentAliasModal] = useState(false); // Estado para controlar el modal de alias

  const { openNoVehicleErrorModal } = useNoVehicleErrorModal();

  // Referencia para evitar dobles llamadas a Server Actions en desarrollo
  const fetchExecutedRef = useRef<{ userId: string | null; executed: boolean }>({
    userId: null,
    executed: false,
  });

  const fetchAllData = useCallback(async () => {
    if (!isLoaded || !user || !user.id) {
      fetchExecutedRef.current = { userId: null, executed: false };
      return;
    }

    if (
      fetchExecutedRef.current.userId === user.id &&
      fetchExecutedRef.current.executed
    ) {
      return;
    }

    fetchExecutedRef.current = { userId: user.id, executed: true };

    setIsLoadingVehicles(true);
    setIsLoadingTowerData(true);
    setIsLoadingAvailability(true); // Iniciar carga de disponibilidad

    try {
      // Fetch vehicles
      const vehiclesResult = await getTowerVehicles();
      if (vehiclesResult.success && vehiclesResult.data && (vehiclesResult.data as Vehicle[]).length > 0) {
        const fetchedVehicles = vehiclesResult.data as Vehicle[];
        setVehicles(fetchedVehicles);
        setSelectedVehicleId(fetchedVehicles[fetchedVehicles.length - 1].vehicle_id);
      } else {
        setVehicles([]);
        setSelectedVehicleId(null);
      }
    } catch (error) {
      console.error("Excepción al obtener vehículos del Tower:", error);
      setVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }

    try { // Bloque para obtener el estado de disponibilidad
      const availability = await getTowerAvailabilityStatus();
      setIsAvailable(availability);
    } catch (error) {
      console.error("Excepción al obtener el estado de disponibilidad del Tower desde Redis:", error);
      setIsAvailable(false); // Por defecto a no disponible en caso de error
    } finally {
      setIsLoadingAvailability(false); // Finalizar carga de disponibilidad
    }

    try {
      // Fetch tower details
      const details = await getTowerDetails();
      if (details) {
        setTowerData(details.towerData);
      } else {
        setTowerData(null);
      }
    } catch (error) {
      console.error("Excepción al obtener detalles del Tower:", error);
      setTowerData(null);
    } finally {
      setIsLoadingTowerData(false);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleToggleAvailability = useCallback(async () => { // Hacemos la función asíncrona
    if (!vehicles || vehicles.length === 0) {
      openNoVehicleErrorModal();
      return;
    }

    const newAvailabilityState = !isAvailable;
    const success = await toggleTowerAvailability(
      newAvailabilityState,
      newAvailabilityState ? DASHBOARD_MOCK_LOCATION : null,
      newAvailabilityState && currentVehicle ? { // Solo pasar los detalles del vehículo si se está volviendo disponible y hay un vehículo actual
        brand: currentVehicle.brand,
        model: currentVehicle.model,
        year: currentVehicle.year,
        max_load: currentVehicle.max_load,
      } : null
    );

    if (success) {
      setIsAvailable(newAvailabilityState); // Actualizar el estado local solo si la actualización de Redis fue exitosa
      console.log(`Disponibilidad de Tower actualizada en Redis para el usuario ${user?.id} a ${newAvailabilityState}`);
    } else {
      console.error("Hubo un error al actualizar la disponibilidad en Redis.");
      // Aquí podrías añadir una notificación al usuario si se considera necesario,
      // pero por ahora solo se registrará el error.
    }
  }, [isAvailable, vehicles, user?.id, openNoVehicleErrorModal]); // Añadir dependencias

  const handleOpenPaymentAliasModal = () => setShowPaymentAliasModal(true);
  const handleClosePaymentAliasModal = () => setShowPaymentAliasModal(false);
  const handlePaymentAliasUpdated = () => {
    // Re-fetch tower details to get the updated alias
    // Reset fetchExecutedRef to force re-fetch
    fetchExecutedRef.current = { userId: null, executed: false };
    fetchAllData();
  };

  if (!isLoaded || isLoadingVehicles || isLoadingTowerData || isLoadingAvailability) { // Incluir isLoadingAvailability
    return (
      <div className="flex justify-center items-center h-48 bg-slate-900/70 p-6 rounded-lg shadow-lg     
border border-slate-800">
        <p className="text-slate-400">Cargando perfil, vehículos, detalles y disponibilidad...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Si no hay datos de Tower o el alias de pagos no está configurado, mostrar el botón.
  const hasPaymentAlias = !!towerData?.payments_alias;

  const avgRating = 4.8;
  const currentVehicle = vehicles?.find(v => v.vehicle_id === selectedVehicleId) || null;

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col       
h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full flex-1">
        <div className="flex flex-col items-start justify-between">
          <div className="flex items-center space-x-4 w-full border-b border-slate-800 pb-4 mb-4">
            <Image
              src={user.imageUrl}
              alt={user.fullName || "User Avatar"}
              width={60}
              height={60}
              className="rounded-full border-2 border-yellow-500 object-cover"
              loading="eager"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white leading-tight">
                {user.fullName}
              </h2>
              <div className="flex items-center">
                <p className="text-sm text-yellow-400">
                  Calificación: {avgRating}
                </p>
              </div>
              {/* Botón para abrir el modal de alias de pago */}
              {hasPaymentAlias && (
                <Button
                  onClick={handleOpenPaymentAliasModal}
                  variant="link" // Estilo de enlace
                  className="p-0 h-auto text-blue-300 hover:text-blue-400 hover:no-underline cursor-pointer text-xs"
                >
                  Cambiar Alias de pago
                </Button>
              )}
            </div>
          </div>
          {hasPaymentAlias ? (
            <div className="flex gap-4 w-full mt-auto">
              <Button
                onClick={handleToggleAvailability}
                className={`flex-1 font-bold ${isAvailable
                    ? "bg-green-600 hover:bg-green-500 text-white cursor-pointer"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                disabled={!selectedVehicleId} // Deshabilitar si no hay vehículo seleccionado
              >
                {isAvailable ? "Disponible" : "No Disponible"}
              </Button>
              <Link
                href="/service"
                className={`flex-1 ${!isAvailable ? 'pointer-events-none opacity-50 cursor-pointer' : ''}`}
                tabIndex={!isAvailable ? -1 : undefined}
                aria-disabled={!isAvailable}
              >
                <Button
                  className="w-full font-bold bg-yellow-600 hover:bg-yellow-500 text-slate-950"
                  disabled={!isAvailable} // El botón "Empezar" se deshabilita si no está disponible
                >
                  Empezar
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex w-full mt-auto">
              <Button
                onClick={handleOpenPaymentAliasModal}
                className="w-full font-bold bg-yellow-600 hover:bg-yellow-500 text-slate-950 cursor-pointer"
              >
                Establecer alias para comenzar
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col w-full h-full">
          <h3 className="text-md font-bold text-white mb-2">Vehículo Actual</h3>
          {vehicles && vehicles.length > 0 ? (
            <div className="flex flex-col space-y-2 flex-1">
              <Select
                value={selectedVehicleId || ''}
                onValueChange={(value) => setSelectedVehicleId(value)}
              >
                <SelectTrigger className="w-full bg-slate-900/70 border-slate-700 text-white">
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 border-slate-700 text-white">
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.max_load + "kg"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/vehicles" className="mt-auto w-full">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold cursor-pointer">
                  Añadir Vehículos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-800/50 rounded-lg flex-1 flex flex-col              
justify-center items-center">
              <p className="text-slate-400 text-sm mb-3">No tienes vehículos registrados.</p>
              <Link href="/vehicles" className="w-full">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold cursor-pointer">
                  Añadir Vehículo
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <PaymentAliasModal
        isOpen={showPaymentAliasModal}
        onClose={handleClosePaymentAliasModal}
        currentAlias={towerData?.payments_alias || null}
        onSuccess={handlePaymentAliasUpdated}
      />
    </div>
  );
}
