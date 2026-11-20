import { useState, type FormEvent } from 'react';
import { Building2, ShieldCheck, Users } from 'lucide-react';
import { useAuth, type OversightRegistration } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';

type LoginMode = 'choose' | 'citizen' | 'oversight-login' | 'oversight-register' | 'pending';

export const LoginPage = () => {
  const { loginCitizen, loginOversight, requestOversightAccount, authError } = useAuth();
  const [mode, setMode] = useState<LoginMode>('choose');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [county, setCounty] = useState('Tharaka-Nithi');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [organizationType, setOrganizationType] = useState<OversightRegistration['organizationType']>('NGO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chooseRole = (role: 'citizen' | 'oversight') => {
    setError('');
    setMode(role === 'citizen' ? 'citizen' : 'oversight-login');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'citizen') {
        loginCitizen(name, county);
      } else if (mode === 'oversight-login') {
        await loginOversight(email, password);
      } else if (mode === 'oversight-register') {
        if (password.length < 12) {
          setError('Use a password with at least 12 characters.');
          return;
        }
        if (password !== confirmPassword) {
          setError('The passwords do not match.');
          return;
        }
        await requestOversightAccount({
          name,
          email,
          password,
          organization,
          organizationType,
          county
        });
        setMode('pending');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not complete the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToRoles = () => {
    setMode('choose');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-800 mb-4 shadow-lg shadow-green-900/15">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Build Kenya</h1>
          <p className="text-gray-500 mt-2">Project Accountability Platform</p>
        </div>

        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>
              {mode === 'pending' ? 'Request received' : mode === 'choose' ? 'Welcome' : mode === 'oversight-register' ? 'Create an oversight account' : 'Sign in'}
            </CardTitle>
            <CardDescription>
              {mode === 'choose' && 'Choose how you want to use Build Kenya.'}
              {mode === 'citizen' && 'Citizens can continue without creating an account.'}
              {mode === 'oversight-login' && 'Sign in to your approved supervisor, NGO or oversight account.'}
              {mode === 'oversight-register' && 'Your organization details will be reviewed before access is enabled.'}
              {mode === 'pending' && 'Your account cannot be used until an administrator approves it.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'choose' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => chooseRole('citizen')}
                  className="p-5 rounded-xl border border-gray-200 text-left transition hover:border-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
                >
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-green-800" />
                  </div>
                  <p className="font-semibold text-gray-900">Citizen</p>
                  <p className="text-sm text-gray-500 mt-1">Browse local projects, report issues and track reports.</p>
                  <p className="text-xs font-medium text-green-800 mt-4">No account needed</p>
                </button>
                <button
                  type="button"
                  onClick={() => chooseRole('oversight')}
                  className="p-5 rounded-xl border border-gray-200 text-left transition hover:border-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
                >
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <Building2 className="w-5 h-5 text-green-800" />
                  </div>
                  <p className="font-semibold text-gray-900">Oversight &amp; Funders</p>
                  <p className="text-sm text-gray-500 mt-1">For supervisors, NGOs and oversight organizations.</p>
                  <p className="text-xs font-medium text-amber-700 mt-4">Account approval required</p>
                </button>
              </div>
            )}

            {mode === 'pending' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
                  Your registration is saved. An administrator will review your organization details. You can sign in after approval.
                </div>
                <Button className="w-full" variant="outline" onClick={backToRoles}>Back to sign in</Button>
              </div>
            )}

            {(mode === 'citizen' || mode === 'oversight-login' || mode === 'oversight-register') && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'citizen' && (
                  <>
                    <Input label="Name (optional)" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="How should we address you?" />
                    <Input label="County" value={county} onChange={event => setCounty(event.target.value)} required />
                  </>
                )}

                {mode === 'oversight-login' && (
                  <>
                    <Input label="Work email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required />
                    <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
                  </>
                )}

                {mode === 'oversight-register' && (
                  <>
                    <Input label="Full name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required />
                    <Input label="Work email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
                    <Select
                      label="Organization type"
                      value={organizationType}
                      onChange={event => setOrganizationType(event.target.value as OversightRegistration['organizationType'])}
                      options={[
                        { value: 'NGO', label: 'NGO / Funder' },
                        { value: 'Supervisor', label: 'Project supervisor' },
                        { value: 'Auditor-General', label: 'Auditor-General / oversight body' }
                      ]}
                    />
                    <Input label="Organization name" value={organization} onChange={event => setOrganization(event.target.value)} required />
                    <Input label="County" value={county} onChange={event => setCounty(event.target.value)} required />
                    <Input label="Create password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} helperText="Use at least 12 characters." required />
                    <Input label="Confirm password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required />
                  </>
                )}

                {(error || (mode !== 'citizen' && authError)) && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800" role="alert">
                    {error || authError}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                  {mode === 'citizen' ? 'Continue as citizen' : mode === 'oversight-login' ? 'Sign in' : 'Request account'}
                </Button>

                {mode === 'oversight-login' && (
                  <p className="text-sm text-center text-gray-600">
                    New organization?{' '}
                    <button type="button" className="font-semibold text-green-800 hover:underline" onClick={() => { setError(''); setMode('oversight-register'); }}>
                      Request an account
                    </button>
                  </p>
                )}
                {mode === 'oversight-register' && (
                  <p className="text-sm text-center text-gray-600">
                    Already approved?{' '}
                    <button type="button" className="font-semibold text-green-800 hover:underline" onClick={() => { setError(''); setMode('oversight-login'); }}>
                      Sign in
                    </button>
                  </p>
                )}
                <Button type="button" variant="ghost" className="w-full" onClick={backToRoles}>Back to roles</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Citizen access needs no account. Oversight accounts are approved by administrators.
        </p>
      </div>
    </div>
  );
};
