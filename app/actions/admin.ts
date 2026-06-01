"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface AdminActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Verifica si el usuario autenticado tiene el rol de administrador.
 * @returns true si es administrador, false en caso contrario.
 */
async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  return (user.publicMetadata?.role === 'admin');
}

/**
 * Obtiene todos los registros de la tabla Tower.
 * Requiere rol de administrador.
 */
export async function getAllTowers(): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  try {
    const towers = await prisma.tower.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: towers };
  } catch (error: any) {
    console.error("Error al obtener Towers:", error);
    return { success: false, error: "Error al obtener la lista de Towers." };
  }
}

/**
 * Obtiene todos los registros de la tabla Vehicle.
 * Requiere rol de administrador.
 */
export async function getAllVehicles(): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: vehicles };
  } catch (error: any) {
    console.error("Error al obtener Vehicles:", error);
    return { success: false, error: "Error al obtener la lista de Vehículos." };
  }
}

/**
 * Obtiene todos los registros de la tabla Assignment. (Aún no implementada en el esquema, pero se incluye para completitud)
 * Requiere rol de administrador.
 */
export async function getAllAssignments(): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  // No hay un modelo Assignment en prisma/schema.prisma aún, se devuelve un mock.
  // Una vez que se agregue, se debería reemplazar con:
  // const assignments = await prisma.assignment.findMany();
  // return { success: true, data: assignments };
  console.warn("getAllAssignments llamada pero el modelo Assignment no está en Prisma. Devolviendo datos mock.");
  return { success: true, data: [] }; // Mock vacío
}

/**
 * Obtiene todos los registros de la tabla Admin.
 * Requiere rol de administrador.
 */
export async function getAllAdmins(): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: admins };
  } catch (error: any) {
    console.error("Error al obtener Admins:", error);
    return { success: false, error: "Error al obtener la lista de Administradores." };
  }
}

/**
 * Crea un nuevo usuario (Tower o Admin) en Clerk y en la base de datos de Prisma.
 * Requiere rol de administrador.
 */
export async function createUser(formData: {
  firstName: string;
  lastName: string;
  emailAddress: string;
  role: 'tower' | 'admin';
}): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden crear usuarios." };
  }

  const { firstName, lastName, emailAddress, role } = formData;

  try {
    // 1. Crear usuario en Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [emailAddress],
      publicMetadata: {
        role: role,
      },
    });

    // 2. Crear registro en la base de datos de Prisma según el rol
    const fullName = `${firstName} ${lastName}`.trim();

    if (role === 'admin') {
      await prisma.admin.create({
        data: {
          clerk_id: clerkUser.id,
          email: emailAddress,
          full_name: fullName,
        },
      });
      revalidatePath("/admin");
      return { success: true, data: { userId: clerkUser.id, role: 'admin' } };
    } else { // 'tower'
      await prisma.tower.create({
        data: {
          clerk_id: clerkUser.id,
          email: emailAddress,
          full_name: fullName,
        },
      });
      revalidatePath("/admin");
      return { success: true, data: { userId: clerkUser.id, role: 'tower' } };
    }
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    // Clerk throws an error if email already exists, etc.
    return { success: false, error: error.errors?.[0]?.longMessage || error.message || "Error desconocido al crear usuario." };
  }
}
