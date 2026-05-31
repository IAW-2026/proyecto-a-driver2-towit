"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { updateTowerDetails } from "@/app/actions/tower";
import { Button } from "@/components/ui/button"; // Asumiendo que usas shadcn/ui

interface UserProfileProps {
  imageUrl: string;
  fullName: string;
  avgRating: number;
}

interface TowerDataProps {
  clerk_id: string;
  email: string;
  full_name: string;
  payments_alias: string;
}

interface AccountDetailsFormProps {
  userProfile: UserProfileProps;
  towerData: TowerDataProps;
}

export default function AccountDetailsForm({ userProfile, towerData }: AccountDetailsFormProps) {
  const [formData, setFormData] = useState(towerData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Verificar si hay cambios comparando con los datos iniciales
    const changed = Object.keys(formData).some(
      (key) => formData[key as keyof TowerDataProps] !== towerData[key as keyof TowerDataProps]
    );
    setIsDirty(changed);
  }, [formData, towerData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatusMessage(null); // Limpiar mensaje de estado al editar
  };

  const handleCancel = () => {
    setFormData(towerData); // Restablecer al estado inicial
    setIsDirty(false);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await updateTowerDetails(towerData.clerk_id, formData);

    if (result.success) {
      setStatusMessage({ type: 'success', message: '¡Detalles actualizados exitosamente!' });
      // towerData no se actualiza automáticamente con la revalidación en el cliente,
      // pero podemos forzar la actualización del estado inicial para que isDirty se recalcule correctamente
      // En un caso real, podrías querer refetchear los props o redirigir
      // Para este ejemplo, solo reiniciamos la suciedad del formulario.
      setFormData(prev => ({...prev, ...result.data})); // Actualiza formData con los nuevos datos si la respuesta los incluye
      setIsDirty(false); 
    } else {
      setStatusMessage({ type: 'error', message: result.error || 'Error al actualizar detalles.' });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-4 mb-6 border-b border-slate-800 pb-6">
        <div className="mr-auto text-left">
          <h3 className="text-2xl font-bold text-white leading-tight">
            {userProfile.fullName}
          </h3>
          <p className="text-base text-yellow-400 mt-1">
            Calificación: {userProfile.avgRating}
          </p>
        </div>
        <Image
          src={userProfile.imageUrl}
          alt={userProfile.fullName}
          width={64}
          height={64}
          className="rounded-full border-2 border-yellow-500 object-cover"
          loading="eager"
        />
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-1">
            Nombre Completo
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="payments_alias" className="block text-sm font-medium text-slate-300 mb-1">
            Alias de pagos
          </label>
          <input
            type="text"
            id="payments_alias"
            name="payments_alias"
            value={formData.payments_alias}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-center ${
            statusMessage.type === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
          }`}
        >
          {statusMessage.message}
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t border-slate-800 mt-8">
        <Button
          type="button"
          onClick={handleCancel}
          disabled={!isDirty || isSubmitting}
          className="px-6 py-3 rounded-lg text-white bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
