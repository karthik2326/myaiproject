import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Map, 
  BarChart3, 
  BrainCircuit, 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  Database, 
  CloudRain
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/claims", label: "Claims", icon: FileText },
    { href: "/verification", label: "Verification", icon: ShieldCheck },
    { href: "/farmers", label: "Farmers", icon: Users },
    { href: "/fields", label: "Fields", icon: Map },
    { href: "/inspections", label: "Inspections", icon: MapPin },
    { href: "/anomalies", label: "Fraud Detection", icon: AlertTriangle },
    { href: "/weather", label: "Weather", icon: CloudRain },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/model", label: "Model Insights", icon: BrainCircuit },
    { href: "/data-collection", label: "Training Data", icon: Database },
  ];

  return (
    <div className="w-64 bg-sidebar h-screen flex-shrink-0 flex flex-col border-r border-sidebar-border shadow-lg z-10 sticky top-0">
      <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shadow-inner">
          <BrainCircuit className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight">PMFBY Platform</h1>
          <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest font-semibold mt-0.5">Control Room</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
        <div className="text-xs font-semibold text-sidebar-foreground/50 mb-3 ml-2 mt-2 uppercase tracking-wider">Operations</div>
        {navItems.slice(0, 8).map((item) => (
          <NavItem 
            key={item.href} 
            href={item.href} 
            label={item.label} 
            icon={item.icon} 
            isActive={location === item.href || (location.startsWith(item.href) && item.href !== "/")} 
          />
        ))}
        
        <div className="text-xs font-semibold text-sidebar-foreground/50 mb-3 ml-2 mt-6 uppercase tracking-wider">Intelligence</div>
        {navItems.slice(8).map((item) => (
          <NavItem 
            key={item.href} 
            href={item.href} 
            label={item.label} 
            icon={item.icon} 
            isActive={location === item.href || (location.startsWith(item.href) && item.href !== "/")} 
          />
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-bold text-sidebar-accent-foreground">DO</span>
          </div>
          <div>
            <p className="text-xs font-medium text-sidebar-foreground">District Officer</p>
            <p className="text-[10px] text-sidebar-foreground/60">Maharashtra Zone</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, label, icon: Icon, isActive }: { href: string, label: string, icon: React.ElementType, isActive: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
        isActive 
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"}`} />
      {label}
    </Link>
  );
}