import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth";
import CreateTrip from "./pages/CreateTrip";
import TripDetails from "./pages/TripDetails";
import MyTrips from "./pages/MyTrips";
import Profile from "./pages/Profile";
import Chats, { ChatRoom } from "./pages/Chats";
import Wishlist from "./pages/Wishlist";
import BookTickets from "./pages/BookTickets";
import { About, CommunityGuidelines, PrivacyPolicy, Support, Terms } from "./pages/Legal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/chats/:tripId" element={<AppShell><ChatRoom /></AppShell>} />
            <Route path="/" element={<AppShell><Index /></AppShell>} />
            <Route path="/trips" element={<AppShell><MyTrips /></AppShell>} />
            <Route path="/trips/new" element={<AppShell><CreateTrip /></AppShell>} />
            <Route path="/trips/:id" element={<AppShell><TripDetails /></AppShell>} />
            <Route path="/chats" element={<AppShell><Chats /></AppShell>} />
            <Route path="/wishlist" element={<AppShell><Wishlist /></AppShell>} />
            <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
            <Route path="/u/:userId" element={<AppShell><Profile /></AppShell>} />
            <Route path="/book-tickets" element={<AppShell><BookTickets /></AppShell>} />
            <Route path="/about" element={<AppShell><About /></AppShell>} />
            <Route path="/legal/privacy" element={<AppShell><PrivacyPolicy /></AppShell>} />
            <Route path="/legal/terms" element={<AppShell><Terms /></AppShell>} />
            <Route path="/legal/community" element={<AppShell><CommunityGuidelines /></AppShell>} />
            <Route path="/support" element={<AppShell><Support /></AppShell>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
