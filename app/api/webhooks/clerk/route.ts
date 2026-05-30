import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response('Error: Missing CLERK_WEBHOOK_SECRET environment variable', { status: 500 });
  }

  // Obtener los encabezados
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Si no hay encabezados, retornar un error
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: No Svix headers found', {
      status: 400,
    });
  }

  // Obtener el cuerpo de la petición
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Crear una nueva instancia de Svix con tu secreto
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verificar el payload con los encabezados
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook signature', {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id } = evt.data;

    if (!id) {
        return new Response('Error: User ID not found in webhook event', { status: 400 });
    }

    try {
      const client = await clerkClient();
      await client.users.updateUser(id, {
        publicMetadata: {
          role: 'tower',
        },
      });
      console.log(`User ${id} updated with publicMetadata: { role: 'tower' }`);
    } catch (error) {
      console.error(`Failed to update user ${id} public metadata:`, error);
      return new Response('Error updating user metadata', { status: 500 });
    }
  }

  return new NextResponse('Webhook processed', { status: 200 });
}
