import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react'; // Asumiendo que lucide-react está disponible para iconos

interface LocationModeToggleProps {
  isManualLocationMode: boolean;
  toggleManualLocationMode: () => void;
}

const LocationModeToggle: React.FC<LocationModeToggleProps> = ({ isManualLocationMode, toggleManualLocationMode }) => {
  return (
    <Button
      onClick={toggleManualLocationMode}
      variant="ghost"
      className={`font-bold transition-colors duration-200 ${
        isManualLocationMode
          ? 'bg-blue-600 hover:bg-blue-500 text-white'
          : 'bg-slate-700 hover:bg-slate-600 text-white'
      }`}
      aria-label={isManualLocationMode ? "Desactivar modo de ubicación manual" : "Activar modo de ubicación manual"}
    >
      <Globe className="h-5 w-5 mr-2" />
      {isManualLocationMode ? 'Ubicación Manual' : 'Ubicación Automática'}
    </Button>
  );
};

export default LocationModeToggle;
