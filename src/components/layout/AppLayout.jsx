import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/input';
import {
  ShieldAlert,
  LayoutGrid,
  LogOut,
  Hospital,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export function AppLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { user, profile, isMrdAdmin, signOut, switchAccount } = useAuth();
  const { hospital } = useHospital();

  const displayTitle = title ?? hospital?.name ?? 'MedGuard';
  const displaySubtitle = subtitle ?? 'MedGuard Hospital Suite';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="border-b bg-card shadow-card sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-3 text-left group transition-opacity hover:opacity-90"
              onClick={() => navigate('/')}
            >
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold font-heading leading-tight flex items-center gap-2">
                  {displayTitle}
                  {isMrdAdmin && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                      MRD Admin
                    </Badge>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">
                  {displaySubtitle}
                </p>
              </div>
            </button>

            {hospital && (
              <button
                onClick={() => navigate('/hospitals')}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50"
              >
                <Hospital className="h-3.5 w-3.5 text-primary" />
                <span>{hospital.name}</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Modules</span>
            </Button>

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold leading-tight">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user.username}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {profile?.profession || 'Staff'} · {user.username}
                  </span>
                </div>

                {/* Quick Account Switcher Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 hidden sm:flex border-dashed"
                  title="Switch between Dr. Thirumalai (Admin) and Staff"
                  onClick={() => {
                    if (isMrdAdmin) {
                      switchAccount('pharmacist');
                    } else {
                      switchAccount('dr.thirumalai');
                    }
                  }}
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>{isMrdAdmin ? 'As Dr. Thirumalai' : 'As Staff'}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6 flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-4 text-center text-xs text-muted-foreground">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} MedGuard Healthcare Error Detection & Clinical Record System</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-success">
              <ShieldCheck className="h-3.5 w-3.5" /> Clinical Safety Engine Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
