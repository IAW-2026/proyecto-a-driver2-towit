"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Reutilizamos el componente Input
import { createUser } from "@/app/actions/admin";

export default function UserCreationForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    role: 'tower' as 'tower' | 'admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatusMessage(null); // Clear status message on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const result = await createUser(formData);

    if (result.success) {
      setStatusMessage({ type: 'success', message: `Usuario ${formData.firstName} creado exitosamente con rol ${formData.role}.` });
      setFormData({ // Clear form
        firstName: '',
        lastName: '',
        emailAddress: '',
        role: 'tower',
      });
    } else {
      setStatusMessage({ type: 'error', message: result.error || 'Error al crear el usuario.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-4">Crear Nuevo Usuario</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex xl:flex-row xl:items-end gap-4 justify-end flex-wrap xl:flex-nowrap">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <div>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Nombre"
              />
            </div>
            <div>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Apellido"
              />
            </div>
            <div>
              <Input
                id="emailAddress"
                name="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Email"
              />
            </div>
            <div>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-3.5 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isLoading}
              >
                <option value="" disabled hidden>Rol</option>
                <option value="tower">Tower</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <Button
            type="submit"
            className="md:w-auto w-full xl:w-auto bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold p-3.5 h-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Creando...' : 'Crear'}
          </Button>
        </div> {/* Cierre del div de flex para inputs y botón */}

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-center ${
              statusMessage.type === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
            }`}
          >
            {statusMessage.message}
          </div>
        )}
      </form>
    </div>
  );
}
