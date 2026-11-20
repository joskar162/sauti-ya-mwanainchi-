import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle, LogOut, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Registration {
  id: string;
  name: string;
  email: string;
  organization: string;
  organization_type: string;
  county: string;
  created_at: string;
}

export const AdminPage = () => {
  const { user, loginAdmin, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/registrations', { credentials: 'include' });
      const result = await response.json() as { registrations?: Registration[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not load account requests.');
      setRegistrations(result.registrations || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load account requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') void loadRequests();
  }, [user, loadRequests]);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await loginAdmin(email, password);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Administrator sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const reviewRequest = async (id: string, decision: 'approved' | 'rejected') => {
    setError('');
    try {
      const response = await fetch(`/api/admin/registrations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not update the account request.');
      setRegistrations(previous => previous.filter(registration => registration.id !== id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update the account request.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card variant="elevated" padding="lg" className="w-full max-w-md">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-green-800" />
            </div>
            <CardTitle>Administrator sign in</CardTitle>
            <CardDescription>This private page is separate from the public Citizen and Oversight sign-in options.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input label="Administrator email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required />
              <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
              {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">{error}</p>}
              <Button type="submit" className="w-full" loading={isLoading}>Sign in</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800">Build Kenya · Private administration</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Account requests</h1>
            <p className="text-gray-500 mt-1">Review organization details before granting oversight access.</p>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="w-4 h-4" /> Sign out</Button>
        </header>

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Pending approval ({registrations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 py-6 text-center">Loading account requests…</p>
            ) : registrations.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">There are no pending requests.</p>
            ) : (
              <div className="space-y-3">
                {registrations.map(registration => (
                  <article key={registration.id} className="rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900">{registration.organization}</h2>
                      <p className="text-sm text-gray-600 mt-1">{registration.name} · {registration.organization_type}</p>
                      <p className="text-sm text-gray-600">{registration.email} · {registration.county}</p>
                      <p className="text-xs text-gray-400 mt-2">Requested {new Date(registration.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void reviewRequest(registration.id, 'approved')}>
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void reviewRequest(registration.id, 'rejected')}>
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
