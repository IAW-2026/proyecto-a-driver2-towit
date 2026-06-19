'use client';

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import MobileMenu from "./MobileMenu";

interface AppHeaderMobileMenuProps {
  isSignedIn: boolean;
}

export default function AppHeaderMobileMenu({ isSignedIn }: AppHeaderMobileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleOpenMenu = useCallback(() => setIsMenuOpen(true), []);
  const handleCloseMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <div className="md:hidden flex items-center">
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleOpenMenu}>
            <MenuIcon className="size-6 text-white" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </DialogTrigger>
        <MobileMenu isSignedIn={isSignedIn} onClose={handleCloseMenu} />
      </Dialog>
    </div>
  );
}
