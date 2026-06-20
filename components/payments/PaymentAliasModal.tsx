"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePaymentAlias } from "@/app/actions/tower"; // Importa la nueva acción
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation"; // Nuevo: Importar useRouter

interface PaymentAliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAlias: string | null;
  onSuccess: () => void; // Para recargar los datos en el componente padre
  isClosable?: boolean; // Nueva prop, por defecto true
  isServiceContext?: boolean; // Nuevo: Prop para el contexto de /service
}

export default function PaymentAliasModal({
  isOpen,
  onClose,
  currentAlias,
  onSuccess,
  isClosable = true, // Establece el valor por defecto a true
  isServiceContext = false, // Nuevo: Establece el valor por defecto a false
}: PaymentAliasModalProps) {
  const { user } = useUser();
  const router = useRouter(); // Nuevo: Inicializar useRouter
  const [alias, setAlias] = useState(currentAlias || "");
  const [isPending, startTransition] = useTransition(); // Hook para transiciones

  useEffect(() => {
    setAlias(currentAlias || "");
  }, [currentAlias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      console.error("Error: No se pudo obtener el ID de usuario.");
      // No toast, solo log de error y el modal permanecerá abierto.
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePaymentAlias(user.id, alias);
        if (result.success) {
          onSuccess(); // Notificar al padre que el alias fue actualizado
          onClose(); // Cerrar el modal al éxito
        } else {
          console.error("Fallo al actualizar el alias de pago:", result.error);
          // El modal permanece abierto en caso de error, el usuario puede intentar de nuevo.
        }
      } catch (error) {
        console.error("Ocurrió un error inesperado al actualizar el alias:", error);
        // El modal permanece abierto en caso de excepción, el usuario puede intentar de nuevo.
      }
    });
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => isClosable && onClose()}>
      <DialogContent
        className={`sm:max-w-[425px] bg-slate-950/90 border-slate-700 text-white backdrop-blur-sm ${!isClosable ? '[&>button]:hidden' : ''}`} // Nuevo: Ocultar el botón de cerrar si no es cerrable
        // Evita que el modal se cierre al pulsar Escape si no es cerrable
        onEscapeKeyDown={(e) => !isClosable && e.preventDefault()}
        // Evita que el modal se cierre al hacer clic fuera si no es cerrable
        onPointerDownOutside={(e) => !isClosable && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Establecer Alias de Pago</DialogTitle>
          <DialogDescription className="text-slate-400">
            Ingresa el alias de la cuenta en la que se acreditarán los pagos una vez finalizados los viajes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-2">
          <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
            <label htmlFor="alias" className="text-right text-slate-200">
              Alias
            </label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="col-span-3 border-slate-600 text-white"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            {isServiceContext && !isClosable ? ( // Nuevo: Botón "Volver a dashboard" para contexto de servicio no cerrable
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToDashboard}
                disabled={isPending}
                className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
              >
                Volver a dashboard
              </Button>
            ) : (
              isClosable && ( // Botón "Cancelar" original, solo si es cerrable
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                >
                  Cancelar
                </Button>
              )
            )}
            <Button
              type="submit"
              disabled={isPending || !alias.trim()}
              className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold"
            >
              {isPending ? "Guardando..." : "Guardar Alias"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
