import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import MotoboyAccess from "./pages/MotoboyAccess";
import MotoboyDashboard from "./pages/MotoboyDashboard";
import MotoboyRegistration from "./pages/MotoboyRegistration";
import EstablishmentAccess from "./pages/EstablishmentAccess";
import EstablishmentDashboard from "./pages/EstablishmentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Estabelecimento */}
          <Route path="/estabelecimento-acesso" element={<EstablishmentAccess />} />
          <Route path="/estabelecimento" element={<EstablishmentDashboard />} />

          {/* Motoboy */}
          <Route path="/motoboy-acesso" element={<MotoboyAccess />} />
          <Route path="/motoboy" element={<MotoboyDashboard />} />
          <Route path="/cadastro-motoboy" element={<MotoboyRegistration />} />

          {/* Admin */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
