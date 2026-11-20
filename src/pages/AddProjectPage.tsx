import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/context/ProjectsContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { FUNDING_TYPES, PROJECT_STATUSES } from '@/utils/constants';
import type { FundingType, ProjectStatus } from '@/types';

export const AddProjectPage = () => {
  const navigate = useNavigate();
  const { addProject } = useProjects();
  const [formData, setFormData] = useState({
    name: '', sector: '', location: '', fundingType: 'Government' as FundingType,
    funder: '', contractor: '', valueKES: '', paidKES: '',
    status: 'On track' as ProjectStatus, note: '', sources: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Project name is required';
    if (!formData.sector) nextErrors.sector = 'Sector is required';
    if (!formData.location.trim()) nextErrors.location = 'Location is required';
    if (!formData.funder.trim()) nextErrors.funder = 'Funder is required';
    if (!formData.note.trim()) nextErrors.note = 'Project note is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    addProject({
      name: formData.name.trim(),
      sector: formData.sector,
      location: formData.location.trim(),
      fundingType: formData.fundingType,
      funder: formData.funder.trim(),
      contractor: formData.contractor.trim() || null,
      valueKES: formData.valueKES ? Number(formData.valueKES) : null,
      paidKES: formData.paidKES ? Number(formData.paidKES) : null,
      status: formData.status,
      note: formData.note.trim(),
      sources: formData.sources
        .split('\n')
        .map(source => source.trim())
        .filter(Boolean)
    });
    navigate('/projects');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Project</h1>
        <p className="text-gray-500">Add a Tharaka-Nithi project from an official or public report.</p>
      </div>

      <Card variant="elevated" padding="lg">
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Project name" value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} error={errors.name} />
            <Select label="Sector" value={formData.sector} onChange={event => setFormData({ ...formData, sector: event.target.value })} error={errors.sector} placeholder="Select sector" options={['Water', 'Health', 'Education', 'Transport'].map(sector => ({ value: sector, label: sector }))} />
            <Input label="Location" value={formData.location} onChange={event => setFormData({ ...formData, location: event.target.value })} error={errors.location} />
            <Select label="Funding type" value={formData.fundingType} onChange={event => setFormData({ ...formData, fundingType: event.target.value as FundingType })} options={FUNDING_TYPES.map(type => ({ value: type, label: type }))} />
            <Input label="Funder" value={formData.funder} onChange={event => setFormData({ ...formData, funder: event.target.value })} error={errors.funder} />
            <Input label="Contractor (optional)" value={formData.contractor} onChange={event => setFormData({ ...formData, contractor: event.target.value })} placeholder="Leave blank if not yet published" />
            <Input label="Contract value (KES)" type="number" value={formData.valueKES} onChange={event => setFormData({ ...formData, valueKES: event.target.value })} placeholder="Unknown if not available" />
            <Input label="Amount paid (KES)" type="number" value={formData.paidKES} onChange={event => setFormData({ ...formData, paidKES: event.target.value })} placeholder="Unknown if not available" />
            <Select label="Status" value={formData.status} onChange={event => setFormData({ ...formData, status: event.target.value as ProjectStatus })} options={PROJECT_STATUSES.map(status => ({ value: status, label: status }))} />
            <div className="md:col-span-2">
              <Textarea label="Project note" value={formData.note} onChange={event => setFormData({ ...formData, note: event.target.value })} error={errors.note} rows={4} />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Sources (one per line)" value={formData.sources} onChange={event => setFormData({ ...formData, sources: event.target.value })} rows={4} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>Cancel</Button>
              <Button type="submit">Save Project</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
