"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface AccountDetailsModalContextType {
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const AccountDetailsModalContext = createContext<AccountDetailsModalContextType | undefined>(undefined);

export function AccountDetailsModalProvider({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const contextValue = useMemo(() => ({
    showModal,
    openModal,
    closeModal,
  }), [showModal, openModal, closeModal]);

  return (
    <AccountDetailsModalContext.Provider value={contextValue}>
      {children}
    </AccountDetailsModalContext.Provider>
  );
}

export function useAccountDetailsModal() {
  const context = useContext(AccountDetailsModalContext);
  if (context === undefined) {
    throw new Error('useAccountDetailsModal must be used within an AccountDetailsModalProvider');
  }
  return context;
}
