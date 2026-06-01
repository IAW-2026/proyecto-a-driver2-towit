"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { updateAdmin } from "@/app/actions/admin";
import { Admin } from "@prisma/client";

interface AdminEditFormProps {
  admin: Admin;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminEditForm({ admin, onClose, onSuccess }: AdminEditFormProps) {
  const [formData, setFormData] = useState({
    full_name: admin.full_name || '',
    email: admin.email || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const changed =
      formData.full_name !== admin.full_name ||
      formData.email !== admin.email;
    setIsDirty(changed);
  }, [formData, admin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("El nombre completo y el email son obligatorios.");
      return false;
    }
    // Simple email regex validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Por favor, introduce un email válido.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    const result = await updateAdmin(admin.admin_id, formData);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Ocurrió un error al actualizar el administrador.");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-white">
          Editar Administrador
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-1">Nombre Completo</label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-center bg-red-600/20 text-red-400">
          {error}
        </div>
      )}

      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end items-center gap-2 pt-4 border-t bg-transparent border-slate-800 mt-8">
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
      </DialogFooter>
    </form>
  );
}
