"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"; // Importamos auth, currentUser, clerkClient
import { Vehicle } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface UpdateTowerDetailsResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface TowerDetails {
  userProfile: {
    imageUrl: string;
    fullName: string;
    avgRating: number; // Mocked as per existing code
  };
  towerData: {
    clerk_id: string;
    email: string;
    full_name: string;
    payments_alias: string;
  };
}

export async function updateTowerDetails(
  clerkId: string,
  data: { full_name?: string; email?: string; payments_alias?: string }
): Promise<UpdateTowerDetailsResult> {
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

export async function getTowerDetails(): Promise<TowerDetails | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const tower = await prisma.tower.findUnique({
    where: { clerk_id: userId },
  });

  if (!tower) {
    return null;
  }

  const userProfile = {
    imageUrl: clerkUser.imageUrl,
    fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
    avgRating: 4.8, // Mockeado
  };

  const towerData = {
    clerk_id: tower.clerk_id,
    email: tower.email,
    full_name: tower.full_name,
    payments_alias: tower.payments_alias,
  };

  return { userProfile, towerData };
}

export async function deleteTowerAccount(clerkId: string): Promise<UpdateTowerDetailsResult> {
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

export async function getTowerVehicles(): Promise<Vehicle[] | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { tower: { clerk_id: userId } },
    });
    return vehicles;
  } catch (error) {
    console.error("Error al obtener vehículos del Tower:", error);
    return null;
  }
}
