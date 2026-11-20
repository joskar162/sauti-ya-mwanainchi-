import { useState } from 'react';
import { ShieldCheck, Users, Building2, User, Heart, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export const LoginPage = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'oversight' | 'citizen' | null>(null);
  const [name, setName] = useState('');
  const [county, setCounty] = useState('Tharaka-Nithi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    login(selectedRole, name || (selectedRole === 'oversight' ? 'Oversight Officer' : 'Citizen'), county);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-800 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Build Kenya</h1>
          <p className="text-gray-500 mt-2">Project Accountability Platform</p>
        </div>

        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Select your role to access the appropriate dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Choose your role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('oversight')}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all duration-200
                      ${selectedRole === 'oversight' 
                        ? 'border-green-800 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    aria-pressed={selectedRole === 'oversight'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-800" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Oversight & Funders</p>
                        <p className="text-xs text-gray-500">NGOs, Donors, Auditor-General</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('citizen')}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all duration-200
                      ${selectedRole === 'citizen' 
                        ? 'border-green-800 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    aria-pressed={selectedRole === 'citizen'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-800" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Citizen</p>
                        <p className="text-xs text-gray-500">Report issues & track projects</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <Input
                  label="Your name (optional)"
                  placeholder={selectedRole === 'oversight' ? 'Oversight Officer' : 'Your name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {selectedRole === 'citizen' && (
                <div>
                  <Input
                    label="Your county"
                    placeholder="Enter your county"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={!selectedRole}>
                {selectedRole === 'oversight' ? 'Access Oversight Dashboard' : 'Access Citizen Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Demo mode — no real authentication. Data is illustrative only.
        </p>
      </div>
    </div>
  );
};