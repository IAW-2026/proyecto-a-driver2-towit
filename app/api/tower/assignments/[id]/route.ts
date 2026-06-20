import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // CORRECTED IMPORT
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';

/**
 * GET /api/assignments/[id]
 * Obtiene un registro de la tabla Assignment por su ID.
 * Requiere una clave API de administrador válida.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  const { id } = await context.params;
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { assignment_id: id },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error(`Error al obtener Assignment ${id}:`, error);
    return NextResponse.json({ success: false, error: "Error al obtener la Assignment." }, { status: 500 });
  }
}

/**
 * PUT /api/assignments/[id]
 * Actualiza un registro de la tabla Assignment.
 * Requiere rol de administrador.
 */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  const { id } = await context.params;
  try {
    const data = await req.json();
    const { trip_id, tower_id, status, location } = data;

    if (tower_id) {
      // Verificar si la tower_id existe si se está actualizando
      const towerExists = await prisma.tower.findUnique({
        where: { tower_id: tower_id },
      });
      if (!towerExists) {
        return NextResponse.json({ success: false, error: "La Tower especificada no existe." }, { status: 404 });
      }
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { assignment_id: id },
      data: {
        trip_id: trip_id,
        tower_id: tower_id,
        status: status,
        location: location, // Asumimos que `location` ya es un objeto JSON válido
      },
    });

    revalidatePath("/admin/assignments");
    return NextResponse.json({ success: true, data: updatedAssignment });
  } catch (error: any) {
    console.error(`Error al actualizar Assignment ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al actualizar la asignación." }, { status: 500 });
  }
}

/**
 * DELETE /api/assignments/[id]
 * Elimina un registro de la tabla Assignment.
 * Requiere rol de administrador.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  const { id } = await context.params;
  try {
    const assignmentToDelete = await prisma.assignment.findUnique({
      where: { assignment_id: id },
    });

    if (!assignmentToDelete) {
      return NextResponse.json({ success: false, error: "Assignment no encontrada." }, { status: 404 });
    }

    await prisma.assignment.delete({
      where: { assignment_id: id },
    });

    revalidatePath("/admin/assignments");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error al eliminar Assignment ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar la asignación." }, { status: 500 });
  }
}
