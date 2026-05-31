"use client";

import React from 'react';
import AccountDetailsForm from './AccountDetailsForm';
import { Button } from "@/components/ui/button";
import { useAccountDetailsModal } from "@/components/providers/AccountDetailsModalProvider";

export default function AccountDetailsModal() {
  const { showModal, closeModal } = useAccountDetailsModal();

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={closeModal}
          className="absolute top-2 right-2 text-slate-400 hover:text-white"
        >
          &times;
        </Button>
        <AccountDetailsForm onClose={closeModal} />
      </div>
    </div>
  );
}
