import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

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
    const { id, first_name, last_name, email_addresses } = evt.data;

    if (!id || !email_addresses || email_addresses.length === 0) {
        console.error('Error: Missing user ID or email addresses in webhook event', evt.data);
        return new Response('Error: Missing user ID or email addresses', { status: 400 });
    }

    const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)?.email_address || email_addresses[0].email_address;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      const client = await clerkClient();

      // Actualizar el rol del usuario en Clerk
      await client.users.updateUser(id, {
        publicMetadata: {
          role: 'tower',
        },
      });
      console.log(`User ${id} updated with publicMetadata: { role: 'tower' }`);

      // Guardar el usuario en la base de datos de Neon
      await prisma.tower.create({
        data: {
          clerk_id: id,
          email: primaryEmail,
          full_name: fullName,
        },
      });
      console.log(`User ${id} saved to Neon database.`);

    } catch (error) {
      console.error(`Failed to process user.created event for user ${id}:`, error);
      // Podrías decidir si retornar un error 500 o simplemente loggear y continuar
      return new Response('Error processing user.created webhook event', { status: 500 });
    }
  } else if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (!id) {
      console.error('Error: Missing user ID in user.deleted webhook event');
      return new Response('Error: Missing user ID for deletion', { status: 400 });
    }

    try {
      await prisma.tower.delete({
        where: { clerk_id: id },
      });
      console.log(`User ${id} deleted from Neon database.`);
    } catch (error) {
      console.error(`Failed to delete user ${id} from database:`, error);
      return new Response('Error deleting user from database', { status: 500 });
    }
  }

  return new NextResponse('Webhook processed', { status: 200 });
}
