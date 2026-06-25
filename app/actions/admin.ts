"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface PaginatedAdminActionResponse {
  success: boolean;
  data?: any;
  totalPages?: number;
  currentPage?: number;
  error?: string;
}
// AdminActionResponse es para acciones que no devuelven datos paginados
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
 * Obtiene todos los registros de la tabla Tower con paginación.
 * Requiere rol de administrador.
 */
export async function getAllTowers(page: number = 1, limit: number = 10): Promise<PaginatedAdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  try {
    const skip = (page - 1) * limit;
    const [towers, totalCount] = await prisma.$transaction([
      prisma.tower.findMany({
        orderBy: { createdAt: 'asc' },
        skip: skip,
        take: limit,
      }),
      prisma.tower.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return { success: true, data: towers, totalPages, currentPage: page };
  } catch (error: any) {
    console.error("Error al obtener Towers:", error);
    return { success: false, error: "Error al obtener la lista de Towers." };
  }
}

/**
 * Obtiene todos los registros de la tabla Vehicle con paginación.
 * Requiere rol de administrador.
 */
export async function getAllVehicles(page: number = 1, limit: number = 10): Promise<PaginatedAdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  try {
    const skip = (page - 1) * limit;
    const [vehicles, totalCount] = await prisma.$transaction([
      prisma.vehicle.findMany({
        orderBy: { createdAt: 'asc' },
        skip: skip,
        take: limit,
      }),
      prisma.vehicle.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return { success: true, data: vehicles, totalPages, currentPage: page };
  } catch (error: any) {
    console.error("Error al obtener Vehicles:", error);
    return { success: false, error: "Error al obtener la lista de Vehículos." };
  }
}

/**
 * Obtiene todos los registros de la tabla Assignment con paginación.
 * Requiere rol de administrador.
 */
export async function getAllAssignments(page: number = 1, limit: number = 10): Promise<PaginatedAdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  try {
    const skip = (page - 1) * limit;
    const [assignments, totalCount] = await prisma.$transaction([
      prisma.assignment.findMany({
        orderBy: { createdAt: 'asc' },
        skip: skip,
        take: limit,
      }),
      prisma.assignment.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return { success: true, data: assignments, totalPages, currentPage: page };
  } catch (error: any) {
    console.error("Error al obtener Assignments:", error);
    return { success: false, error: "Error al obtener la lista de Asignaciones." };
  }
}

/**
 * Obtiene los detalles del administrador actualmente logueado.
 * @returns Los detalles del administrador o null si no está logueado o no es administrador.
 */
export async function getAdminDetails(): Promise<
  | {
      userProfile: {
        imageUrl: string;
        fullName: string;
      };
      adminData: {
        admin_id: string; // ID de Prisma
        clerk_id: string;
        email: string;
        full_name: string;
      };
    }
  | null
> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  // Asegurarse de que el usuario es un administrador
  if (clerkUser.publicMetadata?.role !== 'admin') {
    return null;
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { clerk_id: userId },
    });

    if (!admin) {
      console.error(`No se encontró registro de Admin en Prisma para clerk_id: ${userId}`);
      return null;
    }

    // Datos del perfil del usuario de Clerk
    const userProfile = {
      imageUrl: clerkUser.imageUrl,
      fullName: clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : clerkUser.emailAddresses[0]?.emailAddress || 'Admin',
    };

    // Datos específicos del administrador de Prisma
    const adminData = {
      admin_id: admin.admin_id,
      clerk_id: admin.clerk_id,
      email: admin.email,
      full_name: admin.full_name,
    };

    return { userProfile, adminData };
  } catch (error: any) {
    console.error("Error al obtener los detalles del administrador:", error);
    return null;
  }
}

/**
 * Obtiene todos los registros de la tabla Admin con paginación.
 * Requiere rol de administrador.
 */
export async function getAllAdmins(page: number = 1, limit: number = 10): Promise<PaginatedAdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden ver esta información." };
  }
  try {
    const skip = (page - 1) * limit;
    const [admins, totalCount] = await prisma.$transaction([
      prisma.admin.findMany({
        orderBy: { createdAt: 'asc' },
        skip: skip,
        take: limit,
      }),
      prisma.admin.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return { success: true, data: admins, totalPages, currentPage: page };
  } catch (error: any) {
    console.error("Error al obtener Admins:", error);
    return { success: false, error: "Error al obtener la lista de Administradores." };
  }
}

/**
 * Actualiza un registro de la tabla Admin.
 * Requiere rol de administrador.
 * @param adminId El ID de Prisma del administrador a actualizar.
 * @param data Los campos a actualizar (full_name, email).
 */
export async function updateAdmin(
  adminId: string,
  data: { full_name?: string; email?: string }
): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden actualizar administradores." };
  }
  try {
    // Primero, obtener el clerk_id asociado al admin_id de Prisma
    const existingAdmin = await prisma.admin.findUnique({
      where: { admin_id: adminId },
      select: { clerk_id: true, full_name: true, email: true }, // También obtenemos el nombre completo y email actuales para comparar
    });

    if (!existingAdmin) {
      return { success: false, error: "Administrador no encontrado en la base de datos." };
    }

    const updatedAdmin = await prisma.admin.update({
      where: { admin_id: adminId },
      data: {
        full_name: data.full_name,
        email: data.email,
      },
    });

    // Opcional: Si el email o nombre completo del Admin cambia, también actualizar en Clerk
    if (updatedAdmin.clerk_id && (data.full_name !== undefined || data.email !== undefined)) {
      const clerkUpdateParams: { firstName?: string; lastName?: string; emailAddress?: string } = {};
      if (data.full_name !== undefined) {
        const nameParts = data.full_name.split(' ');
        clerkUpdateParams.firstName = nameParts[0] || '';
        clerkUpdateParams.lastName = nameParts.slice(1).join(' ') || '';
      }
      if (data.email !== undefined) {
        clerkUpdateParams.emailAddress = data.email;
      }

      if (Object.keys(clerkUpdateParams).length > 0) {
        const client = await clerkClient();
        client.users.updateUser(updatedAdmin.clerk_id, clerkUpdateParams);
        console.log(`Clerk user ${updatedAdmin.clerk_id} (Admin) updated from admin dashboard.`);
      }
    }

    revalidatePath("/admin");
    return { success: true, data: updatedAdmin };
  } catch (error: any) {
    console.error(`Error al actualizar Admin ${adminId}:`, error);
    return { success: false, error: error.message || "Error al actualizar el administrador." };
  }
}

/**
 * Elimina un registro de la tabla Admin.
 * Requiere rol de administrador.
 * @param adminId El ID de Prisma del administrador a eliminar.
 */
export async function toggleAdminDeactivated(
  adminId: string,
  deactivated: boolean
): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden desactivar/activar administradores." };
  }
  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { admin_id: adminId },
      select: { clerk_id: true, full_name: true, email: true },
    });

    if (!existingAdmin) {
      return { success: false, error: "Administrador no encontrado en la base de datos." };
    }

    const updatedAdmin = await prisma.admin.update({
      where: { admin_id: adminId },
      data: { deactivated: deactivated },
    });

    // Actualizar también el rol en Clerk publicMetadata
    // Si se desactiva, cambiar el rol a 'deactivated_admin'
    // Si se activa, cambiar el rol de nuevo a 'admin'
    const client = await clerkClient();
    await client.users.updateUserMetadata(existingAdmin.clerk_id, {
      publicMetadata: {
        role: deactivated ? 'deactivated_admin' : 'admin',
      },
    });
    console.log(`Clerk user ${existingAdmin.clerk_id} role updated to '${deactivated ? 'deactivated_admin' : 'admin'}'.`);


    revalidatePath("/admin");
    return { success: true, data: updatedAdmin };
  } catch (error: any) {
    console.error(`Error al ${deactivated ? 'desactivar' : 'activar'} Admin ${adminId}:`, error);
    return { success: false, error: error.message || `Error al ${deactivated ? 'desactivar' : 'activar'} el administrador.` };
  }
}

/**
 * Elimina un registro de la tabla Admin.
 * Requiere rol de administrador.
 * @param adminId El ID de Prisma del administrador a eliminar.
 */
export async function deleteAdmin(adminId: string): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden eliminar administradores." };
  }
  try {
    const adminToDelete = await prisma.admin.findUnique({
      where: { admin_id: adminId },
      select: { clerk_id: true },
    });

    if (!adminToDelete) {
      return { success: false, error: "Administrador no encontrado." };
    }

    // 1. Eliminar de Clerk
    await clerkClient().then((client) => client.users.deleteUser(adminToDelete.clerk_id));
    console.log(`Clerk user ${adminToDelete.clerk_id} (Admin) deleted.`);

    // 2. Eliminar de la base de datos de Neon (esto también se gestiona por el webhook user.deleted,
    // pero lo hacemos explícitamente aquí por si acaso, y para mantener la coherencia del flujo de acción directa).
    await prisma.admin.delete({
      where: { admin_id: adminId },
    });
    console.log(`Admin ${adminId} deleted from Neon database.`);

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error(`Error al eliminar Admin ${adminId}:`, error);
    return { success: false, error: error.message || "Error al eliminar el administrador." };
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
  password: string; // Añadido el campo password
  role: 'tower' | 'admin';
}): Promise<AdminActionResponse> {
  if (!await isAdmin()) {
    return { success: false, error: "No autorizado. Solo administradores pueden crear usuarios." };
  }

  const { firstName, lastName, emailAddress, password, role } = formData; // Desestructurado password

  try {
    // 1. Crear usuario en Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [emailAddress],
      password: password, // Pasamos la contraseña a Clerk
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
      revalidatePath("/admin/dashboard");
      return { success: true, data: { userId: clerkUser.id, role: 'admin' } };
    } else { // 'tower'
      await prisma.tower.create({
        data: {
          clerk_id: clerkUser.id,
          email: emailAddress,
          full_name: fullName,
        },
      });
      revalidatePath("/admin/dashboard");
      return { success: true, data: { userId: clerkUser.id, role: 'tower' } };
    }
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    // Clerk throws an error if email already exists, etc.
    return { success: false, error: error.errors?.[0]?.longMessage || error.message || "Error desconocido al crear usuario." };
  }
}
