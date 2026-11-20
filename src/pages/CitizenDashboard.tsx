import { useNavigate } from 'react-router-dom';
import { Activity, CalendarDays, FileText, FolderKanban, MapPin, PlusCircle } from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectsContext';
import { useReports } from '@/context/ReportsContext';
import { formatCurrency } from '@/data/projects';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate } from '@/utils/constants';
import type { CitizenReport, Project } from '@/types';

const reportTypeLabel = (type: CitizenReport['type']) => {
  switch (type) {
    case 'project-launch': return 'Launched project';
    case 'project-update': return 'Project progress update';
    case 'project-issue': return 'Previous project issue';
    case 'community-need': return 'Previous community need';
  }
};

export const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { getReportsByUser } = useReports();
  const myReports = getReportsByUser(user?.id || '');
  const county = user?.county || 'Tharaka-Nithi';
  const countyProjects = projects.filter(project => project.location.toLowerCase().includes(county.toLowerCase()));
  const activeSubmissions = myReports.filter(report => ['New', 'Under review'].includes(report.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}! Follow launched projects and submit accountability updates in {county}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="My Submissions" value={myReports.length} icon={FileText} color="blue" subtitle={`${activeSubmissions} awaiting oversight review`} />
        <StatCard title="Projects in My County" value={countyProjects.length} icon={FolderKanban} color="green" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-green-800" />
              Project Accountability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 p-4" size="lg" onClick={() => navigate('/citizen/report-launched-project')}>
              <div className="p-3 bg-green-100 rounded-lg">
                <FolderKanban className="w-6 h-6 text-green-700" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Report a Launched Project</p>
                <p className="text-sm text-gray-500">Submit a project not yet in the tracker</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 p-4" size="lg" onClick={() => navigate('/citizen/report-project-update')}>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-700" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Report Project Progress</p>
                <p className="text-sm text-gray-500">Share an update on a tracked project</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              My Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {myReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No project submissions yet.</p>
              ) : (
                myReports.slice(0, 5).map(report => (
                  <div key={report.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{report.title}</span>
                      <StatusPill status={report.status} type="report" size="sm" />
                    </div>
                    <p className="text-sm text-gray-600 truncate">{report.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{reportTypeLabel(report.type)}</span>
                      <span>{report.location}</span>
                      <span>{formatDate(report.submittedAt)}</span>
                      <span className="font-mono">Ref: {report.referenceNumber}</span>
                    </div>
                    {report.response && (
                      <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded">
                        Oversight response: {report.response}
                      </p>
                    )}
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
            Launched Projects in {county}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {countyProjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tracked projects found in this county.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {countyProjects.map(project => (
                <CitizenProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-4">
        Member submissions are unverified until an oversight user reviews them. Verified submissions update the accountability tracker.
      </p>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
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

const CitizenProjectCard = ({ project }: { project: Project }) => (
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
        {project.launchDate && (
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Launched {formatDate(project.launchDate)}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <span className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{project.contractor ? `Contractor: ${project.contractor}` : 'Contractor not yet published'}</span>
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

export const MyReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getReportsByUser } = useReports();
  const myReports = getReportsByUser(user?.id || '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Project Submissions</h1>
        <p className="text-gray-500">Track launched-project submissions and progress updates.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {myReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No project submissions yet.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="outline" onClick={() => navigate('/citizen/report-launched-project')}>Report a launched project</Button>
                <Button onClick={() => navigate('/citizen/report-project-update')}>Report project progress</Button>
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
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{reportTypeLabel(report.type)}</span>
                        <span className="text-sm text-gray-500 font-mono">Ref: {report.referenceNumber}</span>
                      </div>
                      <p className="text-gray-600 mb-3">{report.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span><MapPin className="w-4 h-4 inline mr-1" /> {report.location}</span>
                        <span><CalendarDays className="w-4 h-4 inline mr-1" /> Submitted: {formatDate(report.submittedAt)}</span>
                      </div>
                      {report.coordinates
                        && Number.isFinite(report.coordinates.latitude)
                        && report.coordinates.latitude >= -90
                        && report.coordinates.latitude <= 90
                        && Number.isFinite(report.coordinates.longitude)
                        && report.coordinates.longitude >= -180
                        && report.coordinates.longitude <= 180 && (
                          <a
                            href={`https://www.google.com/maps?q=${report.coordinates.latitude},${report.coordinates.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-3 text-sm text-blue-700 underline"
                          >
                            View captured GPS location
                          </a>
                        )}
                      {report.photos.some(photo => photo.startsWith('data:image/')) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {report.photos.filter(photo => photo.startsWith('data:image/')).map((photo, index) => (
                            <img
                              key={`${index}-${photo.slice(0, 32)}`}
                              src={photo}
                              alt={`Submitted project evidence ${index + 1}`}
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                            />
                          ))}
                        </div>
                      )}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
