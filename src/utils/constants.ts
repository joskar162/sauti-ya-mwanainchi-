import type { ProjectStatus, FundingType, ReportStatus, IssueType, NeedCategory } from '../types';

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  'On track': { bg: '#E8F5E9', text: '#1B5E20', border: '#4CAF50' },
  'Delayed': { bg: '#FFF3E0', text: '#E65100', border: '#FF9800' },
  'Quality review': { bg: '#E3F2FD', text: '#0D47A1', border: '#2196F3' },
  'Stalled': { bg: '#FDEDEC', text: '#B71C1C', border: '#EF5350' },
  'Completed': { bg: '#E8F5E9', text: '#1B5E20', border: '#4CAF50' }
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, { bg: string; text: string; border: string }> = {
  'New': { bg: '#E3F2FD', text: '#0D47A1', border: '#2196F3' },
  'Under review': { bg: '#FFF3E0', text: '#E65100', border: '#FF9800' },
  'Verified': { bg: '#E8F5E9', text: '#1B5E20', border: '#4CAF50' },
  'Dismissed': { bg: '#F5F5F5', text: '#616161', border: '#BDBDBD' }
};

export const FUNDING_TYPE_COLORS: Record<FundingType, { bg: string; text: string; border: string }> = {
  'Government': { bg: '#E8F5E9', text: '#1B5E20', border: '#4CAF50' },
  'County': { bg: '#E3F2FD', text: '#0D47A1', border: '#2196F3' },
  'NGO': { bg: '#F3E5F5', text: '#4A148C', border: '#9C27B0' },
  'Corporate': { bg: '#FFF3E0', text: '#E65100', border: '#FF9800' }
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  'Delayed': 'Delayed',
  'Abandoned': 'Abandoned',
  'Poor quality': 'Poor quality',
  'Corruption concern': 'Corruption concern',
  'Other': 'Other'
};

export const NEED_CATEGORIES: NeedCategory[] = ['Water', 'Health', 'Education', 'Transport', 'Other'];

export const SECTORS = ['Water', 'Health', 'Education', 'Transport'];

export const COUNTIES = ['Tharaka-Nithi'];

export const FUNDING_TYPES: FundingType[] = ['Government', 'County', 'NGO', 'Corporate'];

export const PROJECT_STATUSES: ProjectStatus[] = ['On track', 'Delayed', 'Quality review', 'Stalled', 'Completed'];

export const REPORT_STATUSES: ReportStatus[] = ['New', 'Under review', 'Verified', 'Dismissed'];

export const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export const getStatusColors = (status: ProjectStatus) => STATUS_COLORS[status] || STATUS_COLORS['On track'];
export const getReportStatusColors = (status: ReportStatus) => REPORT_STATUS_COLORS[status] || REPORT_STATUS_COLORS['New'];
export const getFundingTypeColors = (type: FundingType) => FUNDING_TYPE_COLORS[type] || FUNDING_TYPE_COLORS['Government'];

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};