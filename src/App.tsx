import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Library from "./pages/Library";
import { useIsMobile } from "./hooks/use-mobile";

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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/library" element={<Layout><Library /></Layout>} />
          <Route path="/practice" element={<Layout><div>Practice Page (Coming Soon)</div></Layout>} />
          <Route path="/analysis" element={<Layout><div>Analysis Page (Coming Soon)</div></Layout>} />
          <Route path="/card/:id" element={<Layout><div>Card Detail Page (Coming Soon)</div></Layout>} />
          <Route path="/profile" element={<Layout><div>Profile Page (Coming Soon)</div></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
