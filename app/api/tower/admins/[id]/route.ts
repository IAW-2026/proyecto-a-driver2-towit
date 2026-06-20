import { NextResponse } from 'next/server';
import { clerkClient } from "@clerk/nextjs/server"; // Mantener para la gestión de usuarios Clerk
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // CORRECTED IMPORT
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';

/**
 * GET /api/admins/[id]
 * Obtiene un registro de la tabla Admin por su ID.
 * Requiere una clave API de administrador válida.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  const { id } = params;
  try {
    const admin = await prisma.admin.findUnique({
      where: { admin_id: id },
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: "Administrador no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: admin });
  } catch (error: any) {
    console.error(`Error al obtener Admin ${id}:`, error);
    return NextResponse.json({ success: false, error: "Error al obtener el Administrador." }, { status: 500 });
  }
}

/**
 * PUT /api/admins/[id]
 * Actualiza un registro de la tabla Admin.
 * Requiere rol de administrador.
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  const { id } = params;
  try {
    const data = await req.json();
    const { full_name, email } = data;

    // Primero, obtener el clerk_id asociado al admin_id de Prisma
    const existingAdmin = await prisma.admin.findUnique({
      where: { admin_id: id },
      select: { clerk_id: true, full_name: true, email: true },
    });

    if (!existingAdmin) {
      return NextResponse.json({ success: false, error: "Administrador no encontrado en la base de datos." }, { status: 404 });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { admin_id: id },
      data: {
        full_name: full_name,
        email: email,
      },
    });

    // Opcional: Si el email o nombre completo del Admin cambia, también actualizar en Clerk
    if (updatedAdmin.clerk_id && (full_name !== undefined || email !== undefined)) {
      const clerkUpdateParams: { firstName?: string; lastName?: string; emailAddress?: string } = {};
      if (full_name !== undefined) {
        const nameParts = full_name.split(' ');
        clerkUpdateParams.firstName = nameParts[0] || '';
        clerkUpdateParams.lastName = nameParts.slice(1).join(' ') || '';
      }
      if (email !== undefined) {
        clerkUpdateParams.emailAddress = email;
      }

      if (Object.keys(clerkUpdateParams).length > 0) {
        const client = await clerkClient();
        await client.users.updateUser(updatedAdmin.clerk_id, clerkUpdateParams);
        console.log(`Clerk user ${updatedAdmin.clerk_id} (Admin) updated from API.`);
      }
    }

    revalidatePath("/admin/admins");
    return NextResponse.json({ success: true, data: updatedAdmin });
  } catch (error: any) {
    console.error(`Error al actualizar Admin ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al actualizar el administrador." }, { status: 500 });
  }
}

/**
 * DELETE /api/admins/[id]
 * Elimina un registro de la tabla Admin.
 * Requiere rol de administrador.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  const { id } = params;
  try {
    const adminToDelete = await prisma.admin.findUnique({
      where: { admin_id: id },
      select: { clerk_id: true },
    });

    if (!adminToDelete) {
      return NextResponse.json({ success: false, error: "Administrador no encontrado." }, { status: 404 });
    }

    // 1. Eliminar de Clerk
    const client = await clerkClient();
    await client.users.deleteUser(adminToDelete.clerk_id);
    console.log(`Clerk user ${adminToDelete.clerk_id} (Admin) deleted.`);

    // 2. Eliminar de la base de datos de Neon
    await prisma.admin.delete({
      where: { admin_id: id },
    });
    console.log(`Admin ${id} deleted from Neon database.`);

    revalidatePath("/admin/admins");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error al eliminar Admin ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar el administrador." }, { status: 500 });
  }
}
