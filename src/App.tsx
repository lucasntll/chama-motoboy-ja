import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import FreeOrder from "./pages/FreeOrder";
import OrderTracking from "./pages/OrderTracking";
import MotoboyAccess from "./pages/MotoboyAccess";
import MotoboyDashboard from "./pages/MotoboyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPharmacies from "./pages/AdminPharmacies";
import MotoboyRegistration from "./pages/MotoboyRegistration";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";
import PharmacyList from "./pages/PharmacyList";
import PharmacyDetail from "./pages/PharmacyDetail";
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
          <Route path="/cliente" element={<FreeOrder />} />
          <Route path="/cliente/livre" element={<FreeOrder />} />
          <Route path="/acompanhar/:orderId" element={<OrderTracking />} />
          <Route path="/pedido/:orderId" element={<OrderTracking />} />
          <Route path="/motoboy-acesso" element={<MotoboyAccess />} />
          <Route path="/motoboy" element={<MotoboyDashboard />} />
          <Route path="/cadastro-motoboy" element={<MotoboyRegistration />} />
          <Route path="/meus-pedidos" element={<MyOrders />} />
          <Route path="/farmacias" element={<PharmacyList />} />
          <Route path="/farmacia/:pharmacyId" element={<PharmacyDetail />} />

          {/* Admin */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/farmacias" element={<AdminPharmacies />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
