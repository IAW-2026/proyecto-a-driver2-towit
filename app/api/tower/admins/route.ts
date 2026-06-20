import { NextResponse } from 'next/server';
import { clerkClient } from "@clerk/nextjs/server"; // Mantener para la creación de usuarios Clerk
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma'; // CORRECTED IMPORT
import { validateApiKey, unauthorizedResponse, AdminActionResponse } from '@/lib/apiAuth';

/**
 * GET /api/admins
 * Obtiene todos los registros de la tabla Admin.
 * Requiere una clave API de administrador válida.
 */
export async function GET(req: Request): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: admins });
  } catch (error: any) {
    console.error("Error al obtener Admins:", error);
    return NextResponse.json({ success: false, error: "Error al obtener la lista de Administradores." }, { status: 500 });
  }
}

/**
 * POST /api/admins
 * Crea un nuevo usuario Admin en Clerk y en la base de datos de Prisma.
 * Requiere rol de administrador.
 */
export async function POST(req: Request): Promise<NextResponse<AdminActionResponse>> {
  if (!await validateApiKey(req)) {
    return unauthorizedResponse();
  }

  try {
    const formData = await req.json();
    const { firstName, lastName, emailAddress, password } = formData;

    if (!firstName || !lastName || !emailAddress || !password) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios: firstName, lastName, emailAddress, password." }, { status: 400 });
    }

    // 1. Crear usuario en Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [emailAddress],
      password: password,
      publicMetadata: {
        role: 'admin',
      },
    });

    // 2. Crear registro en la base de datos de Prisma
    const fullName = `${firstName} ${lastName}`.trim();
    const newAdmin = await prisma.admin.create({
      data: {
        clerk_id: clerkUser.id,
        email: emailAddress,
        full_name: fullName,
      },
    });

    revalidatePath("/admin/admins");
    return NextResponse.json({ success: true, data: newAdmin }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear Admin:", error);
    return NextResponse.json({ success: false, error: error.errors?.[0]?.longMessage || error.message || "Error desconocido al crear Admin." }, { status: 500 });
  }
}
