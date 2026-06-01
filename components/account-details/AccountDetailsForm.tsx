"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation'; // Importar useRouter
import { useClerk } from "@clerk/nextjs"; // Importar useClerk
import { updateTowerDetails, getTowerDetails, deleteTowerAccount } from "@/app/actions/tower"; // Importar deleteTowerAccount
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

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
  initialUserProfile?: UserProfileProps;
  initialTowerData?: TowerDataProps;
  onClose?: () => void;
}

export default function AccountDetailsForm({ initialUserProfile, initialTowerData, onClose }: AccountDetailsFormProps) {
  const [userProfile, setUserProfile] = useState<UserProfileProps | null>(initialUserProfile || null);
  const [towerData, setTowerData] = useState<TowerDataProps | null>(initialTowerData || null);
  const [formData, setFormData] = useState<TowerDataProps | null>(initialTowerData || null);
  const [isLoading, setIsLoading] = useState(!initialTowerData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // Estado para el popup de confirmación

  const router = useRouter(); // Inicializar useRouter
  const { signOut, user } = useClerk(); // Obtener la función signOut y el user de Clerk

  const handleSignOut = async () => {
    if (onClose) {
      onClose(); // Cerrar el modal principal antes de redirigir
    }
    await signOut({ redirectUrl: '/home' }); // Redirigir a /home después de cerrar sesión
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !user.id) {
      setStatusMessage({ type: 'error', message: 'No se pudo identificar al usuario para eliminar.' });
      setShowDeleteConfirmation(false);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setShowDeleteConfirmation(false); // Cerrar el popup de confirmación inmediatamente

    const result = await deleteTowerAccount(user.id);

    if (result.success) {
      if (onClose) {
        onClose(); // Cerrar el modal principal
      }
      // Clerk debería manejar la redirección y el estado de sesión automáticamente después de la eliminación del usuario.
      // Aquí, podríamos redirigir explícitamente a /home si la eliminación en Clerk tarda un poco en propagarse o si signOut no es llamado implícitamente por deleteUser.
      // Para mayor seguridad, forzamos la redirección aquí.
      router.push('/home');
    } else {
      setStatusMessage({ type: 'error', message: result.error || 'Error al eliminar la cuenta.' });
      setIsSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getTowerDetails();
    if (result) {
      setUserProfile(result.userProfile);
      setTowerData(result.towerData);
      setFormData(result.towerData);
    } else {
      setError("No se pudieron cargar los detalles de la cuenta. Asegúrate de estar logueado.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!initialTowerData) {
      fetchData();
    }
  }, [initialTowerData, fetchData]);

  useEffect(() => {
    if (formData && towerData) {
      const changed = Object.keys(formData).some(
        (key) => formData[key as keyof TowerDataProps] !== towerData[key as keyof TowerDataProps]
      );
      setIsDirty(changed);
    } else {
      setIsDirty(false);
    }
  }, [formData, towerData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    setStatusMessage(null);
  };

  const handleCancel = () => {
    if (towerData) {
      setFormData(towerData);
      setIsDirty(false);
      setStatusMessage(null);
    }
    onClose?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !towerData) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await updateTowerDetails(towerData.clerk_id, formData);

    if (result.success) {
      setStatusMessage({ type: 'success', message: '¡Detalles actualizados exitosamente!' });
      setTowerData(prev => (prev ? { ...prev, ...result.data } : null));
      setFormData(prev => (prev ? { ...prev, ...result.data } : null));
      setIsDirty(false);
    } else {
      setStatusMessage({ type: 'error', message: result.error || 'Error al actualizar detalles.' });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-slate-400">Cargando detalles de la cuenta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-600/20 text-red-400 rounded-lg">
        <p>{error}</p>
        <Button onClick={onClose} className="mt-4">Cerrar</Button>
      </div>
    );
  }

  if (!userProfile || !formData) {
    return (
      <div className="text-center p-4 bg-red-600/20 text-red-400 rounded-lg">
        <p>No se pudo obtener la información completa de la cuenta.</p>
        <Button onClick={onClose} className="mt-4">Cerrar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-4 mb-6 border-b border-slate-800 pb-6">
        <div className="mr-auto text-left">
          <h3 className="text-2xl font-bold text-white leading-tight">
            {userProfile.fullName}
          </h3>
          <p className="text-base text-yellow-400 mt-0 mb-1">
            Calificación: {userProfile.avgRating}
          </p>
          <div className="flex flex-col gap-1 mt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-red-400 hover:text-red-500 self-start"
            >
              Cerrar Sesión
            </button>
          </div>
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
            value={formData.full_name || ''}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
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
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
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
            value={formData.payments_alias || ''}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
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

      <div className="flex flex-col-reverse md:flex-row md:justify-end gap-4 pt-4 border-t border-slate-800 mt-8">
        <Button
          type="button"
          onClick={handleDeleteAccountClick}
          className="w-full md:w-auto text-xs bg-red-500 text-white hover:bg-red-600 self-start md:mr-auto order-last md:order-first"
        >
          Eliminar Cuenta
        </Button>
        <Button
          type="button"
          onClick={handleCancel}
          disabled={!isDirty || isSubmitting}
          className="w-full md:w-auto px-6 py-3 rounded-lg text-white bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="w-full md:w-auto px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="max-w-md bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Confirmar Eliminación de Cuenta</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y se perderán todos tus datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-4 bg-slate/70">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-900 rounded-md transition-colors"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white font-bold rounded-md transition-colors"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Eliminando...' : 'Confirmar Eliminación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
