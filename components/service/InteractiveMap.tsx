"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl, { Map, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
// No se necesita `polyline` de @mapbox/polyline directamente para GeoJSON, Mapbox GL JS lo maneja.

// Definir las coordenadas del centro de Bahía Blanca
const BAHIA_BLANCA_CENTER = { lat: -38.7196, lng: -62.2651 }; // Plaza Rivadavia

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Coordinates {
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  initialCenter: Coordinates;
  routeStart?: Coordinates | null; // Inicio de la primera ruta (Ubicación del Tower)
  routeEnd?: Coordinates | null;   // Fin de la primera ruta / Inicio de la segunda (Origen del Viaje)
  tripDestination?: Coordinates | null; // Fin de la segunda ruta (Destino final del Viaje)
  isTripActive: boolean; // NUEVO: Para indicar si hay un viaje en curso
}

export default function InteractiveMap({ initialCenter, routeStart, routeEnd, tripDestination, isTripActive }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const driverMarker = useRef<Marker | null>(null);
  const originMarker = useRef<Marker | null>(null); // NUEVO: Marcador para el origen del viaje
  const destinationMarker = useRef<Marker | null>(null); // NUEVO: Marcador para el destino del viaje

  // Identificadores para las fuentes y capas de las dos partes de la ruta
  const routeToOriginSourceId = "routeToOrigin";
  const routeToOriginLayerId = "routeToOrigin-line";
  const routeToDestinationSourceId = "routeToDestination";
  const routeToDestinationLayerId = "routeToDestination-line";

  const [driverLocation, setDriverLocation] = useState<Coordinates>(initialCenter);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasInitialLocationZoomed, setHasInitialLocationZoomed] = useState(false);
  const [isRouteDrawn, setIsRouteDrawn] = useState(false); // NUEVO: Bandera para controlar si las rutas están dibujadas
  
  // === Inicialización del mapa ===
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [initialCenter.lng, initialCenter.lat], // Centrado inicial con la prop
      zoom: 17, // Zoom inicial más cercano (punto 1)
      pitch: 45,
    });

    map.current.on("load", () => {
      // Agregar fuentes y capas para las dos rutas
      map.current!.addSource(routeToOriginSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.current!.addLayer({
        id: routeToOriginLayerId,
        type: "line",
        source: routeToOriginSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#FFC107", // Amarillo para Tower -> Origen del viaje
          "line-width": 6,
          "line-opacity": 0.75,
        },
      });

      map.current!.addSource(routeToDestinationSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.current!.addLayer({
        id: routeToDestinationLayerId,
        type: "line",
        source: routeToDestinationSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#2196F3", // Azul para Origen del viaje -> Destino final
          "line-width": 6,
          "line-opacity": 0.75,
        },
      });

      // NUEVO: Función auxiliar para crear elementos de marcador personalizados
      const createCustomMarkerElement = (color: string) => {
        const el = document.createElement('div');
        el.style.backgroundColor = color;
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
        return el;
      };

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

      // Configurar watchPosition para obtener actualizaciones continuas de la ubicación
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const userCoords = { lat: latitude, lng: longitude };
            setDriverLocation(userCoords); // Actualizar la posición del conductor
            // Opcional: Centrar el mapa en el conductor cuando se mueve. Esta lógica se moverá a otro useEffect.
          },
          (error) => {
            console.error("Mapbox: Error watching user location:", error.message, `(Code: ${error.code})`);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        // Limpiar watchPosition al desmontar el componente
        return () => {
          map.current?.remove();
          map.current = null;
          navigator.geolocation.clearWatch(watchId);
        };
      } else {
        console.log("Mapbox: Geolocation is not supported by this browser.");
        map.current?.flyTo({ center: [BAHIA_BLANCA_CENTER.lng, BAHIA_BLANCA_CENTER.lat], zoom: 12, speed: 1.2 });
        return () => {
          map.current?.remove();
          map.current = null;
        };
      }
    });

    // Limpiar el mapa al desmontar
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // NUEVO EFECTO: Centrado en la ubicación real del conductor una vez (punto 1)
  useEffect(() => {
    if (isMapLoaded && driverLocation && !hasInitialLocationZoomed) {
      console.log("InteractiveMap: Centering on initial driver location with zoom 16.");
      map.current?.flyTo({
        center: [driverLocation.lng, driverLocation.lat],
        zoom: 16, // Zoom para la ubicación real
        essential: true, // Asegura que se complete la animación
      });
      setHasInitialLocationZoomed(true);
    }
  }, [isMapLoaded, driverLocation, hasInitialLocationZoomed]);

  // === Función para borrar todas las rutas y marcadores de viaje ===
  const clearRoutesAndMarkers = useCallback(() => {
    if (!map.current || !isMapLoaded) return;

    const source1 = map.current.getSource(routeToOriginSourceId) as mapboxgl.GeoJSONSource;
    if (source1) {
      source1.setData({ type: "FeatureCollection", features: [] });
    }
    const source2 = map.current.getSource(routeToDestinationSourceId) as mapboxgl.GeoJSONSource;
    if (source2) {
      source2.setData({ type: "FeatureCollection", features: [] });
    }

    if (originMarker.current) {
      originMarker.current.remove();
      originMarker.current = null;
    }
    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }
    setIsRouteDrawn(false); // NUEVO: Las rutas han sido limpiadas
    console.log("InteractiveMap: Rutas y marcadores de viaje limpiados.");
  }, [isMapLoaded]);

  // === Función para dibujar la ruta compleja (Tower -> Origen -> Destino) ===
  const drawComplexRoute = useCallback(async (towerLocation: Coordinates, tripOrigin: Coordinates, tripDestination: Coordinates) => {
    if (!map.current || !isMapLoaded) return null;

    // Solo limpiar si no están ya limpias para evitar llamadas redundantes si la prop isRouteDrawn ya es false
    if (isRouteDrawn) {
        clearRoutesAndMarkers();
    }

    try {
      // Ruta 1: Tower al Origen del Viaje
      const url1 = `https://api.mapbox.com/directions/v5/mapbox/driving/${towerLocation.lng},${towerLocation.lat};${tripOrigin.lng},${tripOrigin.lat}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;
      const query1 = await fetch(url1);
      const json1 = await query1.json();
      const route1 = json1.routes && json1.routes.length > 0 ? json1.routes[0].geometry : null;

      // Ruta 2: Origen del Viaje al Destino Final
      const url2 = `https://api.mapbox.com/directions/v5/mapbox/driving/${tripOrigin.lng},${tripOrigin.lat};${tripDestination.lng},${tripDestination.lat}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;
      const query2 = await fetch(url2);
      const json2 = await query2.json();
      const route2 = json2.routes && json2.routes.length > 0 ? json2.routes[0].geometry : null;

      if (!route1 || !route2) {
        console.error("Mapbox: No se encontró una o ambas rutas válidas.");
        clearRoutesAndMarkers();
        return null;
      }

      const source1 = map.current.getSource(routeToOriginSourceId) as mapboxgl.GeoJSONSource;
      if (source1) source1.setData(route1);

      const source2 = map.current.getSource(routeToDestinationSourceId) as mapboxgl.GeoJSONSource;
      if (source2) source2.setData(route2);

      // NUEVO: Re-declarar createCustomMarkerElement aquí para asegurar que siempre esté disponible en el useCallback
      const createCustomMarkerElement = (color: string) => {
        const el = document.createElement('div');
        el.style.backgroundColor = color;
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
        return el;
      };

      // NUEVO: Añadir marcadores para el origen y el destino del viaje (punto 2)
      if (originMarker.current) {
        originMarker.current.setLngLat([tripOrigin.lng, tripOrigin.lat]);
      } else {
        originMarker.current = new mapboxgl.Marker({
          element: createCustomMarkerElement('#FF0000'), // Rojo para el origen del viaje
          anchor: 'center',
        })
          .setLngLat([tripOrigin.lng, tripOrigin.lat])
          .addTo(map.current!);
      }

      if (destinationMarker.current) {
        destinationMarker.current.setLngLat([tripDestination.lng, tripDestination.lat]);
      } else {
        destinationMarker.current = new mapboxgl.Marker({
          element: createCustomMarkerElement('#00FF00'), // Verde para el destino del viaje
          anchor: 'center',
        })
          .setLngLat([tripDestination.lng, tripDestination.lat])
          .addTo(map.current!);
      }

      // Calcular límites combinados para ambas rutas (punto 2)
      const bounds = new mapboxgl.LngLatBounds();
      route1.coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
      route2.coordinates.forEach((coord: [number, number]) => bounds.extend(coord));

      map.current.fitBounds(bounds, {
        padding: 100, // Margen alrededor de la ruta
        duration: 1500,
      });
      setIsRouteDrawn(true); // NUEVO: Las rutas se han dibujado correctamente
      console.log("InteractiveMap: Rutas y marcadores dibujados, mapa ajustado.");

      return true;
    } catch (error) {
      console.error("Mapbox: Error al obtener o dibujar la ruta:", error);
      clearRoutesAndMarkers(); // En caso de error, limpiar y resetear la bandera
      return null;
    }
  }, [isMapLoaded, clearRoutesAndMarkers, isRouteDrawn]); // Añadir isRouteDrawn a las dependencias, ya que se usa en la lógica de si limpiar o no.


  // Efecto para dibujar o limpiar la ruta según las props de la oferta o el estado del viaje (punto 1 y 2)
  useEffect(() => {
    const hasActiveRouteData = routeStart && routeEnd && tripDestination;

    // Solo dibujar si hay datos de ruta y AÚN NO se ha dibujado (o la ruta ha cambiado y force Redraw)
    if (isMapLoaded && hasActiveRouteData && !isRouteDrawn) { // NUEVO: Añadir !isRouteDrawn
      console.log("InteractiveMap: Se detectaron datos de ruta activa y las rutas NO están dibujadas. Dibujando rutas.");
      drawComplexRoute(routeStart, routeEnd, tripDestination);
    }
    // Siempre limpiar si no hay datos de ruta y SÍ están dibujadas
    else if (isMapLoaded && !hasActiveRouteData && isRouteDrawn) { // NUEVO: Añadir isRouteDrawn
      console.log("InteractiveMap: No hay datos de ruta activa y las rutas ESTÁN dibujadas. Limpiando rutas y marcadores.");
      clearRoutesAndMarkers();
    }
  }, [routeStart, routeEnd, tripDestination, isMapLoaded, drawComplexRoute, clearRoutesAndMarkers, isRouteDrawn]); // Añadir isRouteDrawn a las dependencias


  // Asegurarse de que el marcador del conductor esté siempre en `driverLocation`
  // Y controlar el centrado del mapa (punto 3 y 4)
  useEffect(() => {
    if (!map.current || !driverMarker.current || !isMapLoaded) return;

    driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);

    const hasAnyRouteData = routeStart && routeEnd && tripDestination;

    // Lógica de centrado:
    // Centrar en el conductor si hay un viaje activo (y las rutas persisten)
    // O si no hay rutas dibujadas (ni oferta ni viaje), lo que implica que la tarjeta de oferta no está activa.
    if (isTripActive || !hasAnyRouteData) {
      console.log(`InteractiveMap: Centrando en conductor. isTripActive: ${isTripActive}, hasAnyRouteData: ${hasAnyRouteData}`);
      map.current?.flyTo({
        center: [driverLocation.lng, driverLocation.lat],
        zoom: map.current.getZoom() < 16 ? 16 : map.current.getZoom(), // Mantener zoom 16 o actual si es mayor
        duration: 1000,
        essential: true,
      });
    } else {
      console.log("InteractiveMap: Centrado manejado por ajuste de rutas o no hay necesidad de centrar en conductor.");
    }
  }, [driverLocation, isMapLoaded, isTripActive, routeStart, routeEnd, tripDestination]); // Añadimos dependencias para controlar el re-render


  return <div ref={mapContainer} className="w-full h-full relative overflow-hidden" data-testid="mapbox-container" />;
}
