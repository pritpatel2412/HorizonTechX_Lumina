import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import FeedPage from "@/pages/feed";
import ExplorePage from "@/pages/explore";
import NotificationsPage from "@/pages/notifications";
import ProfilePage from "@/pages/profile";
import SavedPage from "@/pages/saved";
import PostDetailPage from "@/pages/post-detail";
import SettingsPage from "@/pages/settings";
import MessagesPage from "@/pages/messages";
import MessageThreadPage from "@/pages/message-thread";
import CirclePage from "@/pages/circle";
import { useEffect } from "react";
import { getToken } from "@/lib/auth";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    const token = getToken();
    if (!token && location !== "/") {
      setLocation("/");
    }
  }, [location, setLocation]);

  return <Component {...rest} />;
}

function AuthRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (getToken()) setLocation("/feed");
  }, [setLocation]);
  return <AuthPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthRedirect} />
      <Route path="/feed">
        {() => <ProtectedRoute component={FeedPage} />}
      </Route>
      <Route path="/explore">
        {() => <ProtectedRoute component={ExplorePage} />}
      </Route>
      <Route path="/notifications">
        {() => <ProtectedRoute component={NotificationsPage} />}
      </Route>
      <Route path="/saved">
        {() => <ProtectedRoute component={SavedPage} />}
      </Route>
      <Route path="/profile/:username">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/post/:id">
        {() => <ProtectedRoute component={PostDetailPage} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={SettingsPage} />}
      </Route>
      <Route path="/messages">
        {() => <ProtectedRoute component={MessagesPage} />}
      </Route>
      <Route path="/messages/:username">
        {() => <ProtectedRoute component={MessageThreadPage} />}
      </Route>
      <Route path="/circle">
        {() => <ProtectedRoute component={CirclePage} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" position="bottom-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
