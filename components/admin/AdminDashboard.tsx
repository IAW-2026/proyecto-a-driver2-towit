"use client";

import React, { useEffect, useState } from 'react';
import {
  getAllTowers,
  getAllVehicles,
  getAllAssignments,
  getAllAdmins,
  updateAdmin, // Importar la nueva acción de actualización de Admin
  deleteAdmin, // Importar la nueva acción de eliminación de Admin
} from '@/app/actions/admin';
import { updateTowerDetails, deleteTowerAccount } from '@/app/actions/tower'; // Importar acciones de Tower
import { updateVehicle, deleteVehicle } from '@/app/actions/vehicle'; // Importar acciones de Vehicle
import UserCreationForm from './UserCreationForm';
import DataTable from './DataTable';
import AdminEditForm from './AdminEditForm'; // Nuevo componente
import TowerEditForm from './TowerEditForm'; // Nuevo componente
import VehicleForm from '../vehicles/VehicleForm'; // Reutilizar el formulario de vehículos
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tower, Vehicle, Admin, Assignment } from '@prisma/client';

// Tipos para el estado de edición y eliminación
type EditingEntity = { type: 'admin'; data: Admin } | { type: 'tower'; data: Tower } | { type: 'vehicle'; data: Vehicle } | null;
type DeletingEntity = { type: 'admin'; id: string; clerkId?: string; name: string } | { type: 'tower'; id: string; clerkId: string; name: string } | { type: 'vehicle'; id: string; name: string } | null;

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
  const [editingEntity, setEditingEntity] = useState<EditingEntity>(null);
  const [deletingEntity, setDeletingEntity] = useState<DeletingEntity>(null);
  const [actionError, setActionError] = useState<string | null>(null); // Para errores de acciones CRUD

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  const handleEditAdmin = (id: string) => {
    const adminToEdit = data?.admins.find((a) => a.admin_id === id);
    if (adminToEdit) {
      setEditingEntity({ type: 'admin', data: adminToEdit });
    }
  };

  const handleDeleteAdmin = (id: string) => {
    const adminToDelete = data?.admins.find((a) => a.admin_id === id);
    if (adminToDelete) {
      setDeletingEntity({ type: 'admin', id: adminToDelete.admin_id, clerkId: adminToDelete.clerk_id, name: adminToDelete.full_name });
    }
  };

  const handleEditTower = (id: string) => {
    const towerToEdit = data?.towers.find((t) => t.tower_id === id);
    if (towerToEdit) {
      setEditingEntity({ type: 'tower', data: towerToEdit });
    }
  };

  const handleDeleteTower = (id: string) => {
    const towerToDelete = data?.towers.find((t) => t.tower_id === id);
    if (towerToDelete) {
      setDeletingEntity({ type: 'tower', id: towerToDelete.tower_id, clerkId: towerToDelete.clerk_id, name: towerToDelete.full_name });
    }
  };

  const handleEditVehicle = (id: string) => {
    const vehicleToEdit = data?.vehicles.find((v) => v.vehicle_id === id);
    if (vehicleToEdit) {
      setEditingEntity({ type: 'vehicle', data: vehicleToEdit });
    }
  };

  const handleDeleteVehicle = (id: string) => {
    const vehicleToDelete = data?.vehicles.find((v) => v.vehicle_id === id);
    if (vehicleToDelete) {
      setDeletingEntity({ type: 'vehicle', id: vehicleToDelete.vehicle_id, name: `${vehicleToDelete.brand} ${vehicleToDelete.model}` });
    }
  };

  const closeEditModal = () => {
    setEditingEntity(null);
    setActionError(null);
  };

  const closeDeleteConfirmationModal = () => {
    setDeletingEntity(null);
    setActionError(null);
  };

  const handleActionSuccess = () => {
    closeEditModal();
    closeDeleteConfirmationModal();
    fetchData(); // Recargar datos después de una operación exitosa
  };

  const handleConfirmDelete = async () => {
    if (!deletingEntity) return;

    setActionError(null);
    setIsLoading(true); // Mostrar loading mientras se procesa la eliminación

    let result;
    if (deletingEntity.type === 'admin') {
      result = await deleteAdmin(deletingEntity.id);
    } else if (deletingEntity.type === 'tower') {
      // deleteTowerAccount espera clerkId, no el id de prisma
      result = await deleteTowerAccount(deletingEntity.clerkId as string);
    } else if (deletingEntity.type === 'vehicle') {
      result = await deleteVehicle(deletingEntity.id);
    } else {
      result = { success: false, error: "Tipo de entidad a eliminar desconocido." };
    }

    if (result.success) {
      handleActionSuccess();
    } else {
      setActionError(result.error || `Error al eliminar ${deletingEntity.name}.`);
      setIsLoading(false); // Ocultar loading si hay un error
    }
  };


  if (isLoading && !data) { // Solo mostrar cargando si no hay datos iniciales
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

  if (!data && !isLoading) { // Si no hay datos después de cargar y no estamos cargando
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
        data={data?.admins || []}
        emptyMessage="No hay administradores registrados."
        idFieldName="admin_id"
        onEdit={handleEditAdmin}
        onDelete={handleDeleteAdmin}
      />
      <DataTable
        title="Towers"
        data={data?.towers || []}
        emptyMessage="No hay towers registrados."
        idFieldName="tower_id"
        onEdit={handleEditTower}
        onDelete={handleDeleteTower}
      />
      <DataTable
        title="Vehículos"
        data={data?.vehicles || []}
        emptyMessage="No hay vehículos registrados."
        idFieldName="vehicle_id"
        onEdit={handleEditVehicle}
        onDelete={handleDeleteVehicle}
      />
      {/* Añadir DataTable para Assignments cuando el modelo esté implementado */}
      {data?.assignments.length === 0 && (
        <p className="text-slate-400 text-center">Nota: El modelo de Assignments aún no está implementado en la base de datos.</p>
      )}

      {/* Modales de Edición */}
      <Dialog open={!!editingEntity} onOpenChange={closeEditModal}>
        <DialogContent className="max-w-md bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
          {editingEntity?.type === 'admin' && editingEntity.data && (
            <AdminEditForm admin={editingEntity.data} onClose={closeEditModal} onSuccess={handleActionSuccess} />
          )}
          {editingEntity?.type === 'tower' && editingEntity.data && (
            <TowerEditForm tower={editingEntity.data} onClose={closeEditModal} onSuccess={handleActionSuccess} />
          )}
          {editingEntity?.type === 'vehicle' && editingEntity.data && (
            <VehicleForm vehicle={editingEntity.data} onClose={closeEditModal} onSuccess={handleActionSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={!!deletingEntity} onOpenChange={closeDeleteConfirmationModal}>
        <DialogContent className="max-w-md bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta acción es irreversible.
              {deletingEntity?.type === 'tower' && (
                <span className="block mt-2 font-semibold text-red-400">
                  Esto eliminará al usuario también de Clerk y todos sus vehículos asociados.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <div className="p-3 rounded-lg text-center bg-red-600/20 text-red-400 mt-4">
              {actionError}
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 bg-transparent">
            <Button
              type="button"
              variant="ghost"
              onClick={closeDeleteConfirmationModal}
              disabled={isLoading}
            >
              Cancelar
            </Button>
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
    </div>
  );
}
