import { useMemo, useState } from 'react';
import { 
  FolderKanban, 
  AlertTriangle, 
  Users, 
  Building2, 
  FileText,
  DollarSign,
  Filter,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '@/data/projects';
import { useProjects } from '@/context/ProjectsContext';
import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/context/ReportsContext';
import { useCommunityNeeds } from '@/context/CommunityNeedsContext';
import { useVerification } from '@/context/VerificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { 
  STATUS_COLORS, 
  FUNDING_TYPE_COLORS, 
  PROJECT_STATUSES, 
  FUNDING_TYPES,
  formatDate 
} from '@/utils/constants';
import type { Project, ProjectStatus, FundingType } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const OversightDashboard = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const { reports, getNewReports, updateReportStatus } = useReports();
  const { needs, expressInterest } = useCommunityNeeds();
  const { isVerified, markVerified } = useVerification();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [fundingFilter, setFundingFilter] = useState<FundingType | 'all'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

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

  const stats = useMemo(() => {
    const needingReview = projects.filter(p => 
      ['Delayed', 'Quality review', 'Stalled'].includes(p.status)
    ).length;
    const stalledProjects = projects.filter(p => p.status === 'Stalled').length;
    const totalPaidStalledDelayed = projects
      .filter(p => ['Stalled', 'Delayed'].includes(p.status) && p.paidKES !== null)
      .reduce((sum, p) => sum + (p.paidKES || 0), 0);
    
    const contractorMap = new Map<string, { delayed: number; quality: number }>();
    projects.forEach(p => {
      if (p.contractor && ['Delayed', 'Quality review'].includes(p.status)) {
        const current = contractorMap.get(p.contractor) || { delayed: 0, quality: 0 };
        if (p.status === 'Delayed') current.delayed++;
        if (p.status === 'Quality review') current.quality++;
        contractorMap.set(p.contractor, current);
      }
    });
    const contractorsFlagged = Array.from(contractorMap.values()).filter(
      c => c.delayed + c.quality >= 2
    ).length;

    const newReports = getNewReports().length;

    return {
      projectsMonitored: projects.length,
      projectsNeedingReview: needingReview,
      communityNeeds: needs.length,
      stalledProjects,
      totalPaidOnStalledDelayed: totalPaidStalledDelayed,
      contractorsFlagged,
      citizenReportsNew: newReports
    };
  }, [needs.length, getNewReports]);

  const statusChartData = useMemo(() => {
    const counts = PROJECT_STATUSES.map(status => 
      filteredProjects.filter(p => p.status === status).length
    );
    return {
      labels: PROJECT_STATUSES,
      datasets: [{
        label: 'Projects',
        data: counts,
        backgroundColor: PROJECT_STATUSES.map(s => STATUS_COLORS[s].border),
        borderRadius: 6
      }]
    };
  }, [filteredProjects]);

  const fundingChartData = useMemo(() => {
    const counts = FUNDING_TYPES.map(type => 
      filteredProjects.filter(p => p.fundingType === type).length
    );
    return {
      labels: FUNDING_TYPES,
      datasets: [{
        data: counts,
        backgroundColor: FUNDING_TYPES.map(t => FUNDING_TYPE_COLORS[t].border),
        borderWidth: 0
      }]
    };
  }, [filteredProjects]);

  const latestReports = useMemo(() => 
    reports.slice(0, 5).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [reports]
  );

  const handleFlagProject = (project: Project) => {
    alert(`Project "${project.name}" flagged for audit/review. Internal note added.`);
  };

  const handleVerifyReport = (reportId: string) => {
    updateReportStatus(reportId, 'Verified', 'Verified by oversight team', user?.name);
  };

  const handleExpressInterest = (needId: string) => {
    expressInterest(needId, user?.name || 'Oversight Officer');
    alert('Interest expressed. The community need coordinator will contact you.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oversight Dashboard</h1>
          <p className="text-gray-500">Tharaka-Nithi County — Project Monitoring & Accountability</p>
        </div>
        <Button variant="outline" onClick={() => setShowAddProjectModal(true)}>
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Projects Monitored" 
          value={stats.projectsMonitored} 
          icon={FolderKanban} 
          color="green"
        />
        <StatCard 
          title="Projects Needing Review" 
          value={stats.projectsNeedingReview} 
          icon={AlertTriangle} 
          color="orange"
          subtitle="Delayed, Quality Review, Stalled"
        />
        <StatCard 
          title="Stalled Projects" 
          value={stats.stalledProjects} 
          icon={AlertTriangle} 
          color="red"
        />
        <StatCard 
          title="Total Paid (Stalled/Delayed)" 
          value={formatCurrency(stats.totalPaidOnStalledDelayed)} 
          icon={DollarSign} 
          color="blue"
        />
        <StatCard 
          title="Community Needs" 
          value={stats.communityNeeds} 
          icon={Users} 
          color="purple"
        />
        <StatCard 
          title="Contractors Flagged" 
          value={stats.contractorsFlagged} 
          icon={Building2} 
          color="red"
          subtitle="≥2 delayed/quality issues"
        />
        <StatCard 
          title="New Citizen Reports" 
          value={stats.citizenReportsNew} 
          icon={FileText} 
          color="blue"
          subtitle="Awaiting review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Projects by Status
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All</option>
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={statusChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by Funding Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={fundingChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Project Monitoring</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-1" /> Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <Input
                label="Search"
                placeholder="Project, contractor, funder, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                options={[{value: 'all', label: 'All Sectors'}, ...['Water', 'Health', 'Education', 'Transport'].map(s => ({value: s, label: s}))]}
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              />
              <Select
                label="Location"
                options={[{value: 'all', label: 'All Locations'}, ...['Chuka', 'Marimanti', 'Gatunga, Tharaka South', 'Chiakariga to Igambang\'ombe', 'Marimanti Town', 'Kathwana', 'Tunyai, Tharaka North', 'Mitheru, Chuka', 'Nkondi, Tharaka South', 'Chuka University', 'Gatue, Maara', 'Karingani, Tharaka North', 'Ishiara to Munyi', 'Mugwe, Chuka', 'Kamanyaki, Tharaka South', 'Kierera, Chuka', 'Tunta, Maara', 'Kamweline, Tharaka South', 'Chogoria, Maara', 'Mukothima, Tharaka North', 'Nkubu to Nkondi'].map(l => ({value: l, label: l}))]}
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Funder</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map(project => (
                <TableRow key={project.id} onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusPill status={project.fundingType} type="funding" size="sm" />
                      <span className="text-sm text-gray-600">{project.funder}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.contractor ? (
                      <span className="font-medium">{project.contractor}</span>
                    ) : (
                      <span className="text-gray-400 italic">Not yet published</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={project.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleFlagProject(project); }}>
                        Flag
                      </Button>
                      {project.contractor && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); alert(`Viewing other projects by ${project.contractor}`); }}>
                          Contractor
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No projects match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Citizen Reports (Latest)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {latestReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No citizen reports yet.</p>
              ) : (
                latestReports.map(report => (
                  <div key={report.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{report.title}</span>
                          <StatusPill status={report.status} type="report" size="sm" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>{report.projectName || 'Community Need'}</span>
                          <span>{report.location}</span>
                          <span>{formatDate(report.submittedAt)}</span>
                          <span>Ref: {report.referenceNumber}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === 'New' && (
                          <Button size="sm" onClick={() => handleVerifyReport(report.id)}>
                            Mark Verified
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => alert('View report details')}>
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community Needs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {needs.map(need => (
                <div key={need.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{need.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{need.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <StatusPill status={need.category} type="funding" size="sm" />
                        <span>{need.location}</span>
                        <span>Support: {need.supportNeeded}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExpressInterest(need.id)}
                    >
                      Express Interest
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjectDetailModal 
        project={selectedProject} 
        isOpen={showDetailModal} 
        onClose={() => { setShowDetailModal(false); setSelectedProject(null); }}
        isVerified={selectedProject ? isVerified(selectedProject.id) : false}
        onVerify={selectedProject ? () => markVerified(selectedProject.id) : undefined}
      />

      <AddProjectModal 
        isOpen={showAddProjectModal} 
        onClose={() => setShowAddProjectModal(false)}
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'orange' | 'red' | 'blue' | 'purple';
  subtitle?: string;
}) => {
  const colors = {
    green: 'bg-green-50 text-green-800 border-green-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200'
  };

  return (
    <Card variant="outlined" className={`border-l-4 ${colors[color].replace('bg-', 'border-l-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
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
  const { projects } = useProjects();
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

const AddProjectModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: '', sector: '', location: '', fundingType: 'Government' as FundingType,
    funder: '', contractor: '', valueKES: '', paidKES: '', status: 'On track' as ProjectStatus, note: '', sources: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Project name is required';
    if (!formData.sector) newErrors.sector = 'Sector is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.funder) newErrors.funder = 'Funder is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    alert('Project added successfully! (Demo mode - not persisted)');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Project" size="xl" description="Enter details for a new Tharaka-Nithi project from tender records or audit reports">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Input label="Project Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} error={errors.name} />
        <Select label="Sector" options={['Water', 'Health', 'Education', 'Transport'].map(s => ({value: s, label: s}))} value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} error={errors.sector} placeholder="Select sector" />
        <Input label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} error={errors.location} placeholder="e.g., Chuka, Marimanti" />
        <Select label="Funding Type" options={FUNDING_TYPES.map(t => ({value: t, label: t}))} value={formData.fundingType} onChange={e => setFormData({...formData, fundingType: e.target.value as FundingType})} />
        <Input label="Funder" value={formData.funder} onChange={e => setFormData({...formData, funder: e.target.value})} error={errors.funder} placeholder="e.g., National Treasury, World Vision" />
        <Input label="Contractor (optional)" value={formData.contractor} onChange={e => setFormData({...formData, contractor: e.target.value})} placeholder="Leave blank if not yet published" />
        <Input label="Contract Value (KES)" type="number" value={formData.valueKES} onChange={e => setFormData({...formData, valueKES: e.target.value})} placeholder="e.g., 185000000" />
        <Input label="Amount Paid (KES)" type="number" value={formData.paidKES} onChange={e => setFormData({...formData, paidKES: e.target.value})} placeholder="e.g., 142000000" />
        <Select label="Status" options={PROJECT_STATUSES.map(s => ({value: s, label: s}))} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})} />
        <div className="lg:col-span-2">
          <Textarea label="Project Note" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Key details, progress, issues..." rows={3} />
        </div>
        <div className="lg:col-span-2">
          <Textarea label="Sources (one per line)" value={formData.sources} onChange={e => setFormData({...formData, sources: e.target.value})} placeholder="Controller of Budget Report Q3 2024\nDaily Nation article July 2024" rows={3} />
        </div>
        <div className="lg:col-span-2 flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Project</Button>
        </div>
      </form>
    </Modal>
  );
};