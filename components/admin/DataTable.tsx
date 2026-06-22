import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DataTableProps<T extends Record<string, any>> {
  title: string;
  data: T[];
  emptyMessage?: string;
  idFieldName: string; // Nombre del campo que contiene el ID único de la fila
  onEdit?: (id: string) => void; // Hacemos opcional
  onDelete?: (id: string) => void; // Hacemos opcional
  onToggleDeactivated?: (id: string, currentStatus: boolean) => void; // Nuevo: para activar/desactivar
}

export default function DataTable<T extends Record<string, any>>({
  title,
  data,
  emptyMessage = "No hay datos para mostrar.",
  idFieldName,
  onEdit,
  onDelete,
  onToggleDeactivated, // Desestructuramos la nueva prop
}: DataTableProps<T>) {
  const hasActions = onEdit || onDelete || onToggleDeactivated; // Las acciones incluyen también toggle
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 h-full flex flex-col">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <p className="text-slate-400 text-center flex-1 flex items-center justify-center">{emptyMessage}</p>
      </div>
    );
  }

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 h-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                >
                  {header.replace(/_/g, ' ')}
                </th>
              ))}
              {hasActions && ( // Condicionalmente mostrar la columna de acciones
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-800 transition-colors">
                {headers.map((header) => (
                  <td
                    key={`${rowIndex}-${header}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 md:max-w-6 overflow-x-hidden"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block"> {/* Usar un span para el contenido dentro del td */}
                            {header === 'createdAt' || header === 'updatedAt'
                              ? row[header] instanceof Date
                                ? row[header].toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : String(row[header])
                              : header === 'deactivated' // Manejar el campo 'deactivated'
                                ? row[header] ? 'Sí' : 'No'
                                : typeof row[header] === 'object' && row[header] !== null
                                  ? JSON.stringify(row[header])
                                  : String(row[header])}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {header === 'createdAt' || header === 'updatedAt'
                              ? row[header] instanceof Date
                                ? row[header].toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : String(row[header])
                              : header === 'deactivated'
                                ? row[header] ? 'Sí' : 'No'
                                : typeof row[header] === 'object' && row[header] !== null
                                  ? JSON.stringify(row[header])
                                  : String(row[header])}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                ))}
                {hasActions && ( // Condicionalmente mostrar la celda de acciones
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      {onToggleDeactivated && 'deactivated' in row && typeof row.deactivated === 'boolean' && (
                        <Button
                          variant={row.deactivated ? "default" : "secondary"} // Amarillo para activar, secundario para desactivar
                          size="sm"
                          onClick={() => onToggleDeactivated(row[idFieldName] as string, row.deactivated as boolean)}
                          className={row.deactivated ? "bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold" : ""}
                        >
                          {row.deactivated ? "Activar" : "Desactivar"}
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(row[idFieldName] as string)}
                        >
                          Editar
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(row[idFieldName] as string)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
