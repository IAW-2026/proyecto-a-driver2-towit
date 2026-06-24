"use server";

import prisma from '@/lib/prisma'; // Asumiendo que el cliente de Prisma se importa desde aquí

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
