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
  userLocation?: Coordinates | null;
  routeStart?: Coordinates | null; // La ubicación actual del conductor (dinámica)
  routeEnd?: Coordinates | null; // El objetivo de la etapa actual (origen del viaje o destino final)
  tripDestination?: Coordinates | null; // El destino final del viaje (estático para contexto)
  isTripActive: boolean;
  isEnRouteToDestination: boolean; // NUEVO: True si ya se confirmó el inicio del viaje (yendo a destino final)
}

export default function InteractiveMap({ userLocation, routeStart, routeEnd, tripDestination, isTripActive, isEnRouteToDestination }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const driverMarker = useRef<Marker | null>(null);
  const originMarker = useRef<Marker | null>(null);
  const destinationMarker = useRef<Marker | null>(null);

  // NUEVO: Referencias para almacenar las geometrías de las rutas completas
  const fullRouteActiveLegRef = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(null); // Ruta completa para la etapa activa (Ej: driver -> origin, o driver -> destination)
  const fullRouteTripContextRef = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(null); // Ruta completa para el contexto del viaje (Ej: origin -> destination)

  // Identificadores para las fuentes y capas
  // RENOMBRADOS para mayor claridad
  const activeLegRouteSourceId = "activeLegRoute";
  const activeLegRouteLayerId = "activeLegRoute-line";
  const tripContextRouteSourceId = "tripContextRoute";
  const tripContextRouteLayerId = "tripContextRoute-line";

  const [driverLocation, setDriverLocation] = useState<Coordinates>(BAHIA_BLANCA_CENTER); // Inicializa con la ubicación por defecto
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isRouteDrawn, setIsRouteDrawn] = useState(false);
  
  // === Inicialización del mapa ===
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: [BAHIA_BLANCA_CENTER.lng, BAHIA_BLANCA_CENTER.lat], // Centrado inicial por defecto
      zoom: 12, // Zoom inicial por defecto
      pitch: 45,
    });

    map.current.on("load", () => {
      // Agregar fuentes y capas para las dos rutas
      map.current!.addSource(activeLegRouteSourceId, { // ID RENOMBRADO
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.current!.addLayer({
        id: activeLegRouteLayerId, // ID RENOMBRADO
        type: "line",
        source: activeLegRouteSourceId, // ID RENOMBRADO
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#FFC107", // Amarillo para la ruta activa del conductor
          "line-width": 6,
          "line-opacity": 0.75,
        },
      });

      map.current!.addSource(tripContextRouteSourceId, { // ID RENOMBRADO
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.current!.addLayer({
        id: tripContextRouteLayerId, // ID RENOMBRADO
        type: "line",
        source: tripContextRouteSourceId, // ID RENOMBRADO
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#2196F3", // Azul para la ruta de contexto (Origen del viaje -> Destino final)
          "line-width": 6,
          "line-opacity": 0.5, // Menor opacidad para la ruta de contexto
        },
      });

      setIsMapLoaded(true); // El mapa y sus fuentes/capas están listos
    });

    // Limpiar el mapa al desmontar
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Función auxiliar para crear elementos de marcador personalizados (movida al scope del componente)
  const createCustomMarkerElement = useCallback((color: string) => {
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
  }, []);

  // NUEVO: Función auxiliar para obtener la parte restante de una ruta
  // Esta es una implementación simplificada. Para rutas complejas y alta precisión, se recomienda Turf.js.
  const getRemainingRoute = useCallback((
    fullRoute: GeoJSON.Feature<GeoJSON.LineString> | null,
    currentLocation: Coordinates
  ): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (!fullRoute || !currentLocation || !fullRoute.geometry || !fullRoute.geometry.coordinates || fullRoute.geometry.coordinates.length < 2) {
      return null;
    }

    const routeCoords = fullRoute.geometry.coordinates;
    let closestPointIndex = 0;
    let minDistance = Infinity;

    // Encuentra el punto más cercano en la ruta completa a la ubicación actual del conductor
    for (let i = 0; i < routeCoords.length; i++) {
      const [lng, lat] = routeCoords[i];
      const dist = Math.sqrt(
        Math.pow(lng - currentLocation.lng, 2) +
        Math.pow(lat - currentLocation.lat, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestPointIndex = i;
      }
    }

    // Si el conductor está muy cerca del final de la ruta, consideramos que la ruta ha terminado
    if (closestPointIndex >= routeCoords.length - 1 && minDistance < 50 / 111139) { // ~50 meters in degrees lat/lng
        return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } };
    }


    // Crea una nueva LineString desde el punto más cercano hasta el final de la ruta
    const remainingCoords = routeCoords.slice(closestPointIndex);
    // Inserta la ubicación actual del conductor como el primer punto para una transición suave
    remainingCoords.unshift([currentLocation.lng, currentLocation.lat]);

    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: remainingCoords,
      },
    };
  }, []);

  // NUEVO: Función auxiliar para actualizar los marcadores de origen y destino
  const updateTripMarkers = useCallback((
    driverLoc: Coordinates | null,
    tripOrigin: Coordinates | null, // Puede ser null si ya se pasó el origen
    tripDestination: Coordinates | null,
    isTripActive: boolean,
    isEnRouteToDestination: boolean
  ) => {
      if (!map.current || !isMapLoaded) return;

      // Marcador de Origen del Viaje (si aplica)
      if (tripOrigin && (!isTripActive || (isTripActive && !isEnRouteToDestination))) { // Mostrar si es oferta o si estamos yendo al origen
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
      } else if (originMarker.current) {
          originMarker.current.remove();
          originMarker.current = null;
      }

      // Marcador de Destino Final del Viaje
      if (tripDestination) {
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
      } else if (destinationMarker.current) {
          destinationMarker.current.remove();
          destinationMarker.current = null;
      }

  }, [isMapLoaded, createCustomMarkerElement]);

  // === Efecto para manejar la ubicación del usuario (prop userLocation) ===
  // Solo añadir/mover el marcador del conductor. El centrado es gestionado por el useEffect de rutas.
  useEffect(() => {
    if (!map.current || !isMapLoaded || !userLocation) {
      // Si no hay userLocation, asegúrate de que el marcador no se muestre
      if (driverMarker.current) {
        driverMarker.current.remove();
        driverMarker.current = null;
      }
      return;
    }

    // Actualizar el estado interno de driverLocation
    setDriverLocation(userLocation);

    // Si el marcador del conductor aún no existe, crearlo
    if (!driverMarker.current) {
      const el = createCustomMarkerElement('#007bff'); // Usar la función auxiliar para el marcador del conductor

      driverMarker.current = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current!);

      console.log("InteractiveMap: Marcador del conductor añadido.");

      // Centrar el mapa en la ubicación del usuario la primera vez, solo si no hay rutas activas
      if (!isTripActive && !isRouteDrawn) {
          map.current?.flyTo({
              center: [userLocation.lng, userLocation.lat],
              zoom: 16,
              essential: true,
          });
      }

    } else {
      // Si ya existe, simplemente moverlo
      driverMarker.current.setLngLat([userLocation.lng, userLocation.lat]);

      // Solo vuelve a centrar el mapa en el conductor si no hay rutas activas ni viaje en curso.
      if (!isTripActive && !isRouteDrawn) {
        map.current?.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: map.current.getZoom() < 16 ? 16 : map.current.getZoom(),
          duration: 1000,
          essential: true,
        });
      }
    }

  }, [userLocation, isMapLoaded, createCustomMarkerElement, isTripActive, isRouteDrawn]); // Añadidas dependencias relevantes

  // === Función para borrar todas las rutas y marcadores de viaje ===
  const clearRoutesAndMarkers = useCallback(() => {
    if (!map.current || !isMapLoaded) return;

    // Limpiar fuentes de rutas
    const activeLegSource = map.current.getSource(activeLegRouteSourceId) as mapboxgl.GeoJSONSource;
    if (activeLegSource) {
      activeLegSource.setData({ type: "FeatureCollection", features: [] });
    }
    const tripContextSource = map.current.getSource(tripContextRouteSourceId) as mapboxgl.GeoJSONSource;
    if (tripContextSource) {
      tripContextSource.setData({ type: "FeatureCollection", features: [] });
    }

    // Limpiar marcadores
    if (originMarker.current) {
      originMarker.current.remove();
      originMarker.current = null;
    }
    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }
    
    setIsRouteDrawn(false);
    // NUEVO: Limpiar las rutas completas cacheada
    fullRouteActiveLegRef.current = null;
    fullRouteTripContextRef.current = null;
    console.log("InteractiveMap: Rutas y marcadores de viaje limpiados.");
  }, [isMapLoaded]);

  // NUEVO/ACTUALIZADO: Efecto principal para dibujar/actualizar rutas y marcadores
  useEffect(() => {
    if (!map.current || !isMapLoaded || !userLocation) {
      clearRoutesAndMarkers(); // Limpiar todo si el mapa no está listo o no hay ubicación del usuario
      return;
    }

    const fetchAndDrawRoutes = async () => {
      const driverLngLat: [number, number] = [userLocation.lng, userLocation.lat];

      // --- ESCENARIO 1: Viaje ACTIVO - yendo al ORIGEN del viaje (Leg 1) ---
      if (isTripActive && !isEnRouteToDestination && routeStart && routeEnd && tripDestination) {
        const tripOriginLngLat: [number, number] = [routeEnd.lng, routeEnd.lat]; // routeEnd es ahora el origen del viaje
        const tripDestinationLngLat: [number, number] = [tripDestination.lng, tripDestination.lat]; // Destino final

        // 1. Obtener/actualizar ruta DRIVER -> TRIP_ORIGIN (pierna activa)
        // Solo obtener de la API si los puntos de inicio/fin han cambiado o si la ruta no está cacheada
        if (!fullRouteActiveLegRef.current ||
            fullRouteActiveLegRef.current.geometry.coordinates[0][0] !== driverLngLat[0] ||
            fullRouteActiveLegRef.current.geometry.coordinates[0][1] !== driverLngLat[1] ||
            fullRouteActiveLegRef.current.geometry.coordinates.at(-1)![0] !== tripOriginLngLat[0] ||
            fullRouteActiveLegRef.current.geometry.coordinates.at(-1)![1] !== tripOriginLngLat[1]) {
          console.log("InteractiveMap: Fetching new route DRIVER -> TRIP_ORIGIN (active leg)");
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLngLat.join(',')};${tripOriginLngLat.join(',')}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;
          const query = await fetch(url);
          const json = await query.json();
          const route = json.routes && json.routes.length > 0 ? json.routes[0].geometry : null;
          if (route) {
            fullRouteActiveLegRef.current = { type: "Feature", properties: {}, geometry: route };
          } else {
            fullRouteActiveLegRef.current = null;
            console.error("Mapbox: No route found for DRIVER -> TRIP_ORIGIN.");
          }
        }

        // 2. Limpiar la ruta de contexto (TRIP_ORIGIN -> TRIP_DESTINATION)
        // NUEVO: Ya no queremos mostrar la ruta completa del viaje mientras el conductor se dirige al origen.
        console.log("InteractiveMap: Limpiando ruta de contexto (TRIP_ORIGIN -> TRIP_DESTINATION) al aceptar viaje.");
        const tripContextSource = map.current!.getSource(tripContextRouteSourceId) as mapboxgl.GeoJSONSource;
        if (tripContextSource) {
            tripContextSource.setData({ type: "FeatureCollection", features: [] });
            fullRouteTripContextRef.current = null; // Limpiar la referencia de la ruta completa también
        }

        // Actualizar fuentes del mapa con la ruta restante para la pierna activa
        const remainingRoute = getRemainingRoute(fullRouteActiveLegRef.current, userLocation);
        const activeLegSource = map.current!.getSource(activeLegRouteSourceId) as mapboxgl.GeoJSONSource;
        if (activeLegSource) activeLegSource.setData(remainingRoute || { type: "FeatureCollection", features: [] });

        // Añadir/Actualizar marcadores
        // Pasa 'null' para 'tripDestination' para asegurar que el marcador de destino final se elimine
        updateTripMarkers(userLocation, routeEnd, null, isTripActive, isEnRouteToDestination);
        
        // Ajustar límites del mapa para conductor y origen solamente
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(driverLngLat);
        bounds.extend(tripOriginLngLat);
        map.current!.fitBounds(bounds, { padding: 100, duration: 1500, essential: false });

        setIsRouteDrawn(true); // Indicar que las rutas están dibujadas/actualizadas

      }
      // --- ESCENARIO 2: Viaje ACTIVO - yendo al DESTINO final del viaje (Leg 2) ---
      else if (isTripActive && isEnRouteToDestination && routeStart && routeEnd && tripDestination) {
        const tripDestinationLngLat: [number, number] = [routeEnd.lng, routeEnd.lat]; // routeEnd es ahora el destino final

        // 1. Obtener/actualizar ruta DRIVER -> TRIP_DESTINATION (pierna activa)
        if (!fullRouteActiveLegRef.current ||
            fullRouteActiveLegRef.current.geometry.coordinates[0][0] !== driverLngLat[0] ||
            fullRouteActiveLegRef.current.geometry.coordinates[0][1] !== driverLngLat[1] ||
            fullRouteActiveLegRef.current.geometry.coordinates.at(-1)![0] !== tripDestinationLngLat[0] ||
            fullRouteActiveLegRef.current.geometry.coordinates.at(-1)![1] !== tripDestinationLngLat[1]) {
          console.log("InteractiveMap: Fetching new route DRIVER -> TRIP_DESTINATION (active leg)");
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLngLat.join(',')};${tripDestinationLngLat.join(',')}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;
          const query = await fetch(url);
          const json = await query.json();
          const route = json.routes && json.routes.length > 0 ? json.routes[0].geometry : null;
          if (route) {
            fullRouteActiveLegRef.current = { type: "Feature", properties: {}, geometry: route };
          } else {
            fullRouteActiveLegRef.current = null;
            console.error("Mapbox: No route found for DRIVER -> TRIP_DESTINATION.");
          }
        }

        // Limpiar la ruta de contexto (origen -> destino) ya que ya pasamos el origen
        const tripContextSource = map.current!.getSource(tripContextRouteSourceId) as mapboxgl.GeoJSONSource;
        if (tripContextSource) tripContextSource.setData({ type: "FeatureCollection", features: [] }); // Vaciar

        // Actualizar fuentes del mapa con la ruta restante para la pierna activa
        const remainingRoute = getRemainingRoute(fullRouteActiveLegRef.current, userLocation);
        const activeLegSource = map.current!.getSource(activeLegRouteSourceId) as mapboxgl.GeoJSONSource;
        if (activeLegSource) activeLegSource.setData(remainingRoute || { type: "FeatureCollection", features: [] });

        // Añadir/Actualizar marcadores (solo el destino debe ser prominente)
        updateTripMarkers(userLocation, null, routeEnd, isTripActive, isEnRouteToDestination); // null para el origen ya que lo hemos pasado
        
        // Ajustar límites del mapa para conductor y destino
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(driverLngLat);
        bounds.extend(tripDestinationLngLat);
        map.current!.fitBounds(bounds, { padding: 100, duration: 1500, essential: false });

        setIsRouteDrawn(true);

      }
      // --- ESCENARIO 3: OFERTA ACTIVA (NO es un viaje activo) ---
      else if (!isTripActive && routeStart && routeEnd && tripDestination) {
        const driverLoc = routeStart; // Ubicación de la torre/conductor en el momento de la oferta
        const tripOrigin = routeEnd;
        const finalDestination = tripDestination;

        // 1. Obtener/actualizar ruta TOWER -> TRIP_ORIGIN (para la oferta)
        if (!fullRouteActiveLegRef.current ||
            fullRouteActiveLegRef.current.geometry.coordinates[0][0] !== driverLoc.lng ||
            fullRouteActiveLegRef.current.geometry.coordinates[0][1] !== driverLoc.lat ||
            fullRouteActiveLegRef.current.geometry.coordinates.at(-1)![0] !== tripOrigin.lng ||
            fullRouteActiveLegRef.current.geometry.coordinates.at(-1)![1] !== tripOrigin.lat) {
          console.log("InteractiveMap: Fetching new route TOWER -> TRIP_ORIGIN (offer)");
          const url1 = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLoc.lng},${driverLoc.lat};${tripOrigin.lng},${tripOrigin.lat}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;
          const query1 = await fetch(url1);
          const json1 = await query1.json();
          const route1 = json1.routes && json1.routes.length > 0 ? json1.routes[0].geometry : null;
          if (route1) fullRouteActiveLegRef.current = { type: "Feature", properties: {}, geometry: route1 };
          else { fullRouteActiveLegRef.current = null; console.error("Mapbox: No route TOWER -> TRIP_ORIGIN for offer."); }
        }

        // 2. Obtener/actualizar ruta TRIP_ORIGIN -> TRIP_DESTINATION (para la oferta)
        if (!fullRouteTripContextRef.current ||
            fullRouteTripContextRef.current.geometry.coordinates[0][0] !== tripOrigin.lng ||
            fullRouteTripContextRef.current.geometry.coordinates[0][1] !== tripOrigin.lat ||
            fullRouteTripContextRef.current.geometry.coordinates.at(-1)![0] !== finalDestination.lng ||
            fullRouteTripContextRef.current.geometry.coordinates.at(-1)![1] !== finalDestination.lat) {
          console.log("InteractiveMap: Fetching new route TRIP_ORIGIN -> TRIP_DESTINATION (offer)");
          const url2 = `https://api.mapbox.com/directions/v5/mapbox/driving/${tripOrigin.lng},${tripOrigin.lat};${finalDestination.lng},${finalDestination.lat}?alternatives=false&geometries=geojson&steps=false&access_token=${mapboxgl.accessToken}`;
          const query2 = await fetch(url2);
          const json2 = await query2.json();
          const route2 = json2.routes && json2.routes.length > 0 ? json2.routes[0].geometry : null;
          if (route2) fullRouteTripContextRef.current = { type: "Feature", properties: {}, geometry: route2 };
          else { fullRouteTripContextRef.current = null; console.error("Mapbox: No route TRIP_ORIGIN -> TRIP_DESTINATION for offer."); }
        }

        const activeLegSource = map.current!.getSource(activeLegRouteSourceId) as mapboxgl.GeoJSONSource;
        if (activeLegSource) activeLegSource.setData(fullRouteActiveLegRef.current || { type: "FeatureCollection", features: [] });

        const tripContextSource = map.current!.getSource(tripContextRouteSourceId) as mapboxgl.GeoJSONSource;
        if (tripContextSource) tripContextSource.setData(fullRouteTripContextRef.current || { type: "FeatureCollection", features: [] });

        updateTripMarkers(userLocation, routeEnd, tripDestination, isTripActive, isEnRouteToDestination);
        
        // Ajustar límites del mapa para conductor, origen y destino
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(driverLngLat);
        bounds.extend([tripOrigin.lng, tripOrigin.lat]);
        bounds.extend([finalDestination.lng, finalDestination.lat]);
        map.current!.fitBounds(bounds, { padding: 100, duration: 1500, essential: false });

        setIsRouteDrawn(true);
      }
      // --- ESCENARIO 4: Ningún viaje o oferta activa ---
      else {
        clearRoutesAndMarkers();
        // Asegurarse de limpiar las referencias de rutas completas
        fullRouteActiveLegRef.current = null;
        fullRouteTripContextRef.current = null;
        setIsRouteDrawn(false);
      }
    };

    fetchAndDrawRoutes();

  }, [
    userLocation, routeStart, routeEnd, tripDestination, isMapLoaded,
    isTripActive, isEnRouteToDestination, clearRoutesAndMarkers, getRemainingRoute, updateTripMarkers
  ]);


  return <div ref={mapContainer} className="w-full h-full relative overflow-hidden" data-testid="mapbox-container" />;
}
