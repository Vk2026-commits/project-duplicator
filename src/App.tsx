import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Investors from "./pages/Investors";
import InvestorDetail from "./pages/InvestorDetail";
import Startups from "./pages/Startups";
import StartupDetail from "./pages/StartupDetail";
import Performance from "./pages/Performance";
import Mission from "./pages/Mission";
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
          <Route path="/investors" element={<Investors />} />
          <Route path="/investors/:id" element={<InvestorDetail />} />
          <Route path="/startups" element={<Startups />} />
          <Route path="/startups/:id" element={<StartupDetail />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
