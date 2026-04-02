import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Investors from "./pages/Investors";
import InvestorDetail from "./pages/InvestorDetail";
import InvestorDirectory from "./pages/InvestorDirectory";
import InvestorProfile from "./pages/InvestorProfile";
import Startups from "./pages/Startups";
import StartupDetail from "./pages/StartupDetail";
import Performance from "./pages/Performance";
import Mission from "./pages/Mission";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/investors/:id" element={<InvestorDetail />} />
            <Route path="/directory" element={<InvestorDirectory />} />
            <Route path="/profile/:id" element={<InvestorProfile />} />
            <Route path="/startups" element={<Startups />} />
            <Route path="/startups/:id" element={<StartupDetail />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
