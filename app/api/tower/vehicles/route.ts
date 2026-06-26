import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // CORRECTED IMPORT
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';

/**
 * GET /api/vehicles
 * Obtiene todos los registros de la tabla Vehicle.
 * Requiere una clave API de administrador válida.
 */
export async function GET(req: Request): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: vehicles });
  } catch (error: any) {
    console.error("Error al obtener Vehicles:", error);
    return NextResponse.json({ success: false, error: "Error al obtener la lista de Vehículos." }, { status: 500 });
  }
}

/**
 * POST /api/vehicles
 * Crea un nuevo registro de la tabla Vehicle.
 * Requiere rol de administrador.
 */
export async function POST(req: Request): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }

  try {
    const data = await req.json();
    const { brand, model, year, max_load, tower_id } = data;

    if (!brand || !model || !year || !max_load || !tower_id) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios para el vehículo: brand, model, year, max_load, tower_id." }, { status: 400 });
    }

    // Verificar si la tower_id existe
    const towerExists = await prisma.tower.findUnique({
      where: { tower_id: tower_id },
    });
    if (!towerExists) {
      return NextResponse.json({ success: false, error: "La Tower especificada no existe." }, { status: 404 });
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        brand,
        model,
        year: parseInt(year, 10),
        max_load: parseFloat(max_load),
        tower_id,
      },
    });

    revalidatePath("/admin/vehicles");
    return NextResponse.json({ success: true, data: newVehicle }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear Vehicle:", error);
    return NextResponse.json({ success: false, error: error.message || "Error desconocido al crear vehículo." }, { status: 500 });
  }
}
