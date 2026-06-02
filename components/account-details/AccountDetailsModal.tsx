"use client";

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs'; // Importar useAuth y useUser
import AccountDetailsForm from './AccountDetailsForm';
import AdminDetailsForm from './AdminDetailsForm'; // Importar el nuevo formulario para administradores
import { Button } from "@/components/ui/button";
import { useAccountDetailsModal } from "@/components/providers/AccountDetailsModalProvider";

export default function AccountDetailsModal() {
  const { showModal, closeModal } = useAccountDetailsModal();
  const { isLoaded, isSignedIn, user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setIsAdmin(user.publicMetadata?.role === 'admin');
    } else if (isLoaded && !isSignedIn) {
      setIsAdmin(false); // Asegúrate de resetear si el usuario no está logueado
    }
  }, [isLoaded, isSignedIn, user]);

  if (!showModal) {
    return null;
  }

  // Muestra un estado de carga mientras se determina el rol del usuario
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="relative w-full max-w-2xl bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={closeModal}
            className="absolute top-2 right-2 text-slate-400 hover:text-white"
          >
            &times;
          </Button>
          <div className="flex justify-center items-center h-48">
            <p className="text-slate-400">Cargando perfil de usuario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={closeModal}
          className="absolute top-2 right-2 text-slate-400 hover:text-white"
        >
          &times;
        </Button>
        {isAdmin ? (
          <AdminDetailsForm onClose={closeModal} />
        ) : (
          <AccountDetailsForm onClose={closeModal} />
        )}
      </div>
    </div>
  );
}
