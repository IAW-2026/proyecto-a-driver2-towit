import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // CORRECTED IMPORT
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';

/**
 * GET /api/assignments
 * Obtiene todos los registros de la tabla Assignment.
 * Requiere una clave API de administrador válida.
 */
export async function GET(req: Request): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  try {
    const assignments = await prisma.assignment.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error("Error al obtener Assignments:", error);
    return NextResponse.json({ success: false, error: "Error al obtener la lista de Assignments." }, { status: 500 });
  }
}

/**
 * POST /api/assignments
 * Crea un nuevo registro de la tabla Assignment.
 * Requiere rol de administrador.
 */
export async function POST(req: Request): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }

  try {
    const data = await req.json();
    const { trip_id, tower_id, status, location, origin, destination } = data;

    if (!trip_id || !tower_id || !status || !location || !origin || !destination) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios para la asignación: trip_id, tower_id, status, location, origin, destination." }, { status: 400 });
    }

    // Verificar si la tower_id existe
    const towerExists = await prisma.tower.findUnique({
      where: { tower_id: tower_id },
    });
    if (!towerExists) {
      return NextResponse.json({ success: false, error: "La Tower especificada no existe." }, { status: 404 });
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        trip_id,
        tower_id,
        status,
        location,
        origin,
        destination,
      },
    });

    revalidatePath("/admin/assignments");
    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear Assignment:", error);
    return NextResponse.json({ success: false, error: error.message || "Error desconocido al crear asignación." }, { status: 500 });
  }
}
