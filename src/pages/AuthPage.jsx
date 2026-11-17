import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, MRD_ADMIN_USERNAME } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ShieldAlert,
  Lock,
  User,
  Mail,
  Building,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, switchAccount } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Sign In Form
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Form
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    username: '',
    email: '',
    password: '',
    profession: 'doctor',
    institution: '',
    pharmacistRegId: ''
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setError('Please enter your Username/Email and Password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signIn(loginId.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!registerData.firstName || !registerData.username || !registerData.email || !registerData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUp({
        first_name: registerData.firstName,
        last_name: registerData.lastName,
        phone: registerData.phone,
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        profession: registerData.profession,
        institution: registerData.institution,
        pharmacistRegId: registerData.pharmacistRegId
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (username) => {
    switchAccount(username);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-md shadow-primary/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-heading">MedGuard</h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Real-time healthcare record error detection for prescribing, transcribing, dosage, and interactions.
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="p-3 rounded-xl bg-card border border-border shadow-sm space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground block text-center uppercase tracking-wider">
            Quick 1-Click Demo Login
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickDemoLogin(MRD_ADMIN_USERNAME)}
              className="text-xs h-9 justify-start border-primary/30 hover:border-primary"
            >
              <User className="h-3.5 w-3.5 text-primary mr-1.5 shrink-0" />
              <div className="text-left truncate">
                <span className="font-semibold block leading-tight">Dr. Thirumalai</span>
                <span className="text-[10px] text-muted-foreground">MRD Admin</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickDemoLogin('pharmacist')}
              className="text-xs h-9 justify-start"
            >
              <User className="h-3.5 w-3.5 text-emerald-600 mr-1.5 shrink-0" />
              <div className="text-left truncate">
                <span className="font-semibold block leading-tight">Clinical Pharmacist</span>
                <span className="text-[10px] text-muted-foreground">Staff Access</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Main Auth Card */}
        <Card className="border-border/80 shadow-card">
          <CardHeader className="pb-3 text-center">
            <div className="flex rounded-lg bg-muted p-1 max-w-[240px] mx-auto text-xs">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'signin' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'signup' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Register
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Username or Email</label>
                  <Input
                    placeholder="e.g. dr.thirumalai or email"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold">Password</label>
                    <button
                      type="button"
                      onClick={() => navigate('/reset-password')}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold">First Name *</label>
                    <Input
                      value={registerData.firstName}
                      onChange={e => setRegisterData({ ...registerData, firstName: e.target.value })}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Last Name</label>
                    <Input
                      value={registerData.lastName}
                      onChange={e => setRegisterData({ ...registerData, lastName: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold">Username *</label>
                  <Input
                    value={registerData.username}
                    onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
                    placeholder="e.g. thirumalai"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold">Email *</label>
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="you@hospital.org"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold">Password *</label>
                  <Input
                    type="password"
                    value={registerData.password}
                    onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold">Profession</label>
                    <select
                      value={registerData.profession}
                      onChange={e => setRegisterData({ ...registerData, profession: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="doctor">Doctor / Physician</option>
                      <option value="pharmacist">Clinical Pharmacist</option>
                      <option value="nurse">Nurse</option>
                      <option value="student">Medical Student</option>
                      <option value="staff">Hospital Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Institution</label>
                    <Input
                      value={registerData.institution}
                      onChange={e => setRegisterData({ ...registerData, institution: e.target.value })}
                      placeholder="Hospital name"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
