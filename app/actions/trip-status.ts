"use server";

import { redis } from '@/lib/redis-client';

export async function checkActiveTripStatusLocal(tripId: string): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const requestData = await redis.hgetall(`trip:request:${tripId}`);
    if (!requestData || Object.keys(requestData).length === 0) {
      return { success: false, error: 'Viaje no encontrado' };
    }
    return { success: true, status: requestData.status as string };
  } catch (error: any) {
    console.error("Error checking trip status locally:", error);
    return { success: false, error: error.message };
  }
}

interface UpdateTripStatusResponse {
  success: boolean;
  error?: string;
}

/**
 * Actualiza el estado de un viaje en la Customer App.
 * @param tripId El ID del viaje a actualizar.
 * @param status El nuevo estado del viaje (ej. 'cancelado').
 * @returns Una promesa que resuelve con un objeto indicando el éxito o un error.
 */
export async function updateTripStatusInCustomerApp(
  tripId: string,
  towerId: string,
  status: string
): Promise<UpdateTripStatusResponse> {
  const customerAppUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL;
  const apiKey = process.env.API_SECRET_KEY;

  if (!customerAppUrl || customerAppUrl.length === 0) {
    console.error("Missing NEXT_PUBLIC_CUSTOMER_APP_URL environment variable.");
    return { success: false, error: "URL de la aplicación del cliente no configurada." };
  }

  if (!apiKey) {
    console.error("Missing API_SECRET_KEY environment variable.");
    return { success: false, error: "Clave API de seguridad no configurada." };
  }

  try {
    const response = await fetch(`${customerAppUrl}/api/customer/trips/${tripId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        tower_id: towerId,
        status: status
      }),
    });

    if (response.ok) {
      console.log(`Estado del viaje ${tripId} actualizado a '${status}' en Customer App.`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`Error actualizando estado del viaje en Customer App (${customerAppUrl}): ${response.status} - ${errorText}`);
      let errorMessage = `Error al actualizar el estado del viaje: ${response.statusText}. Código: ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error("Network error updating trip status in Customer App:", error);
    return { success: false, error: `Error de red al actualizar el estado del viaje: ${error.message}` };
  }
}
