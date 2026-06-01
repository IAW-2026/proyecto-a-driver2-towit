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
    password: '', // Nuevo campo para la contraseña
    role: 'tower' as 'tower' | 'admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatusMessage(null); // Limpiar mensaje de estado al cambiar input
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.emailAddress.trim() || !formData.password.trim() || !formData.role.trim()) {
      setStatusMessage({ type: 'error', message: "Todos los campos son obligatorios." });
      return false;
    }
    if (formData.password.length < 8) {
      setStatusMessage({ type: 'error', message: "La contraseña debe tener al menos 8 caracteres." });
      return false;
    }
    // if (!/[A-Z]/.test(formData.password)) {
    //   setStatusMessage({ type: 'error', message: "La contraseña debe contener al menos una letra mayúscula." });
    //   return false;
    // }
    // if (!/[a-z]/.test(formData.password)) {
    //   setStatusMessage({ type: 'error', message: "La contraseña debe contener al menos una letra minúscula." });
    //   return false;
    // }
    // if (!/[0-9]/.test(formData.password)) {
    //   setStatusMessage({ type: 'error', message: "La contraseña debe contener al menos un número." });
    //   return false;
    // }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setStatusMessage({ type: 'error', message: "La contraseña debe contener al menos un caracter especial (!@#$%^&*)." });
      return false;
    }
    // Simple email regex validation
    if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      setStatusMessage({ type: 'error', message: "Por favor, introduce un email válido." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setStatusMessage(null);

    const result = await createUser(formData);

    if (result.success) {
      setStatusMessage({ type: 'success', message: `Usuario ${formData.firstName} creado exitosamente con rol ${formData.role}.` });
      setFormData({ // Limpiar formulario
        firstName: '',
        lastName: '',
        emailAddress: '',
        password: '', // También limpiar la contraseña
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6 lg:grid-cols-5">
          <div className='md:col-span-2 lg:col-span-1'>
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
          <div className='md:col-span-2 lg:col-span-1'>
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
          <div className='md:col-span-2 lg:col-span-1'>
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
          <div className='md:col-span-3 lg:col-span-1'>
            <Input
              id="password"
              name="password"
              type="password" // Tipo password para ocultar la entrada
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Contraseña"
            />
          </div>
          <div className='md:col-span-3 lg:col-span-1'>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3.5 bg-slate-800/70 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isLoading}
            >
              <option value="tower">Tower</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="submit"
            className="w-full md:w-auto bg-green-600/70 hover:bg-green-500 text-green-950 font-bold p-3.5 h-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Creando...' : 'Crear'}
          </Button>
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
      </form>
    </div>
  );
}
