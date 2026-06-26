"use server";

interface CustomerNameResponse {
  success: boolean;
  fullname?: string;
  error?: string;
}

/**
 * Obtiene el nombre completo de un cliente desde la aplicación externa de clientes
 * utilizando una clave API secreta del servidor.
 * @param customerId El ID del cliente a buscar.
 * @returns Una promesa que resuelve con el nombre del cliente o un error.
 */
export async function getCustomerName(customerId: string): Promise<CustomerNameResponse> {
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
    const response = await fetch(`${customerAppUrl}/api/customer/${customerId}/name`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      },
      // cache: 'no-store', // Se puede descomentar si se quiere asegurar que no haya caché de esta llamada
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, fullname: data.fullname };
    } else {
      const errorText = await response.text();
      console.error(`Error fetching customer name from external API (${customerAppUrl}): ${response.status} - ${errorText}`);
      return { success: false, error: `Error al obtener el nombre del cliente: ${response.statusText}` };
    }
  } catch (error: any) {
    console.error("Network error fetching customer name from external API:", error);
    return { success: false, error: `Error de red al obtener el nombre del cliente: ${error.message}` };
  }
}
