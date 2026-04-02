import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Investors from "./pages/Investors";
import InvestorDetail from "./pages/InvestorDetail";
import InvestorDirectory from "./pages/InvestorDirectory";
import InvestorProfile from "./pages/InvestorProfile";
import Startups from "./pages/Startups";
import StartupDetail from "./pages/StartupDetail";
import Performance from "./pages/Performance";
import Mission from "./pages/Mission";
import Information from "./pages/Information";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Disclosures from "./pages/Disclosures";
import Meetings from "./pages/Meetings";
import Deals from "./pages/Deals";
import Contributions from "./pages/Contributions";
import CalendarPage from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import DisclaimerModal from "./components/DisclaimerModal";
import Onboarding from "./pages/Onboarding";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DisclaimerModal />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<P><Index /></P>} />
            <Route path="/investors" element={<P><Investors /></P>} />
            <Route path="/investors/:id" element={<P><InvestorDetail /></P>} />
            <Route path="/directory" element={<P><InvestorDirectory /></P>} />
            <Route path="/profile/:id" element={<P><InvestorProfile /></P>} />
            <Route path="/startups" element={<P><Startups /></P>} />
            <Route path="/startups/:id" element={<P><StartupDetail /></P>} />
            <Route path="/performance" element={<P><Performance /></P>} />
            <Route path="/mission" element={<P><Mission /></P>} />
            <Route path="/information" element={<P><Information /></P>} />
            <Route path="/disclosures" element={<P><Disclosures /></P>} />
            <Route path="/deals" element={<P><Deals /></P>} />
            <Route path="/meetings" element={<P><Meetings /></P>} />
            <Route path="/contributions" element={<P><Contributions /></P>} />
            <Route path="/admin" element={<P><Admin /></P>} />
            <Route path="/onboarding" element={<P><Onboarding /></P>} />
            <Route path="/onboarding/:startupId" element={<P><Onboarding /></P>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
