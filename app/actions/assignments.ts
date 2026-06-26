"use server";

import prisma from '@/lib/prisma';
import { Assignment } from '@prisma/client';
import { auth } from "@clerk/nextjs/server"; // Importar auth para obtener el userId del servidor
import { getTowerIdByClerkId } from "./tower"; // Importar función para obtener towerId

interface RecordAcceptedAssignmentData {
  tripId: string;
  towerId: string;
  location: { lat: string; long: string }; // Coordenadas del origen del viaje
  origin: string;
  destination: string;
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
    console.warn(data.tripId)
    const newAssignment = await prisma.assignment.create({
      data: {
        trip_id: String(data.tripId),
        tower_id: data.towerId,
        status: 'accepted', // El estado inicial cuando se acepta un viaje
        location: data.location, // La ubicación del origen del viaje
        origin: data.origin,
        destination: data.destination
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

interface MonthlyAssignmentCountsResponse {
  success: boolean;
  currentMonthCount?: number;
  previousMonthCount?: number;
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
 * Obtiene el número de asignaciones del mes actual y del mes anterior para la torre del usuario autenticado.
 * Solo cuenta asignaciones que no estén desactivadas.
 * @returns Un objeto con el éxito, los conteos de asignaciones o un error.
 */
export async function getMonthlyAssignmentCounts(): Promise<MonthlyAssignmentCountsResponse> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Usuario no autenticado." };
  }

  const towerData = await getTowerIdByClerkId(userId);
  if (!towerData?.towerId) {
    return { success: false, error: "Tower no encontrada para el usuario." };
  }

  const towerId = towerData.towerId;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Rango para el mes actual
  const startCurrentMonth = new Date(currentYear, currentMonth, 1);
  const endCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999); // Último milisegundo del mes actual

  // Rango para el mes anterior
  const startPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
  const endPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999); // Último milisegundo del mes anterior

  try {
    const currentMonthCount = await prisma.assignment.count({
      where: {
        tower_id: towerId,
        deactivated: false,
        createdAt: {
          gte: startCurrentMonth,
          lte: endCurrentMonth,
        },
      },
    });

    const previousMonthCount = await prisma.assignment.count({
      where: {
        tower_id: towerId,
        deactivated: false,
        createdAt: {
          gte: startPreviousMonth,
          lte: endPreviousMonth,
        },
      },
    });

    return { success: true, currentMonthCount, previousMonthCount };
  } catch (error: any) {
    console.error("Error al obtener conteos de asignaciones mensuales:", error);
    return { success: false, error: "Fallo al obtener los conteos de asignaciones." };
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
    console.warn(data.tripId)
    const updatedAssignment = await prisma.assignment.update({
      where: { trip_id: String(data.tripId) },
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
