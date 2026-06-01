import React from 'react';
import { Button } from "@/components/ui/button";

interface DataTableProps<T extends Record<string, any>> {
  title: string;
  data: T[];
  emptyMessage?: string;
  idFieldName: string; // Nombre del campo que contiene el ID único de la fila
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DataTable<T extends Record<string, any>>({
  title,
  data,
  emptyMessage = "No hay datos para mostrar.",
  idFieldName,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
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
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-800 transition-colors">
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {(header === 'createdAt' || header === 'updatedAt') && row[header] instanceof Date
                      ? row[header].toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : typeof row[header] === 'object' && row[header] !== null
                        ? JSON.stringify(row[header])
                        : String(row[header])}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(row[idFieldName] as string)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(row[idFieldName] as string)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
