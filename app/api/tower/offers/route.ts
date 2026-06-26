import { after, NextResponse } from 'next/server'; // NUEVO: Importar 'after'
import { redis } from '@/lib/redis-client';
import { Client } from '@upstash/qstash';
import { updateTripStatusInCustomerApp } from '@/app/actions/trip-status'; // NUEVO: Importar la Server Action

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function POST(req: Request) {
    try {
        const { trip_id } = await req.json();

        const requestKey = `trip:request:${trip_id}`;
        const candidatesKey = `trip:request:${trip_id}:candidates`;

        // 1. Obtener el viaje
        const trip = await redis.hgetall(requestKey);

        // Solo continuamos si el estado es estrictamente 'pending'
        if (!trip || trip.status !== 'pending') {
            return NextResponse.json({ message: 'El viaje ya no está disponible (no es pending).' }, { status: 200 });
        }

        const currentIndex = parseInt((trip.current_tower_index ?? '0') as string, 10);

        // 2. Buscar al candidato en el índice actual
        const towerId = await redis.lindex(candidatesKey, currentIndex);

        // 3. Si la lista de candidatos se agotó y nadie aceptó
        if (!towerId) {
            await redis.hset(requestKey, { status: 'cancelled' });
            console.log(`[Asignación] Viaje ${trip_id} cancelado automáticamente: Se agotaron los candidatos.`);
            
            // NUEVO: Informar a la Customer App que el viaje fue cancelado
            after(() =>
              updateTripStatusInCustomerApp(trip_id, "-", 'cancelado').catch(error => {
                console.error(`[Error Background Trigger] No se pudo cancelar el viaje ${trip_id} en Customer App: `, error);
              })
            );

            return NextResponse.json({ message: 'No se encontraron torres. Viaje cancelado.' });
        }

        console.log(`[Oferta] Ofreciendo viaje ${trip_id} (PENDING) al Tower ${towerId} (Índice: ${currentIndex})`);

        // Adentro de api/tower/offers, antes de guardar offerPointerKey
        const isBusy = await redis.exists(`tower:active-offer:${towerId}`);

        // 1. Parseamos la URL de la request
        const requestUrl = new URL(req.url);

        // 2. Si el hostname es localhost, forzamos HTTP plano para evitar el baneo de SSL local
        const baseUrl = requestUrl.hostname === 'localhost'
            ? process.env.NEXT_PUBLIC_TUNNEL_URL
            : requestUrl.origin;

        if (isBusy) {
            console.log(`[Concurrencia] Tower ${towerId} ya está evaluando otra oferta. Pasando al siguiente...`);
            await redis.hincrby(requestKey, 'current_tower_index', 1);

            // Llamás recursivamente al fetch interno para saltar al siguiente de la lista
            // (Asegurate de retornar para cortar la ejecución actual)
            await fetch(`${baseUrl}/api/tower/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${process.env.API_SECRET_KEY}`
                },
                body: JSON.stringify({ trip_id: trip.id })
            }).catch(error => {
                console.error(`[Error Background Trigger] No se pudo iniciar la oferta para el viaje ${trip.id}: `, error)
            })
            return NextResponse.json({ success: true, message: 'Tower ocupado, saltando...' });
        }

        // 4. NUEVO: Habilitar el puntero en Redis para el Polling del Tower
        const offerPointerKey = `tower:active-offer:${towerId}`;
        await redis.pipeline()
            .hset(offerPointerKey, {
                trip_id: trip_id,
                offered_at: Date.now().toString() // Sello de tiempo para sincronizar el contador en la UI
            })
            .expire(offerPointerKey, 20) // TTL de 20s (un poco más de los 15s por el delay del polling)
            .exec();

        // 5. Programar el timeout en QStash
        await qstash.publishJSON({
            url: `${baseUrl}/api/tower/timeout`,
            body: { trip_id, tower_id: towerId, index_offered: currentIndex },
            delay: 15,
        });

        return NextResponse.json({ success: true, offered_to: towerId });
    } catch (error: any) {
        console.error('Error en api/tower/offers:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
