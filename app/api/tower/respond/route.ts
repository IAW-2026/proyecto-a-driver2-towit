import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function POST(req: Request) {
    try {
        const { trip_id, tower_id, action, tower_location_lat, tower_location_long } = await req.json(); // action: 'accept' | 'reject'

        const requestKey = `trip:request:${trip_id}`;
        const trip = await redis.hgetall(requestKey);

        if (!trip) {
            return NextResponse.json({ success: false, error: 'El viaje ya no existe.' }, { status: 404 });
        }

        // Verificar que el viaje siga disponible
        if (trip.status !== 'pending') {
            return NextResponse.json({ success: false, error: 'El viaje ya fue tomado o cancelado.' }, { status: 400 });
        }

        const offerPointerKey = `tower:active-offer:${tower_id}`;

        if (action === 'accept') {
            // --- ESCENARIO A: ACEPTÓ EL VIAJE ---
            const updatePipeline = redis.pipeline();

            // 1. Cambiamos estado del viaje
            updatePipeline.hset(requestKey, {
                status: 'accepted',
                tower_clerk_id: tower_id,
                tower_location_lat: tower_location_lat ? String(tower_location_lat) : undefined,
                tower_location_long: tower_location_long ? String(tower_location_long) : undefined,
            });
            // eliminamos el ttl del viaje
            updatePipeline.persist(requestKey);
            // 2. Quitamos al tower de los disponibles y actualizamos su perfil
            updatePipeline.zrem('towers:locations:available', tower_id);
            updatePipeline.hset(`tower:profile:${tower_id}`, { status: 'on_trip' });

            // NUEVO: Limpiamos su puntero de oferta activa
            updatePipeline.del(offerPointerKey);

            await updatePipeline.exec();

            console.log(`[Éxito] Viaje ${trip_id} aceptado por el Tower ${tower_id}`);
            return NextResponse.json({ success: true, status: 'accepted' });

        } else if (action === 'reject') {
            // --- ESCENARIO B: RECHAZÓ EL VIAJE ---
            console.log(`[Rechazo] Tower ${tower_id} rechazó manualmente el viaje ${trip_id}`);

            // 1. Avanzamos el índice e inmediatamente borramos su oferta activa de Redis
            await redis.pipeline()
                .hincrby(requestKey, 'current_tower_index', 1)
                .del(offerPointerKey)
                .exec();

            // 2. Disparamos el siguiente chofer al instante con await para Vercel
            const requestUrl = new URL(req.url);

            const baseUrl = requestUrl.hostname === 'localhost'
                ? process.env.NEXT_PUBLIC_TUNNEL_URL
                : requestUrl.origin;
            await fetch(`${baseUrl}/api/tower/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${process.env.API_SECRET_KEY}`
                },
                body: JSON.stringify({ trip_id }),
            }).catch(err => console.error("Error al pasar al siguiente offer tras rechazo:", err));

            return NextResponse.json({ success: true, status: 'rejected' });
        }

        return NextResponse.json({ success: false, error: 'Acción inválida.' }, { status: 400 });
    } catch (error: any) {
        console.error('Error en api/tower/respond:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
