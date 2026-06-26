import React from 'react';
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null; // No mostrar controles si solo hay una página
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="text-slate-300 border-slate-700 hover:bg-slate-800"
      >
        Anterior
      </Button>
      <span className="text-sm text-slate-400">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="text-slate-300 border-slate-700 hover:bg-slate-800"
      >
        Siguiente
      </Button>
    </div>
  );
}
