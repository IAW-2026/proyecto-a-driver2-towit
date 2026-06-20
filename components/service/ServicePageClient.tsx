"use client";

import dynamic from "next/dynamic";
import ServiceHeader from "@/components/service/ServiceHeader";
import ServiceRequestCard from "@/components/service/ServiceRequestCard";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs"; // Importar useUser
import { getTowerData, TowerData } from "@/app/actions/tower"; // Importar la acción para obtener datos de la torre y la interfaz TowerData
import PaymentAliasModal from "@/components/payments/PaymentAliasModal"; // Importar el modal de alias
import { useRouter } from "next/navigation"; // Nuevo: Importar useRouter

// Importar InteractiveMap dinámicamente con SSR deshabilitado
const DynamicInteractiveMap = dynamic(() => import("@/components/service/InteractiveMap"), {
  ssr: false,
});

export default function ServicePageClient() {
  const { user, isLoaded } = useUser(); // Obtener el usuario de Clerk
  const router = useRouter(); // Nuevo: Inicializar useRouter
  // 1. al ingresar a la página, el usuario esté en estado disponible
  const [isAvailable, setIsAvailable] = useState(true); // El usuario debe iniciar como disponible
  const [towerData, setTowerData] = useState<TowerData | null>(null); // Estado para los datos de la torre
  const [isLoadingTowerData, setIsLoadingTowerData] = useState(true); // Estado para la carga de datos de la torre
  const [showPaymentAliasModal, setShowPaymentAliasModal] = useState(false); // Estado para el modal

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

  const isTripActive = false; // Ya no hay viajes activos simulados

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
