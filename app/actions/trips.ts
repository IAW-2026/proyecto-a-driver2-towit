"use server";

import { auth } from "@clerk/nextjs/server";

// Definiciones de interfaces para la respuesta de la API externa
interface ApiTrip {
  trip_id: string;
  customer_id: string;
  tower_id: string;
  origin: { lat: string; long: string; };
  destination: { lat: string; long: string; };
  status: string;
  date: string;
}

interface ApiCustomerName {
  fullname: string;
}

// Interfaces compartidas para los datos de los viajes
interface Customer {
  customer_id: string;
  full_name: string;
}

interface Coordinates {
  lat: string;
  long: string;
}

export interface Trip {
  id: string;
  tower_id: string;
  customer: Customer;
  vehicle?: { vehicle_id: string; brand: string; model: string; year: number; weight: number; }; // Opcional
  origin: Coordinates;
  destination: Coordinates;
  date: string;
  time?: string; // Opcional
  status: string;
  amount?: number; // Opcional
}

interface GetTripsResult {
  trips?: Trip[];
  totalPages?: number;
  currentPage?: number;
  error?: string;
}

export async function getTripsForUser(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<GetTripsResult> {
  const customerAppUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL;
  const apiSecretKey = process.env.API_SECRET_KEY;

  if (!customerAppUrl) {
    console.error("Missing NEXT_PUBLIC_CUSTOMER_APP_URL environment variable.");
    return { error: "Server configuration error: Customer App URL not defined." };
  }

  if (!apiSecretKey) {
    console.error("Missing API_SECRET_KEY environment variable.");
    return { error: "Server configuration error: API Secret Key not defined." };
  }

  try {
    // 1. Obtener la lista de viajes desde la customer app
    const tripsResponse = await fetch(`${customerAppUrl}/api/customer/trips/${userId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiSecretKey,
      },
      cache: 'no-store',
    });

    if (!tripsResponse.ok) {
      const errorData = await tripsResponse.json();
      // Si es un 404 específico, devolverlo como un array vacío de viajes
      if (tripsResponse.status === 404 && errorData.error === "No trips found for the given clerk_id") {
        return { trips: [], totalPages: 0, currentPage: 1 };
      }
      return { error: errorData.message || errorData.error || `Error fetching trips: ${tripsResponse.statusText}` };
    }

    // Suponemos que la API devuelve un objeto con 'trips', 'totalPages' y 'currentPage'
    interface CustomerTripsApiResponse {
      trips: ApiTrip[];
      totalPages: number;
      currentPage: number;
    }
    const apiData: CustomerTripsApiResponse = await tripsResponse.json();
    const apiTrips: ApiTrip[] = apiData.trips;
    const totalPages = apiData.totalPages;
    const currentPage = apiData.currentPage;

    // 2. Obtener nombres de clientes para cada viaje
    const uniqueCustomerIds = [...new Set(apiTrips.map(trip => trip.customer_id))];
    const customerNamesMap = new Map<string, string>();

    await Promise.all(uniqueCustomerIds.map(async (customerId) => {
      const nameResponse = await fetch(`${customerAppUrl}/api/customer/${customerId}/name`, {
        headers: {
          'x-api-key': apiSecretKey,
        },
        cache: 'no-store',
      });
      if (nameResponse.ok) {
        const nameData: ApiCustomerName = await nameResponse.json();
        customerNamesMap.set(customerId, nameData.fullname);
      } else {
        console.warn(`Could not fetch name for customer ${customerId}: ${nameResponse.statusText}`);
        customerNamesMap.set(customerId, `Cliente ${customerId}`); // Fallback
      }
    }));

    // 3. Construir los objetos Trip para la respuesta
    const tripsData: Trip[] = apiTrips.map(apiTrip => ({
      id: apiTrip.trip_id,
      tower_id: apiTrip.tower_id,
      customer: {
        customer_id: apiTrip.customer_id,
        full_name: customerNamesMap.get(apiTrip.customer_id) || 'Nombre Desconocido',
      },
      origin: apiTrip.origin,
      destination: apiTrip.destination,
      date: apiTrip.date,
      status: apiTrip.status,
      // vehicle, time, amount son opcionales y no provienen de la API actual, se omiten explícitamente.
    }));

    return { trips: tripsData, totalPages, currentPage };

  } catch (error: any) {
    console.error("Error in getTripsForUser server action:", error);
    return { error: `Failed to fetch trips: ${error.message}` };
  }
}
