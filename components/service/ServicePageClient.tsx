"use client";

import dynamic from "next/dynamic";
import ServiceHeader from "@/components/service/ServiceHeader";
import ServiceRequestCard from "@/components/service/ServiceRequestCard";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs"; // Importar useUser
import { getTowerData, TowerData } from "@/app/actions/tower"; // Importar la acción para obtener datos de la torre y la interfaz TowerData
import { getTowerVehicles } from "@/app/actions/vehicle"; // NUEVO: Importar la acción para obtener vehículos
import PaymentAliasModal from "@/components/payments/PaymentAliasModal"; // Importar el modal de alias
import { useRouter } from "next/navigation"; // Nuevo: Importar useRouter

// Importar InteractiveMap dinámicamente con SSR deshabilitado
const DynamicInteractiveMap = dynamic(() => import("@/components/service/InteractiveMap"), {
  ssr: false,
});

export default function ServicePageClient() {
  const { user, isLoaded } = useUser(); // Obtener el usuario de Clerk
  const router = useRouter(); // Nuevo: Inicializar useRouter
  // 1. al ingresar a la página, el usuario esté en estado no disponible por defecto
  const [isAvailable, setIsAvailable] = useState(false); // El usuario inicia como no disponible
  const [towerData, setTowerData] = useState<TowerData | null>(null); // Estado para los datos de la torre
  const [vehicles, setVehicles] = useState<any[] | null>(null); // NUEVO: Estado para los vehículos del usuario
  const [isLoading, setIsLoading] = useState(true); // Estado unificado para la carga inicial
  const [showPaymentAliasModal, setShowPaymentAliasModal] = useState(false); // Estado para el modal opcional de alias
  const [showRedirectionPopup, setShowRedirectionPopup] = useState(false); // NUEVO: Estado para el popup de redirección
  const [redirectReason, setRedirectReason] = useState(""); // NUEVO: Estado para el mensaje de redirección
  const [recheckTrigger, setRecheckTrigger] = useState(false); // NUEVO: Estado para forzar re-evaluación

  // Efecto para cargar los datos del servicio (torre y vehículos) y determinar la redirección
  useEffect(() => {
    async function loadServicePrerequisites() {
      if (!isLoaded || !user?.id) {
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
          }, 3000); // 3 segundos de delay
        } else {
          setShowPaymentAliasModal(false); // Asegurarse de que el modal opcional esté cerrado si todo está bien
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
  }, [isLoaded, user?.id, router, recheckTrigger]); // Añadir recheckTrigger a las dependencias

  const handleAliasUpdateSuccess = useCallback(() => {
    setShowPaymentAliasModal(false); // Cerrar el modal opcional de alias
    setRecheckTrigger(prev => !prev); // Forzar la re-evaluación de los prerrequisitos del servicio
  }, []);

  const isTripActive = false; // Ya no hay viajes activos simulados

  // NUEVO: Mostrar el popup de redirección si los prerrequisitos no están cumplidos
  if (showRedirectionPopup) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center text-white bg-slate-900/50 text-center p-4">
        <p className="text-xl font-semibold mb-4">{redirectReason}</p>
        <p className="text-slate-400">Serás redirigido automáticamente en breve.</p>
      </div>
    );
  }

  // Mostrar un estado de carga general
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
        isAvailable={isAvailable} // Controlado por el estado local, asumiendo prerrequisitos cumplidos
        setIsAvailable={setIsAvailable}
        isTripActive={isTripActive} // Pasar la prop para deshabilitar el botón
      />
      <div className="flex-1 w-full h-full">
        <DynamicInteractiveMap />
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
