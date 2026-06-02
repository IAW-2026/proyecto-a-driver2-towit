"use client";

import React, { useState } from 'react';
import { Vehicle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Importar componentes de Dialog adicionales
import { deleteVehicle } from "@/app/actions/vehicle"; // Importar la acción de eliminar
import VehicleForm from './VehicleForm';

interface VehicleListItemProps {
  vehicle: Vehicle;
  onVehicleUpdated: () => void;
  onVehicleDeleted: () => void;
}

export default function VehicleListItem({ vehicle, onVehicleUpdated, onVehicleDeleted }: VehicleListItemProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Nuevo estado para el modal de confirmación
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para controlar la carga de eliminar
  const [error, setError] = useState<string | null>(null); // Para errores de eliminación

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleDeleteClick = () => { // Nuevo handler para abrir el modal de confirmación
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => { // Nuevo handler para confirmar la eliminación
    if (!vehicle?.vehicle_id) return;

    setIsLoading(true);
    setError(null);
    setShowDeleteConfirmation(false); // Cerrar el modal de confirmación inmediatamente

    const result = await deleteVehicle(vehicle.vehicle_id);

    if (result.success) {
      onVehicleDeleted(); // Notificar al padre que un vehículo fue eliminado
    } else {
      setError(result.error || "Ocurrió un error al eliminar el vehículo.");
      // Opcional: reabrir el modal de confirmación con el error, o mostrarlo como un toast/alerta en la lista.
    }
    setIsLoading(false);
  };

  return (
    <li className="flex flex-wrap items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <div className="md:flex-1 min-w-0 w-full md:w-auto">
        <p className="text-white text-lg font-semibold truncate">{vehicle.brand} {vehicle.model}</p>
        <p className="text-slate-400 text-sm">{vehicle.year} - {vehicle.max_load} kg Max.</p>
      </div>
      <div className="flex gap-2 ml-4 justify-end w-full md:w-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleEditClick}
          disabled={isLoading} // Deshabilitar si se está eliminando
        >
          Editar
        </Button>
        <Button // Nuevo botón para eliminar
          variant="destructive"
          size="sm"
          onClick={handleDeleteClick}
          disabled={isLoading} // Deshabilitar si se está eliminando
        >
          Eliminar
        </Button>
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="w-9/10 sm:w-4/5 md:w-full md:max-w-lg bg-slate-900/70 md:p-8 rounded-lg shadow-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
          <VehicleForm
            vehicle={vehicle}
            onClose={handleCloseEditModal}
            onSuccess={() => {
              onVehicleUpdated(); // Notificar al padre que un vehículo fue actualizado
              handleCloseEditModal();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="w-9/10 sm:w-4/5 md:max-w-md bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 p-2 pt-4 bg-transparent">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Confirmar Eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {error && ( // Mostrar error si hay alguno
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-lg text-center bg-red-600/20 text-red-400 z-50 animate-in fade-in-0 slide-in-from-bottom-2">
            {error}
          </div>
      )}
    </li>
  );
}
