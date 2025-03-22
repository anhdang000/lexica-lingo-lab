
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Library from "./pages/Library";
import Practice from "./pages/Practice";
import Auth from "./pages/Auth";
import { useIsMobile } from "./hooks/use-mobile";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Create QueryClient
const queryClient = new QueryClient();

// Layout component to handle different layouts for mobile/desktop
const Layout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className={isMobile ? "pt-16" : "ml-60"}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Index /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <Layout><Library /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/practice" element={
              <ProtectedRoute>
                <Layout><Practice /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/analysis" element={
              <ProtectedRoute>
                <Layout><div>Analysis Page (Coming Soon)</div></Layout>
              </ProtectedRoute>
            } />
            <Route path="/card/:id" element={
              <ProtectedRoute>
                <Layout><div>Card Detail Page (Coming Soon)</div></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout><div>Profile Page (Coming Soon)</div></Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
