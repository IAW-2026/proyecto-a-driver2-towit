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
}

interface InteractiveMapProps {
  isAvailable: boolean;
  setIsAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  currentRequest: ServiceRequest | null;
  setCurrentRequest: React.Dispatch<React.SetStateAction<ServiceRequest | null>>;
  acceptedTrip: ServiceRequest | null;
  setAcceptedTrip: React.Dispatch<React.SetStateAction<ServiceRequest | null>>;
  onTripEnd: () => void;
}

export default function InteractiveMap({
  isAvailable,
  setIsAvailable,
  currentRequest,
  setCurrentRequest,
  acceptedTrip,
  setAcceptedTrip,
  onTripEnd,
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const driverMarker = useRef<Marker | null>(null);
  const routeSourceId = "route";
  const routeLayerId = "route-line";

  // Estado local para la posición actual del conductor
  const [driverLocation, setDriverLocation] = useState<Coordinates>(BAHIA_BLANCA_CENTER); // Valor inicial, será actualizado por geolocalización
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`,
      { method: "GET" }
    );
    const json = await query.json();
    const data = json.routes[0];
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

    return route; // Devolver la ruta GeoJSON para la simulación
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
  }, [isMapLoaded]); // Añadir isMapLoaded a las dependencias

  // === Simulación del movimiento del conductor ===
  const SIMULATION_TOTAL_DURATION = 10000; // 10 segundos
  const SIMULATION_UPDATE_INTERVAL = 100; // Actualizar cada 100 ms

  const simulateDriverMovement = useCallback((route: GeoJSON.Feature<GeoJSON.LineString>) => {
    if (!map.current || !driverMarker.current) return;

    // isAvailable ya debería ser false al aceptar el viaje en ServicePageClient

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
        clearRoute();
        onTripEnd(); // Notificar al componente padre que el viaje ha terminado (4. la ruta se borre al llegar al destino y vuelva a estado disponible)
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

    return () => clearInterval(animation); // Función de limpieza
  }, [clearRoute, onTripEnd]);

  // === Efecto para manejar solicitudes entrantes (OMITIDO TEMPORALMENTE) ===
  useEffect(() => {
    // La lógica de solicitudes está omitida temporalmente según el requerimiento del usuario.
    // if (currentRequest && isAvailable && isMapLoaded && map.current && driverMarker.current) {
    //   drawRoute(driverLocation, currentRequest.originCoordinates);
    // } else if (!currentRequest && !acceptedTrip && isMapLoaded) {
    //   clearRoute();
    // }
  }, [currentRequest, isAvailable, driverLocation, drawRoute, clearRoute, acceptedTrip, isMapLoaded]);

  // === Efecto para manejar el viaje aceptado (OMITIDO TEMPORALMENTE) ===
  useEffect(() => {
    // La lógica de viaje aceptado está omitida temporalmente según el requerimiento del usuario.
    // let cleanupSim: (() => void) | undefined;
    // if (acceptedTrip && isMapLoaded && map.current && driverMarker.current) {
    //   async function startTripSimulation() {
    //     const route = await drawRoute(driverLocation, acceptedTrip!.originCoordinates);
    //     if (route) {
    //       cleanupSim = simulateDriverMovement(route);
    //     }
    //   }
    //   startTripSimulation();
    // }
    // return () => {
    //   if (cleanupSim) cleanupSim();
    // };
  }, [acceptedTrip, driverLocation, drawRoute, simulateDriverMovement, isMapLoaded]);

  // Asegurarse de que el marcador del conductor esté siempre en `driverLocation`
  useEffect(() => {
    if (driverMarker.current) {
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);
    }
  }, [driverLocation]);


  return <div ref={mapContainer} className="w-full h-full relative overflow-hidden" data-testid="mapbox-container" />;
}
