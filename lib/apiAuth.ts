import { NextResponse } from 'next/server';

export interface AdminActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Valida la clave API proporcionada en los encabezados de la solicitud.
 * @param req El objeto Request de Next.js.
 * @returns true si la clave API es válida, false en caso contrario.
 */
export async function validateApiKey(req: Request): Promise<boolean> {
  const API_SECRET_KEY = process.env.API_SECRET_KEY;

  if (!API_SECRET_KEY) {
    console.error('Missing API_SECRET_KEY environment variable');
    return false;
  }

  const apiKey = req.headers.get('x-api-key');
  return apiKey === API_SECRET_KEY;
}

/**
 * Crea una respuesta de error de no autorizado para las API.
 */
export function unauthorizedResponse(): NextResponse<AdminActionResponse> {
  return NextResponse.json(
    { success: false, error: "No autorizado. Se requiere una clave API válida." },
    { status: 403 }
  );
}
