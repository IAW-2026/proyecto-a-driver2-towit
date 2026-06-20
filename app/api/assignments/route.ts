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
 * GET /api/assignments
 * Obtiene todos los registros de la tabla Assignment.
 * Requiere rol de administrador.
 */
export async function GET(): Promise<NextResponse<AdminActionResponse>> {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado. Solo administradores pueden ver esta información." }, { status: 403 });
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
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado. Solo administradores pueden crear asignaciones." }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { trip_id, tower_id, status, location } = data;

    if (!trip_id || !tower_id || !status || !location) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios para la asignación: trip_id, tower_id, status, location." }, { status: 400 });
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
        location, // Asumimos que `location` ya es un objeto JSON válido
      },
    });

    revalidatePath("/admin/assignments");
    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear Assignment:", error);
    return NextResponse.json({ success: false, error: error.message || "Error desconocido al crear asignación." }, { status: 500 });
  }
}
