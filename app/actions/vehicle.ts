"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Vehicle } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface VehicleActionResponse {
  success: boolean;
  data?: Vehicle | Vehicle[] | null;
  error?: string;
}

/**
 * Obtiene todos los vehículos asociados al Tower autenticado.
 * @returns Una promesa que resuelve con un objeto de respuesta que contiene la lista de vehículos o un error.
 */
export async function getTowerVehicles(): Promise<VehicleActionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "No autorizado. Inicie sesión para ver sus vehículos." };
  }

  try {
    const tower = await prisma.tower.findUnique({
      where: { clerk_id: userId },
      select: { tower_id: true },
    });

    if (!tower) {
      return { success: false, error: "No se encontró el perfil de Tower." };
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { tower_id: tower.tower_id },
      orderBy: { createdAt: 'asc' }, // Ordenar por fecha de creación
    });
    return { success: true, data: vehicles };
  } catch (error: any) {
    console.error("Error al obtener vehículos del Tower:", error);
    return { success: false, error: "Error al obtener los vehículos." };
  }
}

/**
 * Obtiene un vehículo específico por su ID.
 * @param vehicleId El ID del vehículo.
 * @returns Una promesa que resuelve con un objeto de respuesta que contiene el vehículo o un error.
 */
export async function getVehicleById(vehicleId: string): Promise<VehicleActionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const tower = await prisma.tower.findUnique({
      where: { clerk_id: userId },
      select: { tower_id: true },
    });

    if (!tower) {
      return { success: false, error: "No se encontró el perfil de Tower." };
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: {
        vehicle_id: vehicleId,
        tower_id: tower.tower_id, // Asegurarse de que el vehículo pertenece al Tower actual
      },
    });

    if (!vehicle) {
      return { success: false, error: "Vehículo no encontrado o no pertenece al usuario actual." };
    }

    return { success: true, data: vehicle };
  } catch (error: any) {
    console.error(`Error al obtener el vehículo ${vehicleId}:`, error);
    return { success: false, error: "Error al obtener el vehículo." };
  }
}

/**
 * Añade un nuevo vehículo al Tower autenticado.
 * @param data Los datos del vehículo (marca, modelo, año, carga máxima).
 * @returns Una promesa que resuelve con un objeto de respuesta que contiene el nuevo vehículo o un error.
 */
export async function addVehicle(data: { brand: string; model: string; year: number; max_load: number }): Promise<VehicleActionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "No autorizado. Inicie sesión para añadir un vehículo." };
  }

  try {
    const tower = await prisma.tower.findUnique({
      where: { clerk_id: userId },
      select: { tower_id: true },
    });

    if (!tower) {
      return { success: false, error: "No se encontró el perfil de Tower." };
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        ...data,
        tower_id: tower.tower_id,
      },
    });
    revalidatePath("/vehicles");
    return { success: true, data: newVehicle };
  } catch (error: any) {
    console.error("Error al añadir vehículo:", error);
    return { success: false, error: error.message || "Error al añadir el vehículo." };
  }
}

/**
 * Actualiza los detalles de un vehículo existente.
 * @param vehicleId El ID del vehículo a actualizar.
 * @param data Los datos a actualizar (marca, modelo, año, carga máxima).
 * @returns Una promesa que resuelve con un objeto de respuesta que contiene el vehículo actualizado o un error.
 */
export async function updateVehicle(
  vehicleId: string,
  data: { brand?: string; model?: string; year?: number; max_load?: number }
): Promise<VehicleActionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "No autorizado. Inicie sesión para actualizar un vehículo." };
  }

  try {
    const tower = await prisma.tower.findUnique({
      where: { clerk_id: userId },
      select: { tower_id: true },
    });

    if (!tower) {
      return { success: false, error: "No se encontró el perfil de Tower." };
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: {
        vehicle_id: vehicleId,
        tower_id: tower.tower_id, // Asegurarse de que el vehículo pertenece al Tower actual
      },
      data,
    });
    revalidatePath("/vehicles");
    return { success: true, data: updatedVehicle };
  } catch (error: any) {
    console.error(`Error al actualizar el vehículo ${vehicleId}:`, error);
    return { success: false, error: error.message || "Error al actualizar el vehículo." };
  }
}

/**
 * Elimina un vehículo existente.
 * @param vehicleId El ID del vehículo a eliminar.
 * @returns Una promesa que resuelve con un objeto de respuesta indicando éxito o un error.
 */
export async function deleteVehicle(vehicleId: string): Promise<VehicleActionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "No autorizado. Inicie sesión para eliminar un vehículo." };
  }

  try {
    const tower = await prisma.tower.findUnique({
      where: { clerk_id: userId },
      select: { tower_id: true },
    });

    if (!tower) {
      return { success: false, error: "No se encontró el perfil de Tower." };
    }

    await prisma.vehicle.delete({
      where: {
        vehicle_id: vehicleId,
        tower_id: tower.tower_id, // Asegurarse de que el vehículo pertenece al Tower actual
      },
    });
    revalidatePath("/vehicles");
    return { success: true };
  } catch (error: any) {
    console.error(`Error al eliminar el vehículo ${vehicleId}:`, error);
    return { success: false, error: error.message || "Error al eliminar el vehículo." };
  }
}
