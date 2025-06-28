// src/App.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from './contexts/AuthContext';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AuthModal from "./components/AuthModal";

import Index from "./pages/Index";
import Contestants from "./pages/Contestants";
import Dashboard from "./pages/Dashboard";
import Rules from "./pages/Rules";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

function App() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = user && user.role === "admin";

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Checking authentication status...
      </div>
    );
  }

  // Render AuthModal if not authenticated
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthModal />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contestants" element={<Contestants />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rules" element={<Rules />} />
          {/* Admin route - ensure AdminDashboard is protected if needed */}
<Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;