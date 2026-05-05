import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import CitizenDashboard from "./pages/CitizenDashboard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AddComplaint from "./pages/citizen/AddComplaint.tsx";
import MyComplaints from "./pages/citizen/MyComplaints.tsx";
import EditComplaint from "./pages/citizen/EditComplaint.tsx";
import NotFound from "./pages/NotFound.tsx";

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
            <Route
              path="/citizen-dashboard"
              element={<ProtectedRoute requiredRole="citizen"><CitizenDashboard /></ProtectedRoute>}
            />
            <Route
              path="/citizen/add-complaint"
              element={<ProtectedRoute requiredRole="citizen"><AddComplaint /></ProtectedRoute>}
            />
            <Route
              path="/citizen/my-complaints"
              element={<ProtectedRoute requiredRole="citizen"><MyComplaints /></ProtectedRoute>}
            />
            <Route
              path="/citizen/edit-complaint/:id"
              element={<ProtectedRoute requiredRole="citizen"><EditComplaint /></ProtectedRoute>}
            />
            <Route
              path="/admin-dashboard"
              element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
