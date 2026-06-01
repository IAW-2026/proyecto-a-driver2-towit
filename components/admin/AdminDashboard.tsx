"use client";

import React, { useEffect, useState } from 'react';
import {
  getAllTowers,
  getAllVehicles,
  getAllAssignments,
  getAllAdmins,
} from '@/app/actions/admin';
import UserCreationForm from './UserCreationForm';
import DataTable from './DataTable';
import { Tower, Vehicle, Admin, Assignment } from '@prisma/client';

interface AdminDashboardData {
  towers: Tower[];
  vehicles: Vehicle[];
  assignments: Assignment[]; // Replace 'any' with Assignment[] once model is defined
  admins: Admin[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEditTower = (id: string) => { console.log(`Editando Tower con ID: ${id}`); /* Lógica para abrir modal de edición de Tower */ };
  const handleDeleteTower = (id: string) => { console.log(`Eliminando Tower con ID: ${id}`); /* Lógica para abrir modal de confirmación de eliminación de Tower */ };

  const handleEditVehicle = (id: string) => { console.log(`Editando Vehículo con ID: ${id}`); /* Lógica para abrir modal de edición de Vehicle */ };
  const handleDeleteVehicle = (id: string) => { console.log(`Eliminando Vehículo con ID: ${id}`); /* Lógica para abrir modal de confirmación de eliminación de Vehicle */ };

  const handleEditAdmin = (id: string) => { console.log(`Editando Admin con ID: ${id}`); /* Lógica para abrir modal de edición de Admin */ };
  const handleDeleteAdmin = (id: string) => { console.log(`Eliminando Admin con ID: ${id}`); /* Lógica para abrir modal de confirmación de eliminación de Admin */ };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [towersRes, vehiclesRes, assignmentsRes, adminsRes] = await Promise.all([
          getAllTowers(),
          getAllVehicles(),
          getAllAssignments(),
          getAllAdmins(),
        ]);

        if (!towersRes.success || !vehiclesRes.success || !assignmentsRes.success || !adminsRes.success) {
          setError(
            towersRes.error ||
            vehiclesRes.error ||
            assignmentsRes.error ||
            adminsRes.error ||
            "Error desconocido al cargar los datos del panel de administración."
          );
          setData(null);
          return;
        }

        setData({
          towers: towersRes.data as Tower[],
          vehicles: vehiclesRes.data as Vehicle[],
          assignments: assignmentsRes.data as any[],
          admins: adminsRes.data as Admin[],
        });
      } catch (err: any) {
        console.error("Excepción al cargar datos del panel de administración:", err);
        setError(err.message || "Error al cargar los datos del panel de administración.");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando datos del administrador...</p>
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

  if (!data) {
    return (
      <div className="p-4 rounded-lg text-center bg-red-600/20 text-red-400">
        <p>No se pudieron cargar los datos del panel de administración.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <UserCreationForm />

      <h2 className="text-2xl font-bold text-white pt-4">Datos de la Base de Datos</h2>

      <DataTable
        title="Administradores"
        data={data.admins}
        emptyMessage="No hay administradores registrados."
        idFieldName="admin_id"
        onEdit={handleEditAdmin}
        onDelete={handleDeleteAdmin}
      />
      <DataTable
        title="Towers"
        data={data.towers}
        emptyMessage="No hay towers registrados."
        idFieldName="tower_id"
        onEdit={handleEditTower}
        onDelete={handleDeleteTower}
      />
      <DataTable
        title="Vehículos"
        data={data.vehicles}
        emptyMessage="No hay vehículos registrados."
        idFieldName="vehicle_id"
        onEdit={handleEditVehicle}
        onDelete={handleDeleteVehicle}
      />
      {/* Añadir DataTable para Assignments cuando el modelo esté implementado */}
      {data.assignments.length === 0 && (
        <p className="text-slate-400 text-center">Nota: El modelo de Assignments aún no está implementado en la base de datos.</p>
      )}
    </div>
  );
}
