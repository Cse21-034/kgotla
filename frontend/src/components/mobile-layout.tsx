import { ReactNode } from "react";
import BottomNavigation from "./bottom-navigation";

interface MobileLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  fab?: ReactNode;
}

export default function MobileLayout({ children, header, fab }: MobileLayoutProps) {
  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative">
      {header}
      <main className="pb-20">
        {children}
      </main>
      {fab}
      <BottomNavigation />
    </div>
  );
}
