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
  initialCoordinates?: Coordinates;
  onLocationChange?: (coords: Coordinates) => void; // NUEVO: Callback para emitir la ubicación
}

export default function InteractiveMap({ initialCoordinates, onLocationChange }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const driverMarker = useRef<Marker | null>(null);
  // Mantener routeSourceId y routeLayerId para cumplir con "dejar toda la lógica de trazado de rutas"
  const routeSourceId = "route";
  const routeLayerId = "route-line";

  // Usar initialCoordinates si se proporciona, de lo contrario, usar BAHIA_BLANCA_CENTER.
  const [driverLocation, setDriverLocation] = useState<Coordinates>(initialCoordinates || BAHIA_BLANCA_CENTER);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // === Inicialización del mapa ===
  useEffect(() => {
    if (map.current) return; // Inicializar el mapa solo una vez
    if (!mapContainer.current) {
      return;
    }

    // Determinar el centro inicial del mapa
    const initialCenter = initialCoordinates || BAHIA_BLANCA_CENTER;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [initialCenter.lng, initialCenter.lat], // Usar las coordenadas iniciales o el centro de Bahía Blanca
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

      // Configurar watchPosition para obtener actualizaciones continuas de la ubicación
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const userCoords = { lat: latitude, lng: longitude };
            setDriverLocation(userCoords); // Actualizar la posición del conductor
            map.current?.setCenter([longitude, latitude]);
            onLocationChange?.(userCoords); // Llama al callback con la ubicación real
          },
          (error) => {
            console.error("Mapbox: Error watching user location:", error.message, `(Code: ${error.code})`);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Ajustar según necesidad
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
        return () => { // Limpieza solo del mapa si no hay geolocation
          map.current?.remove();
          map.current = null;
        };
      }
    });

    // Limpiar el mapa al desmontar si geolocation no es compatible o no se inicializó
    return () => {
      map.current?.remove();
      map.current = null; // También limpia la referencia
    };
  }, [initialCoordinates, onLocationChange]); // Añadir onLocationChange como dependencia

  // === Función para dibujar la ruta ===
  // Se mantiene para futuras implementaciones de rutas reales, pero no se utiliza en esta versión.
  const drawRoute = useCallback(async (origin: Coordinates, destination: Coordinates) => {
    if (!map.current || !isMapLoaded) return null;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;

    try {
      const query = await fetch(url, { method: "GET" });
      const json = await query.json();
      
      const data = json.routes && json.routes.length > 0 ? json.routes[0] : null;

      if (!data || !data.geometry || !data.geometry.coordinates || data.geometry.coordinates.length === 0) {
        console.error("Mapbox: No se encontró una ruta válida o la geometría está incompleta. Origen:", origin, "Destino:", destination, "Respuesta API:", json);
        clearRoute();
        return null;
      }

      const route = data.geometry;

      const routeSource = map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
      if (routeSource) {
        routeSource.setData(route);
        map.current.setPaintProperty(routeLayerId, 'line-color', '#FFC107'); // Color para la ruta
      }

      const bounds = new mapboxgl.LngLatBounds();
      for (const coord of route.coordinates) {
        bounds.extend(coord as mapboxgl.LngLatLike);
      }
      map.current.fitBounds(bounds, {
        padding: 100,
        duration: 1000,
      });

      return {
        type: "Feature",
        geometry: route,
        properties: {},
      } as GeoJSON.Feature<GeoJSON.LineString>;
    } catch (error) {
      console.error("Mapbox: Error al obtener o dibujar la ruta:", error);
      clearRoute();
      return null;
    }
  }, [isMapLoaded]);

  // === Función para borrar la ruta ===
  // Se mantiene para futuras implementaciones de rutas reales, pero no se utiliza en esta versión.
  const clearRoute = useCallback(() => {
    if (!map.current || !isMapLoaded) return;
    const routeSource = map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource;
    if (routeSource) {
      routeSource.setData({
        type: "FeatureCollection",
        features: [],
      });
      map.current.setPaintProperty(routeLayerId, 'line-color', '#888'); // Restablecer color por defecto
    }
  }, [isMapLoaded]);


  // Asegurarse de que el marcador del conductor esté siempre en `driverLocation`
  useEffect(() => {
    if (driverMarker.current) {
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);
      // Opcional: Centrar el mapa en la ubicación del conductor al inicio o al cambiar drásticamente
      // map.current?.flyTo({ center: [driverLocation.lng, driverLocation.lat], zoom: map.current.getZoom() });
    }
  }, [driverLocation]);


  return <div ref={mapContainer} className="w-full h-full relative overflow-hidden" data-testid="mapbox-container" />;
}
