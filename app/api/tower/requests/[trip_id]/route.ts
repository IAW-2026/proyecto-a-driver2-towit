import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; // Se mantiene para el PATCH, pero no usado en GET
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';
import { redis } from '@/lib/redis-client'; // Importamos el cliente Redis

/**
 * GET /api/tower/requests/[trip_id]
 * Consulta el estado de una solicitud de viaje en Redis.
 * Devuelve el estado y la ubicación del tower si la solicitud ha sido aceptada.
 * La Customer App llama a este endpoint.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ trip_id: string }> }
): Promise<NextResponse<AdminActionResponse>> {
  if (!(await validateApiKey(req))) {
    return unauthorizedResponse();
  }
  const { trip_id } = await context.params;

  try {
    // 1. Obtener la solicitud de Redis (exclusivamente)
    const requestKey = `trip:request:${trip_id}`;
    const requestData = await redis.hgetall(requestKey);

    if (!requestData || Object.keys(requestData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Solicitud de viaje no encontrada en Redis.' },
        { status: 404 }
      );
    }

    const status = requestData.status as string || 'unknown'; // Asegurarse de tener un estado
    let towerLocation = { lat: '', long: '' };

    // Solo se devuelve la ubicación del tower si la solicitud ha sido aceptada
    if (status === 'accepted') {
      towerLocation.lat = (requestData.tower_location_lat as string) || '';
      towerLocation.long = (requestData.tower_location_long as string) || '';
    }

    return NextResponse.json({
      success: true,
      data: {
        status: status,
        location: towerLocation,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error(`Error al consultar estado de solicitud ${trip_id} en Redis:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tower/requests/[trip_id]
 * Cancela un pedido de tower para un viaje.
 * La Customer App llama a este endpoint.
 *
 * NOTA: Este endpoint sigue usando Prisma para actualizar el estado de Assignment,
 * tal como fue solicitado mantener su implementación original.
 * Esto podría generar inconsistencias si GET solo consulta Redis.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ trip_id: string }> }
): Promise<NextResponse<AdminActionResponse>> {
  if (!(await validateApiKey(req))) {
    return unauthorizedResponse();
  }
  const { trip_id } = await context.params;

  try {
    // 1. Encontrar la asignación del viaje en Neon
    const assignment = await prisma.assignment.findUnique({
      where: { trip_id: trip_id },
      include: {
        tower: {
          select: { clerk_id: true }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Viaje no encontrado o no asignado.' },
        { status: 404 }
      );
    }

    // Si el viaje ya está completado o cancelado, no permitir otra cancelación
    if (assignment.status === 'cancelled' || assignment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: `El viaje ya está en estado ${assignment.status}.` },
        { status: 400 }
      );
    }

    const requestKey = `trip:request:${trip_id}`;

    // 2. Actualizar el estado de la asignación a 'CANCELADO' en Neon
    const updatedAssignment = await prisma.assignment.update({
      where: { trip_id: trip_id },
      data: { status: 'cancelled' },
    });

    // 3. Liberar la torre en Redis si estaba asignada Y actualizar el estado de la solicitud en Redis
    const pipeline = redis.pipeline();
    pipeline.hset(requestKey, { status: 'cancelled' }); // Marcar la solicitud como cancelada en Redis

    if (assignment.tower && assignment.tower.clerk_id) {
      const towerClerkId = assignment.tower.clerk_id;

      // Actualizar el estado de la torre a "disponible" en su perfil de Redis.
      // La propia aplicación del conductor (ServicePageClient) se encargará de re-añadir
      // sus coordenadas al GeoSet `towers:locations:available` si se marca como "disponible"
      // y está enviando su ubicación.
      pipeline.hset(`tower:profile:${towerClerkId}`, { status: 'available' }); // Corregido a 'available'
      pipeline.set(`tower:heartbeat:${towerClerkId}`, '1', { ex: 30 }); // Renovar heartbeat con opciones

      console.log(`Tower ${towerClerkId} liberada y marcada como available después de la cancelación del viaje ${trip_id}.`);
    }
    await pipeline.exec(); // Ejecutar todas las operaciones en pipeline

    console.log(`Viaje ${trip_id} cancelado.`);

    // En una implementación real, aquí se notificaría a la Tower App de la cancelación.

    return NextResponse.json({ success: true, data: updatedAssignment }, { status: 200 });
  } catch (error: any) {
    console.error(`Error al cancelar pedido de tower ${trip_id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor al cancelar la solicitud.' },
      { status: 500 }
    );
  }
}
