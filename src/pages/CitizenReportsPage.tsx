import { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  CheckCircle, 
  XCircle, 
  Eye,
  MoreVertical
} from 'lucide-react';
import { useReports } from '@/context/ReportsContext';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectsContext';
import { useVerification } from '@/context/VerificationContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { REPORT_STATUSES, formatDate } from '@/utils/constants';
import type { CitizenReport, Project, ReportStatus } from '@/types';

const reportTypeLabel = (type: CitizenReport['type']) => {
  switch (type) {
    case 'project-launch': return 'Launched project';
    case 'project-update': return 'Project progress update';
    case 'project-issue': return 'Previous project issue';
    case 'community-need': return 'Previous community need';
  }
};

const safeEvidenceUrl = (source: string): string | null => {
  try {
    const url = new URL(source);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

export const CitizenReportsPage = () => {
  const { user } = useAuth();
  const { reports, updateReportStatus } = useReports();
  const { projects, addProject, updateProject } = useProjects();
  const { markVerified } = useVerification();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CitizenReport['type'] | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<{ report: CitizenReport | null; action: 'verify' | 'dismiss' | 'note' | null }>({ report: null, action: null });
  const [actionError, setActionError] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = !search || 
        report.title.toLowerCase().includes(search.toLowerCase()) ||
        report.description.toLowerCase().includes(search.toLowerCase()) ||
        report.location.toLowerCase().includes(search.toLowerCase()) ||
        report.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
        report.projectName?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesType = typeFilter === 'all' || report.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const handleVerify = (report: CitizenReport) => {
    setActionError('');
    setShowActionModal({ report, action: 'verify' });
  };

  const handleDismiss = (report: CitizenReport) => {
    setActionError('');
    setShowActionModal({ report, action: 'dismiss' });
  };

  const handleAddNote = (report: CitizenReport) => {
    setActionError('');
    setShowActionModal({ report, action: 'note' });
  };

  const handleConfirmAction = (response: string) => {
    const report = showActionModal.report;
    const action = showActionModal.action;
    if (!report || !action) return;

    if (action === 'verify' && report.type === 'project-launch') {
      if (!report.projectSubmission) {
        setActionError('This project submission is missing its project details and cannot be added to the tracker.');
        return;
      }
      const duplicate = projects.some(project => (
        project.name.trim().toLowerCase() === report.projectSubmission?.name.trim().toLowerCase()
        && project.location.trim().toLowerCase() === report.projectSubmission?.location.trim().toLowerCase()
      ));
      if (duplicate) {
        setActionError('A project with this name and location is already in the tracker. Dismiss this duplicate submission.');
        return;
      }
      const verifiedProject = addProject(report.projectSubmission);
      markVerified(verifiedProject.id);
    }

    if (action === 'verify' && report.type === 'project-update') {
      if (!report.projectId || !report.reportedStatus) {
        setActionError('This project update is missing its project or status and cannot be applied.');
        return;
      }
      const currentProject = projects.find(project => project.id === report.projectId);
      if (!currentProject) {
        setActionError('The tracked project no longer exists, so this update cannot be applied.');
        return;
      }
      const updates: Partial<Omit<Project, 'id'>> = {
        status: report.reportedStatus,
        note: report.description
      };
      if (report.reportedPaidKES !== undefined) updates.paidKES = report.reportedPaidKES;
      if (report.coordinates) updates.coordinates = report.coordinates;
      if (report.evidence?.length) {
        updates.sources = [...new Set([...currentProject.sources, ...report.evidence])];
      }
      if (!updateProject(report.projectId, updates)) {
        setActionError('The tracked project could not be updated.');
        return;
      }
    }

    const newStatus = action === 'verify' ? 'Verified' : action === 'dismiss' ? 'Dismissed' : 'Under review';
    try {
      updateReportStatus(report.id, newStatus, response, user?.name);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not save the report review.');
      return;
    }
    setActionError('');
    setShowActionModal({ report: null, action: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Accountability Reports</h1>
          <p className="text-gray-500">{filteredReports.length} of {reports.length} submissions — Verify project launches and progress updates</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" /> Filters
        </Button>
      </div>

      {actionError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">{actionError}</p>}

      {showFilters && (
        <Card variant="outlined" className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Input
                label="Search"
                placeholder="Title, description, location, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lg:col-span-2"
              />
              <Select
                label="Status"
                options={[{value: 'all', label: 'All Statuses'}, ...REPORT_STATUSES.map(s => ({value: s, label: s}))]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
              />
              <Select
                label="Type"
                options={[
                  {value: 'all', label: 'All Types'},
                  {value: 'project-launch', label: 'Launched Project'},
                  {value: 'project-update', label: 'Project Progress Update'},
                  {value: 'project-issue', label: 'Previous Project Issue'},
                  {value: 'community-need', label: 'Previous Community Need'}
                ]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as CitizenReport['type'] | 'all')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Reference</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Project</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{report.referenceNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{report.title}</td>
                    <td className="px-4 py-3">
                      <span className={`${report.type === 'project-launch' || report.type === 'project-update' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} px-2 py-1 text-xs rounded-full`}>
                        {reportTypeLabel(report.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{report.projectName || report.projectSubmission?.name || report.category || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{report.location}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(report.submittedAt)}</td>
                    <td className="px-4 py-3"><StatusPill status={report.status} type="report" size="sm" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedReport(report); setShowDetailModal(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {report.status === 'New' || report.status === 'Under review' ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleVerify(report)} className="text-green-700 hover:bg-green-50">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDismiss(report)} className="text-red-600 hover:bg-red-50">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">{report.status === 'Verified' ? 'Verified' : 'Dismissed'}</span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleAddNote(report)}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">No reports match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ReportDetailModal 
        report={selectedReport} 
        isOpen={showDetailModal} 
        onClose={() => { setShowDetailModal(false); setSelectedReport(null); }}
      />

      <ActionModal 
        key={`${showActionModal.report?.id || 'none'}-${showActionModal.action || 'none'}`}
        report={showActionModal.report} 
        action={showActionModal.action} 
        isOpen={!!showActionModal.report} 
        onClose={() => setShowActionModal({ report: null, action: null })}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

const ReportDetailModal = ({ report, isOpen, onClose }: { 
  report: CitizenReport | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  if (!report) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={report.title} size="lg" description={`Ref: ${report.referenceNumber} • ${reportTypeLabel(report.type)}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Reference</p><p className="font-mono font-medium">{report.referenceNumber}</p></div>
          <div><p className="text-gray-500">Type</p><p>{reportTypeLabel(report.type)}</p></div>
          <div><p className="text-gray-500">Status</p><p><StatusPill status={report.status} type="report" /></p></div>
          <div><p className="text-gray-500">Submitted</p><p>{formatDate(report.submittedAt)}</p></div>
          <div><p className="text-gray-500">Location</p><p>{report.location}</p></div>
          <div><p className="text-gray-500">County</p><p>{report.county}</p></div>
          {report.projectName && (
            <div className="col-span-2"><p className="text-gray-500">Project</p><p className="font-medium">{report.projectName}</p></div>
          )}
          {report.category && (
            <div className="col-span-2"><p className="text-gray-500">Category</p><p><StatusPill status={report.category} type="funding" size="sm" /></p></div>
          )}
          {report.issueType && (
            <div className="col-span-2"><p className="text-gray-500">Issue Type</p><p>{report.issueType}</p></div>
          )}
          {report.projectSubmission && (
            <>
              <div><p className="text-gray-500">Launch date</p><p>{report.projectSubmission.launchDate || 'Not provided'}</p></div>
              <div><p className="text-gray-500">Sector</p><p>{report.projectSubmission.sector}</p></div>
              <div><p className="text-gray-500">Funder</p><p>{report.projectSubmission.funder}</p></div>
              <div><p className="text-gray-500">Funding type</p><p>{report.projectSubmission.fundingType}</p></div>
              <div><p className="text-gray-500">Contract value</p><p>{report.projectSubmission.valueKES === null ? 'Unknown' : `KES ${report.projectSubmission.valueKES.toLocaleString()}`}</p></div>
              <div><p className="text-gray-500">Amount paid</p><p>{report.projectSubmission.paidKES === null ? 'Unknown' : `KES ${report.projectSubmission.paidKES.toLocaleString()}`}</p></div>
              <div className="col-span-2"><p className="text-gray-500">Reported status</p><p>{report.projectSubmission.status}</p></div>
            </>
          )}
          {report.reportedStatus && (
            <div className="col-span-2"><p className="text-gray-500">Observed status</p><p>{report.reportedStatus}</p></div>
          )}
          {report.reportedPaidKES !== undefined && (
            <div className="col-span-2"><p className="text-gray-500">Reported amount paid</p><p>KES {report.reportedPaidKES.toLocaleString()}</p></div>
          )}
          {report.coordinates
            && Number.isFinite(report.coordinates.latitude)
            && report.coordinates.latitude >= -90
            && report.coordinates.latitude <= 90
            && Number.isFinite(report.coordinates.longitude)
            && report.coordinates.longitude >= -180
            && report.coordinates.longitude <= 180 && (
              <div className="col-span-2">
                <p className="text-gray-500">Captured GPS location</p>
                <a
                  href={`https://www.google.com/maps?q=${report.coordinates.latitude},${report.coordinates.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline"
                >
                  {report.coordinates.latitude.toFixed(6)}, {report.coordinates.longitude.toFixed(6)} — view on map
                </a>
              </div>
            )}
          {report.urgency && (
            <div className="col-span-2"><p className="text-gray-500">Urgency</p><p>{report.urgency}</p></div>
          )}
          <div className="col-span-2"><p className="text-gray-500">Anonymous</p><p>{report.anonymous ? 'Yes' : 'No'}</p></div>
        </div>

        <div>
          <p className="text-gray-500 mb-1">Description</p>
          <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{report.description}</p>
        </div>

        {report.photos.some(photo => photo.startsWith('data:image/')) && (
          <div>
            <p className="text-gray-500 mb-2">Project photos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {report.photos.filter(photo => photo.startsWith('data:image/')).map((photo, index) => (
                <a key={`${index}-${photo.slice(0, 32)}`} href={photo} target="_blank" rel="noreferrer">
                  <img src={photo} alt={`Submitted project evidence ${index + 1}`} className="h-36 w-full rounded-lg object-cover border border-gray-200" />
                </a>
              ))}
            </div>
          </div>
        )}

        {report.evidence && report.evidence.length > 0 && (
          <div>
            <p className="text-gray-500 mb-1">Evidence / sources</p>
            <ul className="list-disc pl-5 space-y-1">
              {report.evidence.map((source, index) => {
                const url = safeEvidenceUrl(source);
                return (
                  <li key={`${source}-${index}`}>
                    {url ? <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">{source}</a> : source}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {report.response && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-medium text-green-800 mb-1">Oversight Response</p>
            <p className="text-green-700">{report.response}</p>
            <p className="text-xs text-green-500 mt-1">
              Reviewed by {report.reviewedBy} on {formatDate(report.reviewedAt || '')}
            </p>
          </div>
        )}

        {report.status === 'New' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              This report is <strong>unverified</strong>. Review the details and mark as Verified or Dismissed.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

const ActionModal = ({ report, action, isOpen, onClose, onConfirm }: { 
  report: CitizenReport | null; 
  action: 'verify' | 'dismiss' | 'note' | null;
  isOpen: boolean; 
  onClose: () => void;
  onConfirm: (response: string) => void;
}) => {
  const [response, setResponse] = useState('');
  useEffect(() => setResponse(''), [report?.id, action]);
  if (!report || !action) return null;
  const titles = {
    verify: 'Mark as Verified',
    dismiss: 'Dismiss Report',
    note: 'Add Internal Note'
  };

  const descriptions = {
    verify: `Verify this ${reportTypeLabel(report.type).toLowerCase()}. New project submissions will be added to the tracker; progress updates will update the existing project.`,
    dismiss: `Dismiss this report. It will not appear in active queues.`,
    note: `Add an internal note for oversight team reference.`
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(response);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[action]} size="md" description={descriptions[action]}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label={action === 'note' ? 'Internal Note' : 'Response to Citizen (optional)'}
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder={action === 'verify' ? 'Optional: Add a response that will be visible to the citizen...' : 
                       action === 'dismiss' ? 'Optional: Reason for dismissal...' : 
                       'Internal note for oversight team...'}
          rows={4}
        />
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={action === 'dismiss' ? 'danger' : 'primary'}>
            {action === 'verify' ? 'Mark Verified' : action === 'dismiss' ? 'Dismiss' : 'Add Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};