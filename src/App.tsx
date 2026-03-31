import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import TeamDetail from "./components/TeamDetail";
import IndividualDetail from "./components/IndividualDetail";
import { LayoutDashboard, Users, User, Menu, X } from "lucide-react";
import { Button } from "./components/ui/button";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "individual">("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const NavItem = ({ id, label, icon: Icon }: { id: "overview" | "team" | "individual", label: string, icon: any }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <ThemeProvider defaultTheme="system" storageKey="sales-dashboard-theme">
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-sm transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center font-bold text-lg tracking-tight">
              <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center mr-2">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              SalesDash
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-2 flex-1">
            <NavItem id="overview" label="Přehled (Overview)" icon={LayoutDashboard} />
            <NavItem id="team" label="Detail Týmu" icon={Users} />
            <NavItem id="individual" label="Detail Jednotlivce" icon={User} />
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  JD
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Jan Doe</p>
                  <p className="text-xs text-muted-foreground">Sales Manager</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="flex items-center justify-between h-16 px-6 border-b bg-card md:hidden">
            <div className="flex items-center font-bold text-lg tracking-tight">
              <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center mr-2">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              SalesDash
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto bg-muted/20">
            {activeTab === "overview" && <Dashboard />}
            {activeTab === "team" && <TeamDetail />}
            {activeTab === "individual" && <IndividualDetail />}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
