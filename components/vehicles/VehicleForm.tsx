"use client";

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { addVehicle, updateVehicle } from "@/app/actions/vehicle"; // Ya no se importa deleteVehicle
import { Vehicle } from "@prisma/client";

interface VehicleFormProps {
  vehicle?: Vehicle | null; // Si se proporciona, es para edición; de lo contrario, para añadir
  onClose: () => void;
  onSuccess: () => void;
}

export default function VehicleForm({ vehicle, onClose, onSuccess }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || 2020,
    max_load: vehicle?.max_load || 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  // Eliminada: const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    if (vehicle) {
      const changed =
        formData.brand !== vehicle.brand ||
        formData.model !== vehicle.model ||
        formData.year !== vehicle.year ||
        formData.max_load !== vehicle.max_load;
      setIsDirty(changed);
    } else {
      // Para un formulario nuevo, se considera "sucio" si algún campo no está en su estado inicial
      const anyFieldChanged =
        formData.brand !== '' ||
        formData.model !== '' ||
        formData.year !== 2020 ||
        formData.max_load !== 0;
      setIsDirty(anyFieldChanged);
    }
  }, [formData, vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'max_load' ? Number(value) : value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.brand.trim() || !formData.model.trim()) {
      setError("La marca y el modelo son obligatorios.");
      return false;
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      setError("El año debe ser un valor razonable.");
      return false;
    }
    if (formData.max_load <= 0) {
      setError("La carga máxima debe ser mayor a 0.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    let result;
    if (vehicle) {
      result = await updateVehicle(vehicle.vehicle_id, formData);
    } else {
      result = await addVehicle(formData);
    }

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Ocurrió un error al guardar el vehículo.");
    }
    setIsLoading(false);
  };

  // Eliminada: const handleDelete = async () => {...};

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {vehicle ? "Editar Vehículo" : "Añadir Nuevo Vehículo"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {vehicle ? "Modifica los detalles de tu vehículo." : "Introduce los detalles de tu nuevo vehículo de remolque."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-slate-300 mb-1">Marca</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-slate-300 mb-1">Modelo</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-slate-300 mb-1">Año</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="max_load" className="block text-sm font-medium text-slate-300 mb-1">Carga Máxima (kg)</label>
            <input
              type="number"
              id="max_load"
              name="max_load"
              value={formData.max_load}
              onChange={handleChange}
              className="w-full p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              required
              min="0"
              step="0.1"
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-center bg-red-600/20 text-red-400">
            {error}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-4 border-t border-slate-800 mt-8">
          {/* Eliminado: Botón de eliminar */}
          <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isLoading}
              className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold"
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogFooter>
      </form>

      {/* Eliminada: Confirmación de eliminación */}
    </>
  );
}
