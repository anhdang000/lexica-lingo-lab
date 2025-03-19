
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// These pages will be implemented later
// import Analysis from "./pages/Analysis";
// import Library from "./pages/Library";
// import CardDetail from "./pages/CardDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* These routes will be implemented later */}
          <Route path="/analysis" element={<div className="p-8">Analysis Page (Coming Soon)</div>} />
          <Route path="/library" element={<div className="p-8">Library Page (Coming Soon)</div>} />
          <Route path="/card/:id" element={<div className="p-8">Card Detail Page (Coming Soon)</div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
