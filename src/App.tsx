import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eager: tiny entrypoints used by every route
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy: every other route is code-split so the initial bundle stays small.
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CreateTrip = lazy(() => import("./pages/CreateTrip"));
const TripDetails = lazy(() => import("./pages/TripDetails"));
const MyTrips = lazy(() => import("./pages/MyTrips"));
const Profile = lazy(() => import("./pages/Profile"));
const Chats = lazy(() => import("./pages/Chats"));
const ChatRoom = lazy(() => import("./pages/Chats").then((m) => ({ default: m.ChatRoom })));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const BookTickets = lazy(() => import("./pages/BookTickets"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const DestinationsSearch = lazy(() => import("./pages/DestinationsSearch"));
const Moments = lazy(() => import("./pages/Moments"));

const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

const About = lazy(() => import("./pages/Legal").then((m) => ({ default: m.About })));
const CommunityGuidelines = lazy(() => import("./pages/Legal").then((m) => ({ default: m.CommunityGuidelines })));
const PrivacyPolicy = lazy(() => import("./pages/Legal").then((m) => ({ default: m.PrivacyPolicy })));
const Support = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Support })));
const Terms = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Terms })));

const settingsImport = () => import("./pages/settings/SettingsPages");
const EditProfilePage = lazy(() => settingsImport().then((m) => ({ default: m.EditProfilePage })));
const AccountInfoPage = lazy(() => settingsImport().then((m) => ({ default: m.AccountInfoPage })));
const VisibilityPage = lazy(() => settingsImport().then((m) => ({ default: m.VisibilityPage })));
const MessagePermissionPage = lazy(() => settingsImport().then((m) => ({ default: m.MessagePermissionPage })));
const BlockedUsersPage = lazy(() => settingsImport().then((m) => ({ default: m.BlockedUsersPage })));
const ReportIssuePage = lazy(() => settingsImport().then((m) => ({ default: m.ReportIssuePage })));
const NotificationsSettingsPage = lazy(() => settingsImport().then((m) => ({ default: m.NotificationsPage })));
const PreferencesPage = lazy(() => settingsImport().then((m) => ({ default: m.PreferencesPage })));
const PremiumSettings = lazy(() => import("./pages/settings/PremiumSettings"));

// React Query defaults tuned for a high-traffic app: aggressive cache reuse,
// no aggressive refetch storms, smarter retry policy.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[40dvh] items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/chats/:tripId" element={<AppShell><ChatRoom /></AppShell>} />
                <Route path="/" element={<AppShell><Index /></AppShell>} />
                <Route path="/trips" element={<AppShell><MyTrips /></AppShell>} />
                <Route path="/trips/new" element={<AppShell><CreateTrip /></AppShell>} />
                <Route path="/trips/:id" element={<AppShell><TripDetails /></AppShell>} />
                <Route path="/chats" element={<AppShell><Chats /></AppShell>} />
                <Route path="/wishlist" element={<AppShell><Wishlist /></AppShell>} />
                <Route path="/moments" element={<AppShell><Moments /></AppShell>} />
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
                
                <Route path="/notifications" element={<AppShell><Notifications /></AppShell>} />

                {/* Settings — full-screen */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/edit-profile" element={<EditProfilePage />} />
                <Route path="/settings/account" element={<AccountInfoPage />} />
                <Route path="/settings/visibility" element={<VisibilityPage />} />
                <Route path="/settings/messages" element={<MessagePermissionPage />} />
                <Route path="/settings/blocked" element={<BlockedUsersPage />} />
                <Route path="/settings/report" element={<ReportIssuePage />} />
                <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
                <Route path="/settings/notifications/trip-updates" element={<NotificationsSettingsPage focusKey="trip_updates" />} />
                <Route path="/settings/notifications/group-chat" element={<NotificationsSettingsPage focusKey="group_chat" />} />
                <Route path="/settings/notifications/new-trip-alerts" element={<NotificationsSettingsPage focusKey="new_trip_alerts" />} />
                <Route path="/settings/notifications/offers" element={<NotificationsSettingsPage focusKey="offers_promotions" />} />
                <Route path="/settings/preferences" element={<PreferencesPage />} />
                <Route path="/settings/preferences/location" element={<PreferencesPage focusKey="location" />} />
                <Route path="/settings/preferences/destinations" element={<PreferencesPage focusKey="destinations" />} />
                <Route path="/settings/preferences/budget" element={<PreferencesPage focusKey="budget" />} />
                <Route path="/settings/preferences/interests" element={<PreferencesPage focusKey="interests" />} />
                <Route path="/settings/premium" element={<PremiumSettings />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
