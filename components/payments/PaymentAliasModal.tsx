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

interface PaymentAliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAlias: string | null;
  onSuccess: () => void; // Para recargar los datos en el componente padre
}

export default function PaymentAliasModal({
  isOpen,
  onClose,
  currentAlias,
  onSuccess,
}: PaymentAliasModalProps) {
  const { user } = useUser();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Establecer Alias de Pago</DialogTitle>
          <DialogDescription className="text-slate-400">
            Ingresa un alias único para tus pagos. Este alias será visible para los clientes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="alias" className="text-right text-slate-200">
              Alias
            </label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="col-span-3 bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
            >
              Cancelar
            </Button>
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
