import { useState, useMemo } from 'react';
import { 
  Filter, 
  CheckCircle, 
  XCircle, 
  Eye,
  MoreVertical
} from 'lucide-react';
import { useReports } from '@/context/ReportsContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { REPORT_STATUSES, formatDate } from '@/utils/constants';
import type { CitizenReport, ReportStatus } from '@/types';

export const CitizenReportsPage = () => {
  const { user } = useAuth();
  const { reports, updateReportStatus } = useReports();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'project-issue' | 'community-need'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<{ report: CitizenReport | null; action: 'verify' | 'dismiss' | 'note' | null }>({ report: null, action: null });

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
    setShowActionModal({ report, action: 'verify' });
  };

  const handleDismiss = (report: CitizenReport) => {
    setShowActionModal({ report, action: 'dismiss' });
  };

  const handleAddNote = (report: CitizenReport) => {
    setShowActionModal({ report, action: 'note' });
  };

  const handleConfirmAction = (response: string) => {
    if (showActionModal.report && showActionModal.action) {
      const newStatus = showActionModal.action === 'verify'
        ? 'Verified'
        : showActionModal.action === 'dismiss'
          ? 'Dismissed'
          : 'Under review';
      updateReportStatus(showActionModal.report.id, newStatus, response, user?.name);
      setShowActionModal({ report: null, action: null });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citizen Reports</h1>
          <p className="text-gray-500">{filteredReports.length} of {reports.length} reports — Review and verify citizen submissions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" /> Filters
        </Button>
      </div>

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
                  {value: 'project-issue', label: 'Project Issue'},
                  {value: 'community-need', label: 'Community Need'}
                ]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'project-issue' | 'community-need')}
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
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Project / Need</th>
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
                      <span className={`${report.type === 'project-issue' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} px-2 py-1 text-xs rounded-full`}>
                        {report.type === 'project-issue' ? 'Project Issue' : 'Community Need'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{report.projectName || report.category || '-'}</td>
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
    <Modal isOpen={isOpen} onClose={onClose} title={report.title} size="lg" description={`Ref: ${report.referenceNumber} • ${report.type === 'project-issue' ? 'Project Issue' : 'Community Need'}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Reference</p><p className="font-mono font-medium">{report.referenceNumber}</p></div>
          <div><p className="text-gray-500">Type</p><p>{report.type === 'project-issue' ? 'Project Issue' : 'Community Need'}</p></div>
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
          {report.urgency && (
            <div className="col-span-2"><p className="text-gray-500">Urgency</p><p>{report.urgency}</p></div>
          )}
          <div className="col-span-2"><p className="text-gray-500">Anonymous</p><p>{report.anonymous ? 'Yes' : 'No'}</p></div>
        </div>

        <div>
          <p className="text-gray-500 mb-1">Description</p>
          <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{report.description}</p>
        </div>

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
  if (!report || !action) return null;

  const [response, setResponse] = useState('');

  const titles = {
    verify: 'Mark as Verified',
    dismiss: 'Dismiss Report',
    note: 'Add Internal Note'
  };

  const descriptions = {
    verify: `Confirm that this ${report.type === 'project-issue' ? 'project issue' : 'community need'} has been verified.`,
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