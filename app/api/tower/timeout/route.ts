import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

export async function POST(req: Request) {
    try {
        const { trip_id, tower_id, index_offered } = await req.json();

        const requestKey = `trip:request:${trip_id}`;

        // Verificar el estado actual en Redis
        const trip = await redis.hgetall(requestKey);
        if (!trip) return NextResponse.json({ message: 'Viaje no encontrado.' });

        const currentIndex = parseInt((trip.current_tower_index ?? '0') as string, 10);

        // Solo pasamos al siguiente si el viaje sigue en 'pending' y el índice coincide
        if (trip.status === 'pending' && currentIndex === index_offered) {
            console.log(`[Timeout] Tower ${tower_id} ignoró el viaje ${trip_id}. Pasando al siguiente...`);

            // NUEVO: Limpiar el puntero de oferta del tower actual para que su polling deje de ver el viaje
            await redis.del(`tower:active-offer:${tower_id}`);

            // Incrementamos el índice en Redis para apuntar al próximo candidato
            await redis.hincrby(requestKey, 'current_tower_index', 1);

            // 1. Parseamos la URL de la request
            const requestUrl = new URL(req.url);

            // 2. Si el hostname es localhost, forzamos HTTP plano para evitar el baneo de SSL local
            const baseUrl = requestUrl.hostname === 'localhost'
                ? process.env.NEXT_PUBLIC_TUNNEL_URL
                : requestUrl.origin;

            // Llamamos al motor de ofertas asegurando el await para Vercel
            await fetch(`${baseUrl}/api/tower/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${process.env.API_SECRET_KEY}`
                },
                body: JSON.stringify({ trip_id }),
            }).catch(err => console.error("Error llamando al siguiente offer:", err));
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error en api/tower/timeout:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}