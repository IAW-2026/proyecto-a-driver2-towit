"use client";                                                                                            
                                                                                                         
import Image from "next/image";                                                                          
import { useUser } from "@clerk/nextjs";                                                                 
import { getTowerVehicles } from "@/app/actions/tower";                                                  
import { useEffect, useState, useRef } from "react"; // Importa useRef                                   
import Link from "next/link";                                                                            
import { Button } from "@/components/ui/button";                                                         
import { useNoVehicleErrorModal } from "@/components/providers/NoVehicleErrorModalProvider";             
                                                                                                         
interface Vehicle {                                                                                      
  vehicle_id: string;                                                                                    
  brand: string;                                                                                         
  model: string;                                                                                         
  year: number;                                                                                          
  max_load: number;                                                                                      
}                                                                                                        
                                                                                                         
export default function UserProfileSummary() {                                                           
  const { user, isLoaded } = useUser();                                                                  
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);                                      
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);                                      
  const [isAvailable, setIsAvailable] = useState(false);                                                 
  const { openNoVehicleErrorModal } = useNoVehicleErrorModal();                                          
                                                                                                         
  // Usa una referencia para rastrear si ya se ha realizado la petición para el userId actual.           
  const fetchExecutedRef = useRef<{ userId: string | null; executed: boolean }>({                        
    userId: null,                                                                                        
    executed: false,                                                                                     
  });                                                                                                    
                                                                                                         
  useEffect(() => {                                                                                      
    // Si el usuario no está cargado o no hay un objeto de usuario, resetea el estado de la referencia.  
    if (!isLoaded || !user || !user.id) {                                                                
      fetchExecutedRef.current = { userId: null, executed: false };                                      
      return;                                                                                            
    }                                                                                                    
                                                                                                         
    // Si el userId es el mismo que el que ya procesamos y ya ejecutamos la petición, no hacemos nada.   
    if (                                                                                                 
      fetchExecutedRef.current.userId === user.id &&                                                     
      fetchExecutedRef.current.executed                                                                  
    ) {                                                                                                  
      return;                                                                                            
    }                                                                                                    
                                                                                                         
    // Marca la petición como ejecutada para el userId actual.                                           
    fetchExecutedRef.current = { userId: user.id, executed: true };                                      
                                                                                                         
    // Define la función asíncrona para la carga de vehículos.                                           
    async function fetchVehicles() {                                                                     
      setIsLoadingVehicles(true);                                                                        
      try {                                                                                              
        const fetchedVehicles = await getTowerVehicles();                                                
        setVehicles(fetchedVehicles);                                                                    
      } catch (error) {                                                                                  
        console.error("Error al obtener vehículos del Tower:", error);                                   
        // Manejar el estado de error si es necesario                                                    
      } finally {                                                                                        
        setIsLoadingVehicles(false);                                                                     
      }                                                                                                  
    }                                                                                                    
                                                                                                         
    fetchVehicles();                                                                                     
  }, [isLoaded, user]); // Las dependencias se mantienen para reaccionar a la carga del usuario.         
                                                                                                         
  const handleToggleAvailability = () => {                                                               
    if (!vehicles || vehicles.length === 0) {                                                            
      openNoVehicleErrorModal();                                                                         
      return;                                                                                            
    }                                                                                                    
    console.log(`Mock: Updating availability in Redis for user ${user?.id} to ${!isAvailable}`);         
    setIsAvailable(!isAvailable);                                                                        
  };                                                                                                     
                                                                                                         
  if (!isLoaded || isLoadingVehicles) {                                                                  
    return (                                                                                             
      <div className="flex justify-center items-center h-48 bg-slate-900/70 p-6 rounded-lg shadow-lg     
border border-slate-800">                                                                                
        <p className="text-slate-400">Cargando perfil y vehículos...</p>                                 
      </div>                                                                                             
    );                                                                                                   
  }                                                                                                      
                                                                                                         
  if (!user) {                                                                                           
    return null;                                                                                         
  }                                                                                                      
                                                                                                         
  const avgRating = 4.8;                                                                                 
  const currentVehicle = vehicles && vehicles.length > 0 ? vehicles[0] : null;                           
                                                                                                         
  return (                                                                                               
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col       
h-full">                                                                                                 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full flex-1">                              
        <div className="flex flex-col items-start justify-between">                                      
          <div className="flex items-center space-x-4 w-full border-b border-slate-800 pb-4 mb-4">       
            <Image                                                                                       
              src={user.imageUrl}                                                                        
              alt={user.fullName || "User Avatar"}                                                       
              width={60}                                                                                 
              height={60}                                                                                
              className="rounded-full border-2 border-yellow-500 object-cover"                           
              loading="eager"                                                                            
            />                                                                                           
            <div className="flex-1">                                                                     
              <h2 className="text-xl font-bold text-white leading-tight">                                
                {user.fullName}                                                                          
              </h2>                                                                                      
              <p className="text-sm text-yellow-400 mt-1">                                               
                Calificación: {avgRating}                                                                
              </p>                                                                                       
            </div>                                                                                       
          </div>                                                                                         
          <Button                                                                                        
            onClick={handleToggleAvailability}                                                           
            className={`w-full font-bold mt-auto ${                                                      
              isAvailable                                                                                
                ? "bg-green-600 hover:bg-green-500 text-white"                                           
                : "bg-slate-700 hover:bg-slate-600 text-white"                                           
            }`}                                                                                          
          >                                                                                              
            {isAvailable ? "Disponible" : "No Disponible"}                                               
          </Button>                                                                                      
        </div>                                                                                           
        <div className="flex flex-col w-full h-full">                                                    
          <h3 className="text-md font-bold text-white mb-2">Vehículo Actual</h3>                         
          {currentVehicle ? (                                                                            
            <div className="space-y-1 text-slate-400 text-sm flex-1">                                    
              <p><span className="font-semibold text-white">Marca:</span> {currentVehicle.brand}</p>     
              <p><span className="font-semibold text-white">Modelo:</span> {currentVehicle.model}</p>    
              <p><span className="font-semibold text-white">Año:</span> {currentVehicle.year}</p>        
              <p><span className="font-semibold text-white">Carga Máx.:</span> {currentVehicle.max_load} 
kg</p>                                                                                                   
            </div>                                                                                       
          ) : (                                                                                          
            <div className="text-center p-4 bg-slate-800/50 rounded-lg flex-1 flex flex-col              
justify-center items-center">                                                                            
              <p className="text-slate-400 text-sm mb-3">No tienes vehículos registrados.</p>            
              <Link href="/vehicles" className="w-full">                                                 
                <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">   
                  Añadir Vehículo                                                                        
                </Button>                                                                                
              </Link>                                                                                    
            </div>                                                                                       
          )}                                                                                             
        </div>                                                                                           
      </div>                                                                                             
    </div>                                                                                               
  );                                                                                                     
}