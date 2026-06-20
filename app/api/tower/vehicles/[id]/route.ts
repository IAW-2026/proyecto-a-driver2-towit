import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // CORRECTED IMPORT
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';

/**
 * GET /api/vehicles/[id]
 * Obtiene un registro de la tabla Vehicle por su ID.
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
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: id },
    });

    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehículo no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: vehicle });
  } catch (error: any) {
    console.error(`Error al obtener Vehicle ${id}:`, error);
    return NextResponse.json({ success: false, error: "Error al obtener el vehículo." }, { status: 500 });
  }
}

/**
 * PUT /api/vehicles/[id]
 * Actualiza un registro de la tabla Vehicle.
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
    const { brand, model, year, max_load, tower_id } = data;

    if (tower_id) {
      // Verificar si la tower_id existe si se está actualizando
      const towerExists = await prisma.tower.findUnique({
        where: { tower_id: tower_id },
      });
      if (!towerExists) {
        return NextResponse.json({ success: false, error: "La Tower especificada no existe." }, { status: 404 });
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { vehicle_id: id },
      data: {
        brand: brand,
        model: model,
        year: year ? parseInt(year, 10) : undefined,
        max_load: max_load ? parseFloat(max_load) : undefined,
        tower_id: tower_id,
      },
    });

    revalidatePath("/admin/vehicles");
    return NextResponse.json({ success: true, data: updatedVehicle });
  } catch (error: any) {
    console.error(`Error al actualizar Vehicle ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al actualizar el vehículo." }, { status: 500 });
  }
}

/**
 * DELETE /api/vehicles/[id]
 * Elimina un registro de la tabla Vehicle.
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
    const vehicleToDelete = await prisma.vehicle.findUnique({
      where: { vehicle_id: id },
    });

    if (!vehicleToDelete) {
      return NextResponse.json({ success: false, error: "Vehículo no encontrado." }, { status: 404 });
    }

    await prisma.vehicle.delete({
      where: { vehicle_id: id },
    });

    revalidatePath("/admin/vehicles");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error al eliminar Vehicle ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar el vehículo." }, { status: 500 });
  }
}
