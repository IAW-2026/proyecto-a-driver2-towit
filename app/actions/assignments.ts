"use server";

import prisma from '@/lib/prisma';
import { Assignment } from '@prisma/client'; // Importar el tipo Assignment de Prisma

interface RecordAcceptedAssignmentData {
  tripId: string;
  towerId: string;
  location: { lat: string; long: string }; // Coordenadas del origen del viaje
}

interface RecordAcceptedAssignmentResponse {
  success: boolean;
  error?: string;
  assignmentId?: string; // Opcional, si quieres devolver el ID del registro creado
}

/**
 * Registra un viaje aceptado como una nueva asignación en la base de datos.
 * El estado inicial de la asignación será 'accepted'.
 * @param data Los datos del viaje y la torre para registrar la asignación.
 * @returns Una promesa que resuelve con un objeto indicando el éxito o un error.
 */
export async function recordAcceptedAssignment(
  data: RecordAcceptedAssignmentData
): Promise<RecordAcceptedAssignmentResponse> {
  try {
    const newAssignment = await prisma.assignment.create({
      data: {
        trip_id: data.tripId,
        tower_id: data.towerId,
        status: 'accepted', // El estado inicial cuando se acepta un viaje
        location: data.location, // La ubicación del origen del viaje
      },
    });
    return { success: true, assignmentId: newAssignment.assignment_id };
  } catch (error: any) {
    console.error("Error al registrar la asignación aceptada en la DB:", error);
    // Verificar si es un error de unicidad (trip_id ya existe)
    if (error.code === 'P2002' && error.meta?.target?.includes('trip_id')) {
        return { success: false, error: "Ya existe una asignación para este viaje." };
    }
    return { success: false, error: "Fallo al guardar el registro de la asignación." };
  }
}

interface CompleteAssignmentData {
  tripId: string;
  finalLocation: { lat: string; long: string };
}

interface CompleteAssignmentResponse {
  success: boolean;
  error?: string;
  assignmentId?: string;
}

interface AssignmentsActionResponse {
  success: boolean;
  data?: Assignment[];
  error?: string;
}

/**
 * Obtiene todas las asignaciones que no están desactivadas.
 * @returns Una promesa que resuelve con un objeto de respuesta que contiene la lista de asignaciones o un error.
 */
export async function getNonDeactivatedAssignments(): Promise<AssignmentsActionResponse> {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        deactivated: false,
      },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: assignments };
  } catch (error: any) {
    console.error("Error al obtener asignaciones no desactivadas:", error);
    return { success: false, error: "Fallo al obtener la lista de asignaciones no desactivadas." };
  }
}

/**
 * Actualiza una asignación existente a estado 'completed' y guarda la ubicación final.
 * @param data Los datos del viaje y la ubicación final para completar la asignación.
 * @returns Una promesa que resuelve con un objeto indicando el éxito o un error.
 */
export async function completeAssignment(
  data: CompleteAssignmentData
): Promise<CompleteAssignmentResponse> {
  try {
    const updatedAssignment = await prisma.assignment.update({
      where: { trip_id: data.tripId },
      data: {
        status: 'completed',
        location: data.finalLocation, // Actualizar la ubicación a la final
        updatedAt: new Date(), // Actualizar la marca de tiempo de modificación
      },
    });
    return { success: true, assignmentId: updatedAssignment.assignment_id };
  } catch (error: any) {
    console.error("Error al completar la asignación en la DB:", error);
    if (error.code === 'P2025') { // Código de error de Prisma para 'record not found'
        return { success: false, error: "Asignación no encontrada para actualizar." };
    }
    return { success: false, error: "Fallo al completar la asignación." };
  }
}
