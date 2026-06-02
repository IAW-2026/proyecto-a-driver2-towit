"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useNoVehicleErrorModal } from "@/components/providers/NoVehicleErrorModalProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function NoVehicleErrorModal() {
  const { showNoVehicleErrorModal, closeNoVehicleErrorModal } = useNoVehicleErrorModal();

  return (
    <Dialog open={showNoVehicleErrorModal} onOpenChange={closeNoVehicleErrorModal}>
      <DialogContent className="w-full max-w-2xl bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Error de Disponibilidad</DialogTitle>
          <DialogDescription className="text-slate-400">
            Debes registrar al menos un vehículo para poder cambiar tu estado de disponibilidad y comenzar a recibir pedidos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" onClick={closeNoVehicleErrorModal} className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
              Entendido
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
