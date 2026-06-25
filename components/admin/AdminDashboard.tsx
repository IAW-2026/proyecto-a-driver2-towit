"use client";

import React, { useEffect, useState } from 'react';
import {
  getAllTowers,
  getAllVehicles,
  getAllAssignments,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  toggleAdminDeactivated,
  // Importar la nueva interfaz PaginatedAdminActionResponse
  type PaginatedAdminActionResponse,
} from '@/app/actions/admin';
import { updateTowerDetails, deleteTowerAccount, toggleTowerDeactivated } from '@/app/actions/tower';
import { updateVehicle, deleteVehicle, toggleVehicleDeactivated } from '@/app/actions/vehicle';
import UserCreationForm from './UserCreationForm';
import DataTable from './DataTable';
import AdminEditForm from './AdminEditForm';
import TowerEditForm from './TowerEditForm';
import VehicleForm from '../vehicles/VehicleForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tower, Vehicle, Admin, Assignment } from '@prisma/client';

// Tipos para el estado de edición, eliminación y activación/desactivación
type EditingEntity = { type: 'admin'; data: Admin } | { type: 'tower'; data: Tower } | { type: 'vehicle'; data: Vehicle } | null;
type DeletingEntity = { type: 'admin'; id: string; clerkId?: string; name: string } | { type: 'tower'; id: string; clerkId: string; name: string } | { type: 'vehicle'; id: string; name: string } | null;
type ToggleDeactivatedEntity = { type: 'admin'; id: string; clerkId?: string; name: string; currentStatus: boolean } | { type: 'tower'; id: string; clerkId: string; name: string; currentStatus: boolean } | { type: 'vehicle'; id: string; name: string; currentStatus: boolean } | null;

interface AdminDashboardData {
  towers: Tower[];
  vehicles: Vehicle[];
  assignments: Assignment[];
  admins: Admin[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntity, setEditingEntity] = useState<EditingEntity>(null);
  const [deletingEntity, setDeletingEntity] = useState<DeletingEntity>(null);
  const [togglingDeactivatedEntity, setTogglingDeactivatedEntity] = useState<ToggleDeactivatedEntity>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Estados de paginación para cada tabla
  const [adminsPage, setAdminsPage] = useState(1);
  const [adminsTotalPages, setAdminsTotalPages] = useState(1);
  const [towersPage, setTowersPage] = useState(1);
  const [towersTotalPages, setTowersTotalPages] = useState(1);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [vehiclesTotalPages, setVehiclesTotalPages] = useState(1);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsTotalPages, setAssignmentsTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 5; // Definir el límite de elementos por página

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Llamar a las acciones de servidor con los parámetros de paginación
      const [towersRes, vehiclesRes, assignmentsRes, adminsRes] = await Promise.all([
        getAllTowers(towersPage, ITEMS_PER_PAGE),
        getAllVehicles(vehiclesPage, ITEMS_PER_PAGE),
        getAllAssignments(assignmentsPage, ITEMS_PER_PAGE),
        getAllAdmins(adminsPage, ITEMS_PER_PAGE),
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
        assignments: assignmentsRes.data as Assignment[],
        admins: adminsRes.data as Admin[],
      });

      // Actualizar estados de paginación
      setAdminsTotalPages(adminsRes.totalPages || 1);
      setAdminsPage(adminsRes.currentPage || 1);
      setTowersTotalPages(towersRes.totalPages || 1);
      setTowersPage(towersRes.currentPage || 1);
      setVehiclesTotalPages(vehiclesRes.totalPages || 1);
      setVehiclesPage(vehiclesRes.currentPage || 1);
      setAssignmentsTotalPages(assignmentsRes.totalPages || 1);
      setAssignmentsPage(assignmentsRes.currentPage || 1);

    } catch (err: any) {
      console.error("Excepción al cargar datos del panel de administración:", err);
      setError(err.message || "Error al cargar los datos del panel de administración.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cuando el componente monta o las páginas cambian, se vuelve a buscar la data
    fetchData();
  }, [adminsPage, towersPage, vehiclesPage, assignmentsPage]);

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

  const handleToggleDeactivatedAdmin = (id: string, currentStatus: boolean) => {
    const adminToToggle = data?.admins.find((a) => a.admin_id === id);
    if (adminToToggle) {
      setTogglingDeactivatedEntity({ type: 'admin', id: adminToToggle.admin_id, clerkId: adminToToggle.clerk_id, name: adminToToggle.full_name, currentStatus });
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

  const handleToggleDeactivatedTower = (id: string, currentStatus: boolean) => {
    const towerToToggle = data?.towers.find((t) => t.tower_id === id);
    if (towerToToggle) {
      setTogglingDeactivatedEntity({ type: 'tower', id: towerToToggle.tower_id, clerkId: towerToToggle.clerk_id, name: towerToToggle.full_name, currentStatus });
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

  const handleToggleDeactivatedVehicle = (id: string, currentStatus: boolean) => {
    const vehicleToToggle = data?.vehicles.find((v) => v.vehicle_id === id);
    if (vehicleToToggle) {
      setTogglingDeactivatedEntity({ type: 'vehicle', id: vehicleToToggle.vehicle_id, name: `${vehicleToToggle.brand} ${vehicleToToggle.model}`, currentStatus });
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

  const closeToggleDeactivatedConfirmationModal = () => {
    setTogglingDeactivatedEntity(null);
    setActionError(null);
  };

  const handleActionSuccess = () => {
    closeEditModal();
    closeDeleteConfirmationModal();
    closeToggleDeactivatedConfirmationModal(); // Cerrar modal de toggle
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

  const handleConfirmToggleDeactivated = async () => {
    if (!togglingDeactivatedEntity) return;

    setActionError(null);
    setIsLoading(true);

    let result;
    const newStatus = !togglingDeactivatedEntity.currentStatus; // Invertir el estado actual

    if (togglingDeactivatedEntity.type === 'admin') {
      result = await toggleAdminDeactivated(togglingDeactivatedEntity.id, newStatus);
    } else if (togglingDeactivatedEntity.type === 'tower') {
      result = await toggleTowerDeactivated(togglingDeactivatedEntity.clerkId as string, newStatus);
    } else if (togglingDeactivatedEntity.type === 'vehicle') {
      result = await toggleVehicleDeactivated(togglingDeactivatedEntity.id, newStatus);
    } else {
      result = { success: false, error: "Tipo de entidad a activar/desactivar desconocido." };
    }

    if (result.success) {
      handleActionSuccess();
    } else {
      setActionError(result.error || `Error al ${newStatus ? 'desactivar' : 'activar'} ${togglingDeactivatedEntity.name}.`);
      setIsLoading(false);
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
        onToggleDeactivated={handleToggleDeactivatedAdmin}
        currentPage={adminsPage}
        totalPages={adminsTotalPages}
        onPageChange={setAdminsPage}
      />
      <DataTable
        title="Towers"
        data={data?.towers || []}
        emptyMessage="No hay towers registrados."
        idFieldName="tower_id"
        onEdit={handleEditTower}
        onDelete={handleDeleteTower}
        onToggleDeactivated={handleToggleDeactivatedTower}
        currentPage={towersPage}
        totalPages={towersTotalPages}
        onPageChange={setTowersPage}
      />
      <DataTable
        title="Vehículos"
        data={data?.vehicles || []}
        emptyMessage="No hay vehículos registrados."
        idFieldName="vehicle_id"
        onEdit={handleEditVehicle}
        onDelete={handleDeleteVehicle}
        onToggleDeactivated={handleToggleDeactivatedVehicle}
        currentPage={vehiclesPage}
        totalPages={vehiclesTotalPages}
        onPageChange={setVehiclesPage}
      />
      <DataTable<Assignment & { deactivated?: boolean }>
        title="Asignaciones"
        data={data?.assignments || []}
        emptyMessage="No hay asignaciones para mostrar."
        idFieldName="assignment_id"
        // Las asignaciones no tienen edición, eliminación o toggle de desactivación en este contexto.
        // Se pueden añadir más tarde si el modelo de Assignment en Prisma lo soporta.
        currentPage={assignmentsPage}
        totalPages={assignmentsTotalPages}
        onPageChange={setAssignmentsPage}
      />

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

      {/* Modal de Confirmación de Activación/Desactivación */}
      <Dialog open={!!togglingDeactivatedEntity} onOpenChange={closeToggleDeactivatedConfirmationModal}>
        <DialogContent className="max-w-md bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {togglingDeactivatedEntity?.currentStatus ? "Confirmar Activación" : "Confirmar Desactivación"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Estás a punto de {togglingDeactivatedEntity?.currentStatus ? "activar" : "desactivar"} a "{togglingDeactivatedEntity?.name}".
              {togglingDeactivatedEntity?.type === 'tower' && (
                <span className="block mt-2 font-semibold text-red-400">
                  Esto también cambiará el rol del usuario en Clerk.
                </span>
              )}
              {togglingDeactivatedEntity?.type === 'admin' && (
                <span className="block mt-2 font-semibold text-red-400">
                  Esto también cambiará el rol del administrador en Clerk.
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
              onClick={closeToggleDeactivatedConfirmationModal}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={togglingDeactivatedEntity?.currentStatus ? "default" : "destructive"}
              onClick={handleConfirmToggleDeactivated}
              disabled={isLoading}
              className={togglingDeactivatedEntity?.currentStatus ? "bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold" : ""}
            >
              {isLoading ? "Procesando..." : (togglingDeactivatedEntity?.currentStatus ? "Confirmar Activación" : "Confirmar Desactivación")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
