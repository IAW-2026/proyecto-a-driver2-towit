"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"; // Importamos auth, currentUser, clerkClient
import { revalidatePath } from "next/cache";

// Definición de la interfaz para los datos de la torre (extraído para reuso)
export interface TowerData {
  clerk_id: string;
  email: string;
  full_name: string;
  payments_alias: string | null; // Permitir que sea null
}

// Hacer la interfaz de resultado de actualización genérica
export interface UpdateTowerDetailsResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Actualizar TowerDetails para usar la nueva TowerData
interface TowerDetails {
  userProfile: {
    imageUrl: string;
    fullName: string;
    avgRating: number; // Mocked as per existing code
  };
  towerData: TowerData; // Usar la interfaz TowerData definida
}

export async function updateTowerDetails(
  clerkId: string,
  data: { full_name?: string; email?: string; payments_alias?: string | null }
): Promise<UpdateTowerDetailsResult<TowerData>> {
  try {
    // 1. Actualizar en la base de datos de Neon (vía Prisma)
    const updatedTower = await prisma.tower.update({
      where: { clerk_id: clerkId },
      data: {
        full_name: data.full_name,
        email: data.email,
        payments_alias: data.payments_alias,
      },
    });

    // 2. Actualizar en la base de datos de Clerk
    const clerkUpdateParams: {
      firstName?: string;
      lastName?: string;
      emailAddress?: string;
    } = {};

    if (data.full_name !== undefined) {
      const nameParts = data.full_name.split(' ');
      clerkUpdateParams.firstName = nameParts[0] || '';
      clerkUpdateParams.lastName = nameParts.slice(1).join(' ') || '';
    }

    if (data.email !== undefined) {
      clerkUpdateParams.emailAddress = data.email;
    }

    if (Object.keys(clerkUpdateParams).length > 0) {
      try {
        const client = await clerkClient();
        await client.users.updateUser(clerkId, clerkUpdateParams);
        console.log(`Clerk user ${clerkId} actualizado con`, clerkUpdateParams);
      } catch (clerkError: any) {
        console.error(`Error al actualizar usuario de Clerk ${clerkId}:`, clerkError);
        return { success: false, error: `Failed to update Clerk user: ${clerkError.message}` };
      }
    }

    revalidatePath("/account-details"); // Revalida la ruta para mostrar los datos actualizados
    return { success: true, data: updatedTower };
  } catch (error: any) {
    console.error("Error al actualizar detalles de Tower:", error);
    return { success: false, error: error.message || "Failed to update Tower details" };
  }
}

export async function getTowerDetails(): Promise<TowerDetails | null> { // Mantener tipo de retorno para compatibilidad con UserProfileSummary
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const tower = await prisma.tower.findUnique({
    where: { clerk_id: userId},
  });

  if (!tower) {
    return null;
  }

  const userProfile = {
    imageUrl: clerkUser.imageUrl,
    fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
    avgRating: 4.8, // Mockeado
  };

  const towerData: TowerData = { // Asegurar que sea de tipo TowerData
    clerk_id: tower.clerk_id,
    email: tower.email,
    full_name: tower.full_name,
    payments_alias: tower.payments_alias, // Permitir que sea null
  };

  return { userProfile, towerData };
}

// Nueva función para obtener solo los datos de la torre
export async function getTowerData(userId: string): Promise<UpdateTowerDetailsResult<TowerData>> {
  if (!userId) {
    return { success: false, error: "User ID is required." };
  }

  try {
    const tower = await prisma.tower.findUnique({
      where: { clerk_id: userId},
      select: { // Seleccionar solo los campos necesarios para TowerData
        clerk_id: true,
        email: true,
        full_name: true,
        payments_alias: true,
      }
    });

    if (!tower) {
      return { success: false, error: "Tower data not found for this user." };
    }

    return { success: true, data: tower };
  } catch (error: any) {
    console.error("Error al obtener datos de Tower:", error);
    return { success: false, error: error.message || "Failed to get Tower data" };
  }
}

/**
 * Obtiene el tower_id de la base de datos a partir de un clerk_id.
 * @param clerkId El Clerk ID del usuario Tower.
 * @returns Una promesa que resuelve con un objeto indicando el éxito, el tower_id o un error.
 */
export async function getTowerIdByClerkId(clerkId: string): Promise<{ success: boolean; towerId?: string; error?: string }> {
  if (!clerkId) {
    return { success: false, error: "Clerk ID es requerido." };
  }

  try {
    const tower = await prisma.tower.findUnique({
      where: { clerk_id: clerkId }, // Solo torres no desactivadas
      select: {
        tower_id: true,
      },
    });

    if (!tower) {
      return { success: false, error: "Tower no encontrado para el Clerk ID proporcionado." };
    }

    return { success: true, towerId: tower.tower_id };
  } catch (error: any) {
    console.error(`Error al obtener tower_id para Clerk ID ${clerkId}:`, error);
    return { success: false, error: error.message || "Fallo al obtener el tower_id." };
  }
}


export async function updatePaymentAlias(
  clerkId: string,
  paymentsAlias: string
): Promise<UpdateTowerDetailsResult<TowerData>> { // Ajustar tipo de retorno
  try {
    const updatedTower = await prisma.tower.update({
      where: { clerk_id: clerkId },
      data: {
        payments_alias: paymentsAlias,
      },
    });

    revalidatePath("/dashboard"); // Revalida la ruta para mostrar los datos actualizados
    return { success: true, data: updatedTower };
  } catch (error: any) {
    console.error(`Error al actualizar el alias de pago para ${clerkId}:`, error);
    return { success: false, error: error.message || "Failed to update payment alias" };
  }
}

export async function deleteTowerAccount(clerkId: string): Promise<UpdateTowerDetailsResult<void>> { // Ajustar tipo de retorno
  try {
    // 1. Eliminar de la base de datos de Neon (vía Prisma)
    await prisma.tower.delete({
      where: { clerk_id: clerkId },
    });
    console.log(`Tower ${clerkId} deleted from Neon database.`);

    // 2. Eliminar de Clerk
    const client = await clerkClient();
    await client.users.deleteUser(clerkId);
    console.log(`Clerk user ${clerkId} deleted.`);

    revalidatePath("/home"); // Revalida la ruta /home
    return { success: true };
  } catch (error: any) {
    console.error(`Error al eliminar la cuenta de Tower ${clerkId}:`, error);
    return { success: false, error: error.message || "Failed to delete Tower account" };
  }
}

export async function toggleTowerDeactivated(
  clerkId: string,
  deactivated: boolean
): Promise<UpdateTowerDetailsResult<TowerData>> {
  try {
    const updatedTower = await prisma.tower.update({
      where: { clerk_id: clerkId },
      data: { deactivated: deactivated },
    });

    // Actualizar también el rol en Clerk publicMetadata
    // Si se desactiva, cambiar el rol a 'deactivated_tower'
    // Si se activa, cambiar el rol de nuevo a 'tower'
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: deactivated ? 'deactivated_tower' : 'tower',
      },
    });
    console.log(`Clerk user ${clerkId} role updated to '${deactivated ? 'deactivated_tower' : 'tower'}'.`);

    revalidatePath("/account-details");
    revalidatePath("/admin"); // Revalidar la vista de admin
    return { success: true, data: updatedTower };
  } catch (error: any) {
    console.error(`Error al ${deactivated ? 'desactivar' : 'activar'} Tower ${clerkId}:`, error);
    return { success: false, error: error.message || `Error al ${deactivated ? 'desactivar' : 'activar'} el Tower.` };
  }
}

// Se ha movido getTowerVehicles a app/actions/vehicle.ts para centralizar la lógica de vehículos.
// Este archivo ya no necesita esa función.
