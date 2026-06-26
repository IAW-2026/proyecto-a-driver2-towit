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
    const requestKey = `trip:request:${trip_id}`;
    
    // 1. Consultar estado en Redis primero
    const requestData = await redis.hgetall(requestKey);

    let currentStatus = 'unknown';
    
    if (requestData && Object.keys(requestData).length > 0) {
      currentStatus = requestData.status as string;
    }

    // 2. Si está en Neon, buscar la asignación
    const assignment = await prisma.assignment.findUnique({
      where: { trip_id: trip_id },
      include: {
        tower: {
          select: { clerk_id: true }
        }
      }
    });

    // Si no está ni en Redis ni en Neon, no existe
    if ((!requestData || Object.keys(requestData).length === 0) && !assignment) {
      return NextResponse.json(
        { success: false, error: 'Viaje no encontrado o no asignado.' },
        { status: 404 }
      );
    }
    
    if (assignment) {
        currentStatus = assignment.status;
    }

    // Si ya está completado o cancelado
    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
      return NextResponse.json(
        { success: false, error: `El viaje ya está en estado ${currentStatus}.` },
        { status: 400 }
      );
    }

    const pipeline = redis.pipeline();
    // 3. Marcar la solicitud como cancelada en Redis siempre si existe ahí
    if (requestData && Object.keys(requestData).length > 0) {
      pipeline.hset(requestKey, { status: 'cancelled' });
    }

    let responseData: any = {
      trip_id: trip_id,
      status: 'cancelled'
    };

    if (assignment) {
      // 4. Actualizar el estado de la asignación a 'cancelled' en Neon
      const updatedAssignment = await prisma.assignment.update({
        where: { trip_id: trip_id },
        data: { status: 'cancelled' },
      });
      responseData = updatedAssignment;

      // 5. Liberar la torre en Redis si estaba asignada
      if (assignment.tower && assignment.tower.clerk_id) {
        const towerClerkId = assignment.tower.clerk_id;

        // Actualizar el estado de la torre a "disponible" en su perfil de Redis.
        pipeline.hset(`tower:profile:${towerClerkId}`, { status: 'available' });
        pipeline.set(`tower:heartbeat:${towerClerkId}`, '1', { ex: 30 });

        console.log(`Tower ${towerClerkId} liberada y marcada como available después de la cancelación del viaje ${trip_id}.`);
      }
    }

    await pipeline.exec(); // Ejecutar todas las operaciones en pipeline

    console.log(`Viaje ${trip_id} cancelado.`);

    // En una implementación real, aquí se notificaría a la Tower App de la cancelación.

    return NextResponse.json({ success: true, data: responseData }, { status: 200 });
  } catch (error: any) {
    console.error(`Error al cancelar pedido de tower ${trip_id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor al cancelar la solicitud.' },
      { status: 500 }
    );
  }
}
