import { useMemo, useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  MapPin, 
  Building2, 
  DollarSign, 
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
import { projects, getUniqueContractors, getUniqueFunders, getUniqueSectors, getUniqueLocations, formatCurrency } from '@/data/projects';
import { useVerification } from '@/context/VerificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  STATUS_COLORS, 
  FUNDING_TYPE_COLORS, 
  PROJECT_STATUSES, 
  FUNDING_TYPES,
  formatDate 
} from '@/utils/constants';
import type { Project, ProjectStatus, FundingType } from '@/types';

export const ProjectsPage = () => {
  const { isVerified, markVerified } = useVerification();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [fundingFilter, setFundingFilter] = useState<FundingType | 'all'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !search || 
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.contractor?.toLowerCase().includes(search.toLowerCase()) ||
        project.funder.toLowerCase().includes(search.toLowerCase()) ||
        project.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesFunding = fundingFilter === 'all' || project.fundingType === fundingFilter;
      const matchesSector = sectorFilter === 'all' || project.sector === sectorFilter;
      const matchesLocation = locationFilter === 'all' || project.location === locationFilter;
      return matchesSearch && matchesStatus && matchesFunding && matchesSector && matchesLocation;
    });
  }, [search, statusFilter, fundingFilter, sectorFilter, locationFilter]);

  const uniqueContractors = getUniqueContractors();
  const uniqueFunders = getUniqueFunders();
  const uniqueSectors = getUniqueSectors();
  const uniqueLocations = getUniqueLocations();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
          <p className="text-gray-500">{filteredProjects.length} of {projects.length} projects — Tharaka-Nithi County</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-1" /> Filters
          </Button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button 
              onClick={() => setViewMode('cards')} 
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'cards' ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              aria-pressed={viewMode === 'cards'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'table' ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              aria-pressed={viewMode === 'table'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <Card variant="outlined" className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <Input
                label="Search"
                placeholder="Project, contractor, funder, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lg:col-span-2"
              />
              <Select
                label="Status"
                options={[{value: 'all', label: 'All Statuses'}, ...PROJECT_STATUSES.map(s => ({value: s, label: s}))]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              />
              <Select
                label="Funding Type"
                options={[{value: 'all', label: 'All Types'}, ...FUNDING_TYPES.map(t => ({value: t, label: t}))]}
                value={fundingFilter}
                onChange={(e) => setFundingFilter(e.target.value as FundingType | 'all')}
              />
              <Select
                label="Sector"
                options={[{value: 'all', label: 'All Sectors'}, ...uniqueSectors.map(s => ({value: s, label: s}))]}
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              />
              <Select
                label="Location"
                options={[{value: 'all', label: 'All Locations'}, ...uniqueLocations.map(l => ({value: l, label: l}))]}
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            {search || statusFilter !== 'all' || fundingFilter !== 'all' || sectorFilter !== 'all' || locationFilter !== 'all' ? (
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => {
                setSearch(''); setStatusFilter('all'); setFundingFilter('all'); setSectorFilter('all'); setLocationFilter('all');
              }}>
                Clear all filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              isVerified={isVerified(project.id)}
              onVerify={() => markVerified(project.id)}
              onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}
            />
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No projects match your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Project</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Sector</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Funding</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Contractor</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Value</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Paid</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}>
                      <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
                      <td className="px-4 py-3 text-gray-600">{project.location}</td>
                      <td className="px-4 py-3"><StatusPill status={project.sector} type="funding" size="sm" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusPill status={project.fundingType} type="funding" size="sm" />
                          <span className="text-xs text-gray-500">{project.funder}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {project.contractor ? (
                          <span className="font-medium">{project.contractor}</span>
                        ) : (
                          <span className="text-gray-400 italic">Not yet published</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{project.valueKES !== null ? formatCurrency(project.valueKES) : 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-600">{project.paidKES !== null ? formatCurrency(project.paidKES) : 'Unknown'}</td>
                      <td className="px-4 py-3"><StatusPill status={project.status} size="sm" /></td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedProject(project); setShowDetailModal(true); }}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">No projects match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ProjectDetailModal 
        project={selectedProject} 
        isOpen={showDetailModal} 
        onClose={() => { setShowDetailModal(false); setSelectedProject(null); }}
        isVerified={selectedProject ? isVerified(selectedProject.id) : false}
        onVerify={selectedProject ? () => markVerified(selectedProject.id) : undefined}
      />
    </div>
  );
};

const ProjectCard = ({ project, isVerified, onVerify, onClick }: { 
  project: Project; 
  isVerified: boolean;
  onVerify: () => void;
  onClick: () => void;
}) => {
  const statusColors = STATUS_COLORS[project.status];
  const fundingColors = FUNDING_TYPE_COLORS[project.fundingType];

  return (
    <Card variant="outlined" className="h-full transition-shadow hover:shadow-md" onClick={onClick}>
      <CardContent className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 pr-2">{project.name}</h3>
          <StatusPill status={project.status} size="sm" />
        </div>

        <div className="space-y-3 text-sm flex-1">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{project.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={project.fundingType} type="funding" size="sm" />
            <span className="text-gray-600 truncate">{project.funder}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {project.contractor ? (
                <span className="font-medium">{project.contractor}</span>
              ) : (
                <span className="text-gray-400 italic">Not yet published</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Value: {project.valueKES !== null ? formatCurrency(project.valueKES) : 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Paid: {project.paidKES !== null ? formatCurrency(project.paidKES) : 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex-shrink-0" />
            <span className="truncate text-gray-600">{project.note}</span>
          </div>
        </div>

        {!isVerified && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <strong>Needs verification</strong>
              </span>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onVerify(); }}>
                Verify
              </Button>
            </div>
            <p className="text-xs text-amber-700 mt-1">Not verified against official project records.</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            View Details
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); alert('Report issue functionality'); }}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Report Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectDetailModal = ({ project, isOpen, onClose, isVerified, onVerify }: { 
  project: Project | null; 
  isOpen: boolean; 
  onClose: () => void;
  isVerified: boolean;
  onVerify?: () => void;
}) => {
  if (!project) return null;

  const otherProjects = project.contractor 
    ? projects.filter(p => p.contractor === project.contractor && p.id !== project.id)
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project.name} size="xl" description={`${project.sector} • ${project.location} • ${project.fundingType}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Overview</h4>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><StatusPill status={project.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Funding Type</dt><dd><StatusPill status={project.fundingType} type="funding" /></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Funder</dt><dd className="text-right">{project.funder}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Contractor</dt><dd className="text-right">{project.contractor || <span className="text-gray-400 italic">Not yet published</span>}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Contract Value</dt><dd className="text-right">{project.valueKES !== null ? formatCurrency(project.valueKES) : 'Unknown'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Amount Paid</dt><dd className="text-right">{project.paidKES !== null ? formatCurrency(project.paidKES) : 'Unknown'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Location</dt><dd className="text-right">{project.location}</dd></div>
            </dl>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Project Note</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{project.note}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Sources</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {project.sources.map((source, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>{source}</span>
                </li>
              ))}
            </ul>
          </div>

          {!isVerified && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Needs verification</strong> — This project has not been verified against official records.
              </span>
              <Button size="sm" variant="secondary" onClick={onVerify}>
                Mark Verified
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {project.contractor && otherProjects.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Other Projects by {project.contractor}</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {otherProjects.map(p => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="font-medium text-sm">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <StatusPill status={p.status} size="sm" />
                      <span>{p.location}</span>
                      <span>{p.fundingType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => alert('Flag for audit functionality')}>
                <AlertTriangle className="w-4 h-4 mr-1" /> Flag for Audit
              </Button>
              <Button variant="outline" onClick={() => alert('Add internal note functionality')}>
                <FileText className="w-4 h-4 mr-1" /> Add Internal Note
              </Button>
              <Button variant="outline" onClick={() => alert('Report issue functionality')}>
                <AlertTriangle className="w-4 h-4 mr-1" /> Report Issue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};