import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="font-heading">Set a new password</CardTitle>
          <CardDescription>
            Enter your new secure password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="h-10 w-10 text-success mx-auto" />
              <p className="text-sm font-semibold">Password Updated</p>
              <p className="text-xs text-muted-foreground">
                You can now sign in with your new credentials.
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold">New password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Confirm password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Update password
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="w-full gap-1.5 text-xs text-muted-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
