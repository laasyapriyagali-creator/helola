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
import DestinationDetail from "./pages/DestinationDetail";
import DestinationsSearch from "./pages/DestinationsSearch";
import { About, CommunityGuidelines, PrivacyPolicy, Support, Terms } from "./pages/Legal";
import {
  EditProfilePage, AccountInfoPage, VisibilityPage, MessagePermissionPage,
  BlockedUsersPage, ReportIssuePage, NotificationsPage, PreferencesPage,
} from "./pages/settings/SettingsPages";
import Settings from "./pages/Settings";

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
            <Route path="/destinations/search" element={<AppShell><DestinationsSearch /></AppShell>} />
            <Route path="/destinations/:query" element={<AppShell><DestinationDetail /></AppShell>} />
            <Route path="/about" element={<AppShell><About /></AppShell>} />
            <Route path="/legal/privacy" element={<AppShell><PrivacyPolicy /></AppShell>} />
            <Route path="/legal/terms" element={<AppShell><Terms /></AppShell>} />
            <Route path="/legal/community" element={<AppShell><CommunityGuidelines /></AppShell>} />
            <Route path="/support" element={<AppShell><Support /></AppShell>} />

            {/* Settings — full-screen */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/edit-profile" element={<EditProfilePage />} />
            <Route path="/settings/account" element={<AccountInfoPage />} />
            <Route path="/settings/visibility" element={<VisibilityPage />} />
            <Route path="/settings/messages" element={<MessagePermissionPage />} />
            <Route path="/settings/blocked" element={<BlockedUsersPage />} />
            <Route path="/settings/report" element={<ReportIssuePage />} />
            <Route path="/settings/notifications" element={<NotificationsPage />} />
            <Route path="/settings/notifications/trip-updates" element={<NotificationsPage focusKey="trip_updates" />} />
            <Route path="/settings/notifications/group-chat" element={<NotificationsPage focusKey="group_chat" />} />
            <Route path="/settings/notifications/new-trip-alerts" element={<NotificationsPage focusKey="new_trip_alerts" />} />
            <Route path="/settings/notifications/offers" element={<NotificationsPage focusKey="offers_promotions" />} />
            <Route path="/settings/preferences" element={<PreferencesPage />} />
            <Route path="/settings/preferences/location" element={<PreferencesPage focusKey="location" />} />
            <Route path="/settings/preferences/destinations" element={<PreferencesPage focusKey="destinations" />} />
            <Route path="/settings/preferences/budget" element={<PreferencesPage focusKey="budget" />} />
            <Route path="/settings/preferences/interests" element={<PreferencesPage focusKey="interests" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
