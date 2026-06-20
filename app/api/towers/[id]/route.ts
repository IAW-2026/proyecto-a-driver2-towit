import { NextResponse } from 'next/server';
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // CORRECTED IMPORT

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
 * GET /api/towers/[id]
 * Obtiene un registro de la tabla Tower por su ID.
 * Requiere rol de administrador.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado. Solo administradores pueden ver esta información." }, { status: 403 });
  }
  const { id } = params;
  try {
    const tower = await prisma.tower.findUnique({
      where: { tower_id: id },
    });

    if (!tower) {
      return NextResponse.json({ success: false, error: "Tower no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: tower });
  } catch (error: any) {
    console.error(`Error al obtener Tower ${id}:`, error);
    return NextResponse.json({ success: false, error: "Error al obtener la Tower." }, { status: 500 });
  }
}

/**
 * PUT /api/towers/[id]
 * Actualiza un registro de la tabla Tower.
 * Requiere rol de administrador.
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado. Solo administradores pueden actualizar Towers." }, { status: 403 });
  }
  const { id } = params;
  try {
    const data = await req.json();
    const { full_name, email, payments_alias } = data;

    // Primero, obtener el clerk_id asociado al tower_id de Prisma
    const existingTower = await prisma.tower.findUnique({
      where: { tower_id: id },
      select: { clerk_id: true, full_name: true, email: true },
    });

    if (!existingTower) {
      return NextResponse.json({ success: false, error: "Tower no encontrada en la base de datos." }, { status: 404 });
    }

    const updatedTower = await prisma.tower.update({
      where: { tower_id: id },
      data: {
        full_name: full_name,
        email: email,
        payments_alias: payments_alias,
      },
    });

    // Opcional: Si el email o nombre completo de la Tower cambia, también actualizar en Clerk
    if (updatedTower.clerk_id && (full_name !== undefined || email !== undefined)) {
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
        await client.users.updateUser(updatedTower.clerk_id, clerkUpdateParams);
        console.log(`Clerk user ${updatedTower.clerk_id} (Tower) updated from API.`);
      }
    }

    revalidatePath("/admin/towers");
    return NextResponse.json({ success: true, data: updatedTower });
  } catch (error: any) {
    console.error(`Error al actualizar Tower ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al actualizar la Tower." }, { status: 500 });
  }
}

/**
 * DELETE /api/towers/[id]
 * Elimina un registro de la tabla Tower.
 * Requiere rol de administrador.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado. Solo administradores pueden eliminar Towers." }, { status: 403 });
  }
  const { id } = params;
  try {
    const towerToDelete = await prisma.tower.findUnique({
      where: { tower_id: id },
      select: { clerk_id: true },
    });

    if (!towerToDelete) {
      return NextResponse.json({ success: false, error: "Tower no encontrada." }, { status: 404 });
    }

    // 1. Eliminar de Clerk
    const client = await clerkClient();
    await client.users.deleteUser(towerToDelete.clerk_id);
    console.log(`Clerk user ${towerToDelete.clerk_id} (Tower) deleted.`);

    // 2. Eliminar de la base de datos de Neon
    await prisma.tower.delete({
      where: { tower_id: id },
    });
    console.log(`Tower ${id} deleted from Neon database.`);

    revalidatePath("/admin/towers");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error al eliminar Tower ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar la Tower." }, { status: 500 });
  }
}
