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
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  const { id } = await context.params;
  try {
    const data = await req.json();
    const updateData: {
      trip_id?: string;
      tower_id?: string;
      status?: string;
      location?: any;
      origin?: string;
      destination?: string;
      deactivated?: boolean; // Permitir actualizar el campo deactivated
    } = {};

    if (data.trip_id !== undefined) updateData.trip_id = data.trip_id;
    if (data.tower_id !== undefined) updateData.tower_id = data.tower_id;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.origin !== undefined) updateData.origin = data.origin;
    if (data.destination !== undefined) updateData.destination = data.destination;
    if (data.deactivated !== undefined) updateData.deactivated = data.deactivated; // Añadir deactivated

    if (updateData.tower_id) {
      // Verificar si la tower_id existe si se está actualizando
      const towerExists = await prisma.tower.findUnique({
        where: { tower_id: updateData.tower_id },
      });
      if (!towerExists) {
        return NextResponse.json({ success: false, error: "La Tower especificada no existe." }, { status: 404 });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "No se proporcionaron datos para actualizar." }, { status: 400 });
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { assignment_id: id },
      data: updateData,
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
