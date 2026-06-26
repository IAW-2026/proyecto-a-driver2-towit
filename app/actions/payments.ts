"use server";

interface DisbursementResponse {
  success: boolean;
  error?: string;
}

/**
 * Crea un desembolso en la aplicación de pagos externa.
 * @param tripId El ID del viaje asociado al desembolso.
 * @param clerkId El Clerk ID del tower que recibirá el pago.
 * @param feePercentage El porcentaje de la tarifa a aplicar.
 * @returns Una promesa que resuelve con un objeto indicando el éxito o un error.
 */
export async function createDisbursement(
  tripId: string,
  clerkId: string,
  feePercentage: number
): Promise<DisbursementResponse> {
  const paymentsAppUrl = process.env.NEXT_PUBLIC_PAYMENTS_APP_URL;
  const apiKey = process.env.API_SECRET_KEY;

  if (!paymentsAppUrl || paymentsAppUrl.length === 0) {
    console.error("Missing NEXT_PUBLIC_PAYMENTS_APP_URL environment variable.");
    return { success: false, error: "URL de la aplicación de pagos no configurada." };
  }

  if (!apiKey) {
    console.error("Missing API_SECRET_KEY environment variable.");
    return { success: false, error: "Clave API de seguridad no configurada." };
  }

  try {
    const response = await fetch(`${paymentsAppUrl}/api/disbursements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        tripId,
        clerkId,
        feePercentage,
      }),
    });

    if (response.ok) {
      // El endpoint devuelve {}, así que no hay datos para parsear o devolver más allá del éxito.
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`Error creando desembolso en API externa de Pagos (${paymentsAppUrl}): ${response.status} - ${errorText}`);
      let errorMessage = `Error al crear el desembolso: ${response.statusText}. Código: ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error("Network error creating disbursement in external Payments API:", error);
    return { success: false, error: `Error de red al crear el desembolso: ${error.message}` };
  }
}
