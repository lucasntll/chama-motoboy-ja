import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import ClientOrder from "./pages/ClientOrder";
import PartnerOrder from "./pages/PartnerOrder";
import FreeOrder from "./pages/FreeOrder";
import OrderTracking from "./pages/OrderTracking";
import MotoboyAccess from "./pages/MotoboyAccess";
import MotoboyDashboard from "./pages/MotoboyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MotoboyRegistration from "./pages/MotoboyRegistration";
import EstablishmentAccess from "./pages/EstablishmentAccess";
import EstablishmentDashboard from "./pages/EstablishmentDashboard";
import EstablishmentRegistration from "./pages/EstablishmentRegistration";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MyOrders from "./pages/MyOrders";
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
          <Route path="/cliente" element={<ClientOrder />} />
          <Route path="/cliente/parceiro" element={<PartnerOrder />} />
          <Route path="/cliente/livre" element={<FreeOrder />} />
          <Route path="/acompanhar/:orderId" element={<OrderTracking />} />
          <Route path="/pedido/:orderId" element={<OrderTracking />} />
          <Route path="/motoboy-acesso" element={<MotoboyAccess />} />
          <Route path="/motoboy" element={<MotoboyDashboard />} />
          <Route path="/cadastro-motoboy" element={<MotoboyRegistration />} />
          <Route path="/meus-pedidos" element={<MyOrders />} />

          {/* Estabelecimento */}
          <Route path="/estabelecimento-acesso" element={<EstablishmentAccess />} />
          <Route path="/estabelecimento" element={<EstablishmentDashboard />} />
          <Route path="/cadastro-estabelecimento" element={<EstablishmentRegistration />} />

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
