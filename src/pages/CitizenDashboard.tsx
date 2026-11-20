import { useState } from 'react';
import { 
  AlertTriangle, 
  PlusCircle, 
  FolderKanban, 
  FileText,
  MapPin,
  ShieldCheck,
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/context/ReportsContext';
import { projects, formatCurrency } from '@/data/projects';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { NEED_CATEGORIES, URGENCY_LEVELS, ISSUE_TYPE_LABELS, formatDate } from '@/utils/constants';
import type { Project, IssueType, NeedCategory } from '@/types';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const { getReportsByUser } = useReports();
  const myReports = getReportsByUser(user?.id || '');
  const countyProjects = projects.filter(p => p.location.includes(user?.county || 'Tharaka-Nithi'));

  const pendingReports = myReports.filter(r => ['New', 'Under review'].includes(r.status)).length;
  const resolvedReports = myReports.filter(r => ['Verified', 'Dismissed'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}! Track projects and reports in {user?.county}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="My Reports" value={myReports.length} icon={FileText} color="blue" subtitle={`${pendingReports} pending, ${resolvedReports} resolved`} />
        <StatCard title="Projects in My County" value={countyProjects.length} icon={FolderKanban} color="green" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-green-800" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 p-4" size="lg" onClick={() => alert('Navigate to report project issue')}>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Report a Project Issue</p>
                <p className="text-sm text-gray-500">Delayed, abandoned, poor quality, or corruption concern</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 p-4" size="lg" onClick={() => alert('Navigate to report community need')}>
              <div className="p-3 bg-green-100 rounded-lg">
                <PlusCircle className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Report a Community Need</p>
                <p className="text-sm text-gray-500">Water, health, education, transport or other needs</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              My Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {myReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports submitted yet.</p>
              ) : (
                myReports.slice(0, 5).map(report => (
                  <div key={report.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">{report.title}</span>
                          <StatusPill status={report.status} type="report" size="sm" />
                        </div>
                        <p className="text-sm text-gray-600 truncate">{report.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{report.type === 'project-issue' ? 'Project Issue' : 'Community Need'}</span>
                          <span>{report.location}</span>
                          <span>{formatDate(report.submittedAt)}</span>
                          <span className="font-mono">Ref: {report.referenceNumber}</span>
                        </div>
                        {report.response && (
                          <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded">
                            Response: {report.response}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-green-800" />
            Projects in {user?.county}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countyProjects.map(project => (
              <CitizenProjectCard key={project.id} project={project} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Important Notice</p>
            <p className="text-sm text-amber-700 mt-1">
              All projects shown are compiled from public sources and are <strong>not verified against official records</strong>. 
              Citizen reports are <strong>unverified until reviewed</strong> by oversight bodies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: { 
  title: string; 
  value: number; 
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'blue';
  subtitle?: string;
}) => {
  const colors = {
    green: 'bg-green-50 text-green-800 border-green-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200'
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

const CitizenProjectCard = ({ project }: { project: Project }) => {
  return (
    <Card variant="outlined" className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-base line-clamp-2 flex-1 pr-2">{project.name}</h3>
          <StatusPill status={project.status} size="sm" />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{project.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {project.contractor ? (
                <span className="font-medium">Contractor: {project.contractor}</span>
              ) : (
                <span className="text-gray-400 italic">Contractor not yet published</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="w-4 h-4 flex-shrink-0" />
            <span>Progress: {project.note.split('.')[0]}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <p>Funded by: {project.funder}</p>
          <p>Value: {project.valueKES !== null ? formatCurrency(project.valueKES) : 'Unknown'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const ReportProjectIssuePage = () => {
  const { user } = useAuth();
  const { addReport } = useReports();
  const [formData, setFormData] = useState({
    projectId: '', issueType: 'Delayed' as IssueType, description: '', 
    location: '', county: user?.county || 'Tharaka-Nithi', anonymous: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<{ ref: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.projectId) newErrors.projectId = 'Please select a project';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const project = projects.find((p: Project) => p.id === formData.projectId);
    addReport({
      type: 'project-issue',
      projectId: formData.projectId,
      projectName: project?.name,
      title: `${ISSUE_TYPE_LABELS[formData.issueType]}: ${project?.name || 'Unknown Project'}`,
      issueType: formData.issueType,
      description: formData.description,
      location: formData.location,
      county: formData.county,
      photos: [],
      anonymous: formData.anonymous,
      submittedBy: user?.id || 'anonymous'
    });
    const ref = `BK-${Date.now().toString(36).toUpperCase()}`;
    setSubmitted({ ref });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted Successfully</h2>
          <p className="text-gray-600 mb-6">Your report has been received and will be reviewed by oversight bodies.</p>
          <div className="p-4 bg-gray-50 rounded-lg text-left mb-6">
            <p className="font-medium text-gray-900">Reference Number</p>
            <p className="text-2xl font-mono text-green-800 mt-1">{submitted.ref}</p>
            <p className="text-sm text-gray-500 mt-2">Save this number to track your report status.</p>
          </div>
          <Button onClick={() => setSubmitted(null)}>Submit Another Report</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report a Project Issue</h1>
        <p className="text-gray-500">Report problems with existing infrastructure projects in your area.</p>
      </div>

      <Card variant="elevated" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Select Project"
            options={[{value: '', label: 'Select a project...'}, ...projects.map((p: Project) => ({value: p.id, label: `${p.name} (${p.location})`}))]}
            value={formData.projectId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, projectId: e.target.value})}
            error={errors.projectId}
          />
          <Select
            label="Issue Type"
            options={Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => ({value, label}))}
            value={formData.issueType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, issueType: e.target.value as IssueType})}
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
            error={errors.description}
            placeholder="Describe the issue in detail: what you observed, when, and any other relevant information..."
            rows={4}
          />
          <Input
            label="Location / Village"
            value={formData.location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})}
            error={errors.location}
            placeholder="e.g., Kamwathu village, near the water tank"
          />
          <Input
            label="County"
            value={formData.county}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, county: e.target.value})}
            disabled
          />
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.anonymous}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, anonymous: e.target.checked})}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-green-800 focus:ring-2 focus:ring-green-800"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              <span className="font-medium">Submit anonymously</span>
              <p className="text-gray-500">Your name will not be shared with the project contractors or funders.</p>
            </label>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Reports are unverified until reviewed by oversight bodies. 
              Your report will be added to the review queue with status "New".
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => alert('Navigate back')}>Cancel</Button>
            <Button type="submit">Submit Report</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const ReportCommunityNeedPage = () => {
  const { user } = useAuth();
  const { addReport } = useReports();
  const [formData, setFormData] = useState({
    title: '', category: 'Water' as NeedCategory, description: '', 
    location: '', county: user?.county || 'Tharaka-Nithi', urgency: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical', anonymous: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<{ ref: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    addReport({
      type: 'community-need',
      title: formData.title,
      category: formData.category,
      description: formData.description,
      location: formData.location,
      county: formData.county,
      photos: [],
      anonymous: formData.anonymous,
      submittedBy: user?.id || 'anonymous'
    });
    const ref = `BK-${Date.now().toString(36).toUpperCase()}`;
    setSubmitted({ ref });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Need Reported</h2>
          <p className="text-gray-600 mb-6">Your report has been received and added to the community needs list for funders to review.</p>
          <div className="p-4 bg-gray-50 rounded-lg text-left mb-6">
            <p className="font-medium text-gray-900">Reference Number</p>
            <p className="text-2xl font-mono text-green-800 mt-1">{submitted.ref}</p>
            <p className="text-sm text-gray-500 mt-2">Save this number to track your report status.</p>
          </div>
          <Button onClick={() => setSubmitted(null)}>Submit Another Report</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report a Community Need</h1>
        <p className="text-gray-500">Tell us about infrastructure gaps in your community that need funding support.</p>
      </div>

      <Card variant="elevated" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, title: e.target.value})}
            error={errors.title}
            placeholder="e.g., Kamwathu Village Borehole"
          />
          <Select
            label="Category"
            options={NEED_CATEGORIES.map(c => ({value: c, label: c}))}
            value={formData.category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, category: e.target.value as NeedCategory})}
            error={errors.category}
            placeholder="Select category"
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
            error={errors.description}
            placeholder="Describe the need: who is affected, what the current situation is, and what would help..."
            rows={4}
          />
          <Input
            label="Location / Village"
            value={formData.location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})}
            error={errors.location}
            placeholder="e.g., Kamwathu, Tharaka South"
          />
          <Select
            label="Urgency"
            options={URGENCY_LEVELS.map(u => ({value: u, label: u}))}
            value={formData.urgency}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, urgency: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical'})}
          />
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="anonymous-need"
              checked={formData.anonymous}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, anonymous: e.target.checked})}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-green-800 focus:ring-2 focus:ring-green-800"
            />
            <label htmlFor="anonymous-need" className="text-sm text-gray-700">
              <span className="font-medium">Submit anonymously</span>
              <p className="text-gray-500">Your name will not be publicly displayed.</p>
            </label>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Reports are unverified until reviewed. This need will be added to the public 
              community needs list for funders and oversight bodies to see.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => alert('Navigate back')}>Cancel</Button>
            <Button type="submit">Submit Report</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const MyReportsPage = () => {
  const { user } = useAuth();
  const { getReportsByUser } = useReports();
  const myReports = getReportsByUser(user?.id || '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-500">Track the status of all your submitted reports.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {myReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports submitted yet.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="outline" onClick={() => alert('Navigate to report project issue')}>
                  <AlertTriangle className="w-4 h-4 mr-1" /> Report Project Issue
                </Button>
                <Button onClick={() => alert('Navigate to report community need')}>
                  <PlusCircle className="w-4 h-4 mr-1" /> Report Community Need
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myReports.map(report => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-medium text-gray-900">{report.title}</span>
                        <StatusPill status={report.status} type="report" />
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {report.type === 'project-issue' ? 'Project Issue' : 'Community Need'}
                        </span>
                        <span className="text-sm text-gray-500 font-mono">Ref: {report.referenceNumber}</span>
                      </div>
                      <p className="text-gray-600 mb-3">{report.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span><MapPin className="w-4 h-4 inline mr-1" /> {report.location}</span>
                        <span><Clock className="w-4 h-4 inline mr-1" /> Submitted: {formatDate(report.submittedAt)}</span>
                        {report.anonymous && <span><ShieldCheck className="w-4 h-4 inline mr-1" /> Anonymous</span>}
                      </div>
                      {report.response && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="font-medium text-green-800 mb-1">Oversight Response</p>
                          <p className="text-green-700">{report.response}</p>
                          <p className="text-xs text-green-500 mt-1">
                            Reviewed by {report.reviewedBy} on {formatDate(report.reviewedAt || '')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4">
                      {report.status === 'New' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Awaiting Review</span>
                      )}
                      {report.status === 'Under review' && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">Under Review</span>
                      )}
                      {report.status === 'Verified' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Verified</span>
                      )}
                      {report.status === 'Dismissed' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Dismissed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Reminder:</strong> All citizen reports are unverified until reviewed by oversight bodies. 
          Reference numbers allow you to track status but do not guarantee verification.
        </p>
      </div>
    </div>
  );
};