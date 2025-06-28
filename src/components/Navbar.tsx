
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import AuthModal from "./AuthModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
    { name: "Home", href: "/" },
    { name: "Contestants", href: "/contestants" },
    { name: "Rules", href: "/rules" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 glass">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link 
            to="/" 
            className="text-2xl font-bold tracking-tight flex items-center mr-8"
          >
            <span className="bg-primary text-primary-foreground p-1 rounded mr-2">MB</span>
            <span className="hidden sm:inline-block">Miss Bloom</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                } link-underline`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm font-medium flex items-center gap-2"
            onClick={() => setIsAuthModalOpen(true)}
          >
            <User size={18} />
            <span className="hidden sm:inline-block">Sign In</span>
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground shadow-sm hover-scale"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Register
          </Button>
          
          <button
            type="button"
            className="md:hidden rounded-md p-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Open menu</span>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="border-b border-border/40 pb-3 pt-2 glass animate-fade-in">
            <nav className="flex flex-col px-4 sm:px-6 space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? "bg-accent text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </header>
  );
};

export default Navbar;