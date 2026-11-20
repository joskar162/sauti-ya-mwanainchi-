import { useState, type FormEvent } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export const AdminPage = () => {
  const { user, loginAdmin, logout, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
              {(error || authError) && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
                  {error || authError}
                </p>
              )}
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
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Administrator access</h1>
            <p className="text-gray-500 mt-1">Oversight and funder accounts no longer require administrator approval.</p>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="w-4 h-4" /> Sign out</Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Self-service registration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">New oversight and funder accounts can register and sign in immediately.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
