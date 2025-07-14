import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  Users, 
  Bell, 
  User,
  ShoppingBag 
} from "lucide-react";

const navigationItems = [
  { 
    path: "/", 
    icon: Home, 
    label: { en: "Home", tn: "Gae" } 
  },
  { 
    path: "/search", 
    icon: Search, 
    label: { en: "Search", tn: "Batla" } 
  },
  { 
    path: "/groups", 
    icon: Users, 
    label: { en: "Groups", tn: "Ditlhopha" } 
  },
  { 
    path: "/marketplace", 
    icon: ShoppingBag, 
    label: { en: "Shop", tn: "Rekisa" } 
  },
  { 
    path: "/notifications", 
    icon: Bell, 
    label: { en: "Alerts", tn: "Dikitsiso" } 
  },
  { 
    path: "/profile", 
    icon: User, 
    label: { en: "Profile", tn: "Profaele" } 
  },
];

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(item.path)}
              className={`flex flex-col items-center space-y-1 py-2 px-3 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {/* Notification dot for alerts */}
                {item.path === "/notifications" && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></div>
                )}
              </div>
              <span className="text-xs">{item.label.en}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
