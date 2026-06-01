"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Vehicle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getTowerVehicles } from "@/app/actions/vehicle";
import VehicleForm from './VehicleForm';
import VehicleListItem from './VehicleListItem';

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getTowerVehicles(); // Llamada a la Server Action
    if (result.success && result.data) {
      setVehicles(result.data as Vehicle[]);
    } else {
      setError(result.error || "Error al cargar los vehículos.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleVehicleChange = () => {
    fetchVehicles(); // Recargar la lista después de añadir, editar o eliminar
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900/70 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando vehículos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg text-center bg-red-600/20 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col">
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold"
        >
          Añadir Nuevo Vehículo
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-center text-slate-400 p-4">Aún no tienes vehículos registrados. ¡Añade uno para empezar!</p>
      ) : (
        <ul className="space-y-4">
          {vehicles.map((vehicle) => (
            <VehicleListItem
              key={vehicle.vehicle_id}
              vehicle={vehicle}
              onVehicleUpdated={handleVehicleChange}
              onVehicleDeleted={handleVehicleChange}
            />
          ))}
        </ul>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="w-full max-w-2xl bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
          <VehicleForm
            onClose={() => setShowAddModal(false)}
            onSuccess={handleVehicleChange}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
