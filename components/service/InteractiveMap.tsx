"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl, { Map, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
// No se necesita `polyline` de @mapbox/polyline directamente para GeoJSON, Mapbox GL JS lo maneja.

// Definir las coordenadas del centro de Bahía Blanca
const BAHIA_BLANCA_CENTER = { lat: -38.7196, lng: -62.2651 }; // Plaza Rivadavia

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Coordinates {
  lat: number;
  lng: number;
}

interface ServiceRequest {
  tripId: string;
  customerName: string;
  customerRating?: number;
  vehicleModel: string;
  vehiclePlate: string;
  originAddress: string;
  serviceValue: number;
  originCoordinates: Coordinates;
  destinationAddress: string; // Nuevo campo
  destinationCoordinates: Coordinates; // Nuevo campo
}

interface InteractiveMapProps {
  isAvailable: boolean;
  setIsAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  currentRequest: ServiceRequest | null;
  setCurrentRequest: React.Dispatch<React.SetStateAction<ServiceRequest | null>>;
  acceptedTrip: ServiceRequest | null;
  setAcceptedTrip: React.Dispatch<React.SetStateAction<ServiceRequest | null>>;
  onTripEnd: () => void;
  currentTripStage: 'idle' | 'to_origin' | 'to_destination'; // Estado elevado
  setCurrentTripStage: React.Dispatch<React.SetStateAction<'idle' | 'to_origin' | 'to_destination'>>; // Setter elevado
}

export default function InteractiveMap({
  isAvailable,
  setIsAvailable,
  currentRequest,
  setCurrentRequest,
  acceptedTrip,
  setAcceptedTrip,
  onTripEnd,
  currentTripStage, // Recibido como prop
  setCurrentTripStage, // Recibido como prop
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const driverMarker = useRef<Marker | null>(null);
  const destinationMarker = useRef<Marker | null>(null);
  const routeSourceId = "route";
  const routeLayerId = "route-line";

  const [driverLocation, setDriverLocation] = useState<Coordinates>(BAHIA_BLANCA_CENTER);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const currentTripStageRef = useRef(currentTripStage); // Ref para acceder al estado más reciente
  
  useEffect(() => {
    currentTripStageRef.current = currentTripStage;
  }, [currentTripStage]); // Sincronizar el ref con la prop

  // === Inicialización del mapa ===
  useEffect(() => {
    if (map.current) return; // Inicializar el mapa solo una vez
    if (!mapContainer.current) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [BAHIA_BLANCA_CENTER.lng, BAHIA_BLANCA_CENTER.lat],
      zoom: 12,
      pitch: 45,
    });

    map.current.on("load", () => {
      // Agregar una fuente y capa para la ruta
      map.current!.addSource(routeSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.current!.addLayer({
        id: routeLayerId,
        type: "line",
        source: routeSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#888", // Color por defecto, se actualizará
          "line-width": 6,
          "line-opacity": 0.75,
        },
      });

      // Agregar marcador del conductor
      const el = document.createElement('div');
      el.style.backgroundColor = '#007bff'; // Círculo azul para el conductor
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #fff';
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.5)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#fff';
      el.style.fontWeight = 'bold';
      // Puedes reemplazar con un icono real si lo deseas, ej: el.style.backgroundImage = 'url(/driver-icon.png)';

      driverMarker.current = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map.current!);

      setIsMapLoaded(true); // El mapa y sus fuentes/capas están listos
    });

    // Limpiar al desmontar
    return () => {
      map.current?.remove();
      map.current = null; // También limpia la referencia
    };
  }, []);

  // === Obtener ubicación del usuario al cargar el mapa ===
  useEffect(() => {
    if (!isMapLoaded) return; // Asegurarse de que el mapa esté cargado antes de obtener la ubicación

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userCoords = { lat: latitude, lng: longitude };
          setDriverLocation(userCoords); // Actualizar la posición inicial del conductor
          map.current?.flyTo({ center: [longitude, latitude], zoom: 14, speed: 1.2 }); // Centrar y hacer zoom al usuario
        },
        (error) => {
          console.error("Mapbox: Error getting user location:", error);
          // Si falla la geolocalización, el marcador ya estará en BAHIA_BLANCA_CENTER
          map.current?.flyTo({ center: [BAHIA_BLANCA_CENTER.lng, BAHIA_BLANCA_CENTER.lat], zoom: 12, speed: 1.2 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.log("Mapbox: Geolocation is not supported by this browser.");
      // Si no hay soporte, el marcador ya estará en BAHIA_BLANCA_CENTER
      map.current?.flyTo({ center: [BAHIA_BLANCA_CENTER.lng, BAHIA_BLANCA_CENTER.lat], zoom: 12, speed: 1.2 });
    }
  }, [isMapLoaded]); // Ejecutar solo cuando el mapa esté completamente cargado

  // === Función para dibujar la ruta ===
  const drawRoute = useCallback(async (origin: Coordinates, destination: Coordinates) => {
    if (!map.current || !isMapLoaded) return; // Añadir verificación de isMapLoaded

    // Ajustar el orden de las coordenadas para la API de Mapbox (lng, lat)
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;
    // console.log("Mapbox: Requesting route for:", `Origin: (${origin.lng}, ${origin.lat})`, `Destination: (${destination.lng}, ${destination.lat})`);
    // console.log("Mapbox: API URL:", url);

    const query = await fetch(url, { method: "GET" });
    const json = await query.json();
    // console.log("Mapbox: Raw API response:", json);
    
    const data = json.routes && json.routes.length > 0 ? json.routes[0] : null;

    if (!data || !data.geometry || !data.geometry.coordinates || data.geometry.coordinates.length === 0) {
      console.error("Mapbox: No se encontró una ruta válida o la geometría está incompleta. Origen:", origin, "Destino:", destination, "Respuesta API:", json);
      clearRoute(); // Limpiar cualquier ruta o marcador existente en caso de error
      return null; // Devolver null si no hay ruta válida
    }

    const route = data.geometry; // Ya es GeoJSON LineString

    const routeSource = map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
    if (routeSource) {
      routeSource.setData(route);
      map.current.setPaintProperty(routeLayerId, 'line-color', '#FFC107'); // Amarillo para la ruta activa
    }

    // Ajustar el mapa para que muestre la ruta completa
    const bounds = new mapboxgl.LngLatBounds();
    for (const coord of route.coordinates) {
      bounds.extend(coord as mapboxgl.LngLatLike);
    }
    map.current.fitBounds(bounds, {
      padding: 100,
      duration: 1000,
    });

    // Añadir marcador de destino (diferente color)
    if (destinationMarker.current) {
      destinationMarker.current.remove(); // Limpiar el marcador anterior si existe
    }
    const destinationEl = document.createElement('div');
    destinationEl.style.backgroundColor = '#dc3545'; // Rojo para el destino
    destinationEl.style.width = '24px';
    destinationEl.style.height = '24px';
    destinationEl.style.borderRadius = '50%';
    destinationEl.style.border = '2px solid #fff';
    destinationEl.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.5)';
    destinationEl.style.display = 'flex';
    destinationEl.style.alignItems = 'center';
    destinationEl.style.justifyContent = 'center';

    destinationMarker.current = new mapboxgl.Marker({
      element: destinationEl,
      anchor: 'center',
    })
      .setLngLat([destination.lng, destination.lat])
      .addTo(map.current!);

    // Devolver la ruta envuelta en un Feature de GeoJSON para que coincida con la expectativa
    return {
      type: "Feature",
      geometry: route, // 'route' es ya un GeoJSON.LineString
      properties: {},
    } as GeoJSON.Feature<GeoJSON.LineString>; // Cast explícito al tipo esperado
  }, [isMapLoaded]); // Añadir isMapLoaded a las dependencias

  // === Función para borrar la ruta ===
  const clearRoute = useCallback(() => {
    if (!map.current || !isMapLoaded) return; // Asegurarse de que el mapa esté cargado
    const routeSource = map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
    if (routeSource) {
      routeSource.setData({
        type: "FeatureCollection",
        features: [],
      });
      map.current.setPaintProperty(routeLayerId, 'line-color', '#888'); // Restablecer color por defecto
    }
    // Eliminar también el marcador de destino
    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }
  }, [isMapLoaded]); // Añadir isMapLoaded a las dependencias

  // === Simulación del movimiento del conductor ===
  const SIMULATION_TOTAL_DURATION = 10000; // 10 segundos
  const SIMULATION_UPDATE_INTERVAL = 100; // Actualizar cada 100 ms

  const simulateDriverMovement = useCallback((route: GeoJSON.Feature<GeoJSON.LineString>) => {
    if (!map.current || !driverMarker.current) return;

    // isAvailable ya debería ser false al aceptar el viaje en ServicePageClient

    // Asegurarse de que route.geometry.coordinates existe antes de usarlo
    if (!route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length === 0) {
      console.error("Mapbox: Error en simulateDriverMovement: la ruta recibida no tiene coordenadas válidas.");
      onTripEnd(); // Terminar el viaje si la ruta es inválida
      return;
    }

    const line = turf.lineString(route.geometry.coordinates);
    const totalDistance = turf.length(line, { units: 'kilometers' });
    const steps = SIMULATION_TOTAL_DURATION / SIMULATION_UPDATE_INTERVAL;
    let currentStep = 0;

    const animation = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(animation);
        const finalPosition = route.geometry.coordinates[route.geometry.coordinates.length - 1];
        setDriverLocation({ lng: finalPosition[0], lat: finalPosition[1] }); // Posición final
        driverMarker.current!.setLngLat(finalPosition as mapboxgl.LngLatLike);

        // Usar el ref para obtener el estado más reciente de currentTripStage
        if (currentTripStageRef.current === 'to_origin') {
          // Llegó al origen del servicio, ahora ir al destino final
          console.log("Mapbox: Llegada al origen del servicio. Transicionando a 'to_destination'."); // Mensaje de transición
          setCurrentTripStage('to_destination'); // Cambiar el estado para iniciar la segunda etapa
          // La ruta no se limpia aquí, permanece en el mapa como se pidió.
        } else if (currentTripStageRef.current === 'to_destination') {
          // Llegó al destino final
          console.log("Mapbox: Llegada al destino final. Viaje completado. Reseteando a 'idle'.");
          clearRoute(); // Limpiar la ruta y el marcador de destino
          onTripEnd(); // Notificar al padre que el viaje completo ha terminado (vuelve a disponible)
          setCurrentTripStage('idle'); // Restablecer el estado
        }
        return;
      }

      const distanceCovered = (currentStep / steps) * totalDistance;
      const along = turf.along(line, distanceCovered, { units: 'kilometers' });
      const newLngLat = along.geometry.coordinates as [number, number];

      setDriverLocation({ lng: newLngLat[0], lat: newLngLat[1] });
      driverMarker.current!.setLngLat(newLngLat as mapboxgl.LngLatLike);

      // Centrar el mapa en el conductor (opcional, depende de la UX deseada)
      // map.current!.setCenter(newLngLat as mapboxgl.LngLatLike);

      currentStep++;
    }, SIMULATION_UPDATE_INTERVAL);

    return () => clearInterval(animation);
  }, [clearRoute, onTripEnd, setCurrentTripStage, currentTripStageRef]);

  // === Efecto para manejar solicitudes entrantes (dibujar ruta al origen de la solicitud) ===
  useEffect(() => {
    // Solo dibujar o limpiar ruta de solicitud si no hay un viaje activo
    if (currentTripStage === 'idle') {
      if (currentRequest && isAvailable && isMapLoaded && map.current && driverMarker.current) {
        // Al recibir una solicitud, se traza la ruta desde su ubicación en el mapa hacia la ubicación de la solicitud
        drawRoute(driverLocation, currentRequest.originCoordinates);
      } else if (!currentRequest && !acceptedTrip && isMapLoaded) {
        // Si no hay solicitud actual y no hay viaje aceptado, limpiar cualquier ruta existente
        clearRoute();
      }
    }
  }, [currentRequest, isAvailable, driverLocation, drawRoute, clearRoute, acceptedTrip, isMapLoaded, currentTripStage]);

  // === Efecto para manejar el inicio del viaje (primera etapa: al origen del servicio) ===
  useEffect(() => {
    let cleanupSim: (() => void) | undefined;

    // Solo iniciar si hay un acceptedTrip, el mapa está cargado y NO estamos ya en un viaje
    if (acceptedTrip && isMapLoaded && map.current && driverMarker.current && currentTripStage === 'idle') {
      setCurrentTripStage('to_origin'); // Establecer la primera etapa del viaje

      async function startFirstLegSimulation() {
        const originCoords = driverLocation; // Ubicación actual del conductor
        const destinationCoords = acceptedTrip!.originCoordinates; // Origen del servicio

        const route = await drawRoute(originCoords, destinationCoords);

        if (route && route.geometry && route.geometry.coordinates) {
          cleanupSim = simulateDriverMovement(route);
        } else {
          console.error("Mapbox: No se pudo iniciar la simulación de la PRIMERA ETAPA: Ruta inválida o incompleta.");
          onTripEnd(); // Finalizar el "viaje" si no se puede simular
          setCurrentTripStage('idle'); // Restablecer estado
        }
      }
      startFirstLegSimulation();
    }

    return () => {
      if (cleanupSim) cleanupSim();
    };
  }, [acceptedTrip, isMapLoaded, currentTripStage, drawRoute, simulateDriverMovement, onTripEnd, driverLocation, setCurrentTripStage]); // Añadir driverLocation y setCurrentTripStage

  // === Efecto para manejar la segunda etapa del viaje (al destino final del servicio) ===
  useEffect(() => {
    let cleanupSim: (() => void) | undefined;
    if (currentTripStage === 'to_destination' && acceptedTrip && isMapLoaded && map.current && driverMarker.current) {
      console.log("Mapbox: Iniciando cuenta atrás de 2 segundos para el viaje al destino final...");
      const delayTimeout = setTimeout(async () => {
        console.log("Mapbox: Iniciando simulación del viaje al destino final.");
        // Dibujar la ruta desde el ORIGEN del servicio (donde está ahora) hasta el DESTINO final del servicio
        const originCoords = acceptedTrip.originCoordinates; // El conductor está en el origen del servicio
        const destinationCoords = acceptedTrip.destinationCoordinates; // Destino final del servicio

        const route = await drawRoute(originCoords, destinationCoords);

        if (route && route.geometry && route.geometry.coordinates) {
          cleanupSim = simulateDriverMovement(route);
        } else {
          console.error("Mapbox: No se pudo iniciar la simulación de la SEGUNDA ETAPA: Ruta inválida o incompleta.");
          onTripEnd(); // Finalizar el "viaje" si no se puede simular
          setCurrentTripStage('idle'); // Restablecer estado
        }
      }, 2000); // Esperar 2 segundos

      return () => {
        clearTimeout(delayTimeout);
        if (cleanupSim) cleanupSim();
      };
    }
  }, [currentTripStage, acceptedTrip, isMapLoaded, drawRoute, simulateDriverMovement, onTripEnd, setCurrentTripStage]);


  // Asegurarse de que el marcador del conductor esté siempre en `driverLocation`
  useEffect(() => {
    if (driverMarker.current) {
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);
    }
  }, [driverLocation]);


  return <div ref={mapContainer} className="w-full h-full relative overflow-hidden" data-testid="mapbox-container" />;
}
