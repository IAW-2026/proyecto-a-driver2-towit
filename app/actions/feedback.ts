"use server";

interface CustomerRatingResponse {
  success: boolean;
  rating?: number | null; // Usamos number | null para representar la calificación o su ausencia
  error?: string;
}

/**
 * Obtiene la calificación promedio de un cliente desde la aplicación externa de Feedback
 * utilizando una clave API secreta del servidor.
 * @param customerId El ID del cliente a buscar.
 * @returns Una promesa que resuelve con un objeto de respuesta que contiene la calificación (o null) o un error.
 */
export async function getAverageRatingForCustomer(customerId: string): Promise<CustomerRatingResponse> {
  const feedbackAppUrl = process.env.NEXT_PUBLIC_FEEDBACK_APP_URL;
  const apiKey = process.env.API_SECRET_KEY;

  if (!feedbackAppUrl || feedbackAppUrl.length === 0) {
    console.error("Missing FEEDBACK_APP_URL environment variable.");
    return { success: false, error: "URL de la aplicación de feedback no configurada." };
  }

  if (!apiKey) {
    console.error("Missing API_SECRET_KEY environment variable.");
    return { success: false, error: "Clave API de seguridad no configurada." };
  }

  try {
    const response = await fetch(`${feedbackAppUrl}/api/feedback/avg_rating/${customerId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      },
      cache: 'no-store', // Se puede descomentar si se quiere asegurar que no haya caché de esta llamada
    });

    if (response.ok) {
      const data = await response.json();
      const rating = parseFloat(data.avg_rating); // La API devuelve la calificación como string
      if (!isNaN(rating)) {
        return { success: true, rating: rating };
      } else {
        console.warn(`Feedback API returned non-numeric rating for customer ${customerId}: ${data.avg_rating}`);
        return { success: true, rating: null }; // Considerar como "N/D" si no es un número válido
      }
    } else if (response.status === 404) {
      // Si la calificación no se encuentra, retornamos success: true con rating: null
      // Esto permite mostrar "N/D" en la UI sin indicar un error de la aplicación.
      return { success: true, rating: null };
    } else {
      const errorText = await response.text();
      console.error(`Error fetching customer rating from external API (${feedbackAppUrl}): ${response.status} - ${errorText}`);
      return { success: false, error: `Error al obtener la calificación del cliente: ${response.statusText}` };
    }
  } catch (error: any) {
    console.error("Network error fetching customer rating from external API:", error);
    return { success: false, error: `Error de red al obtener el nombre del cliente: ${error.message}` };
  }
}
