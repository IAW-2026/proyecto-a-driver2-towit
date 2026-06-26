"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface NoVehicleErrorModalContextType {
  showNoVehicleErrorModal: boolean;
  openNoVehicleErrorModal: () => void;
  closeNoVehicleErrorModal: () => void;
}

const NoVehicleErrorModalContext = createContext<NoVehicleErrorModalContextType | undefined>(undefined);

export function NoVehicleErrorModalProvider({ children }: { children: React.ReactNode }) {
  const [showNoVehicleErrorModal, setShowNoVehicleErrorModal] = useState(false);

  const openNoVehicleErrorModal = useCallback(() => setShowNoVehicleErrorModal(true), []);
  const closeNoVehicleErrorModal = useCallback(() => setShowNoVehicleErrorModal(false), []);

  const contextValue = useMemo(() => ({
    showNoVehicleErrorModal,
    openNoVehicleErrorModal,
    closeNoVehicleErrorModal,
  }), [showNoVehicleErrorModal, openNoVehicleErrorModal, closeNoVehicleErrorModal]);

  return (
    <NoVehicleErrorModalContext.Provider value={contextValue}>
      {children}
    </NoVehicleErrorModalContext.Provider>
  );
}

export function useNoVehicleErrorModal() {
  const context = useContext(NoVehicleErrorModalContext);
  if (context === undefined) {
    throw new Error('useNoVehicleErrorModal must be used within a NoVehicleErrorModalProvider');
  }
  return context;
}
