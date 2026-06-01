"use client";

import dynamic from "next/dynamic";
import InteractiveMap from "@/components/service/InteractiveMap"; // Mantener la importación por si se usa en otro lugar, aunque dynamic la reemplazará
import ServiceHeader from "@/components/service/ServiceHeader";

// Importar InteractiveMap dinámicamente con SSR deshabilitado
const DynamicInteractiveMap = dynamic(() => import("@/components/service/InteractiveMap"), {
  ssr: false,
});

export default function ServicePageClient() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <ServiceHeader />
      <DynamicInteractiveMap />
    </div>
  );
}
