export type FundingType = 'Government' | 'County' | 'NGO' | 'Corporate';
export type ProjectStatus = 'On track' | 'Delayed' | 'Quality review' | 'Stalled' | 'Completed';
export type ReportStatus = 'New' | 'Under review' | 'Verified' | 'Dismissed';
export type IssueType = 'Delayed' | 'Abandoned' | 'Poor quality' | 'Corruption concern' | 'Other';
export type UserRole = 'oversight' | 'citizen';
export type NeedCategory = 'Water' | 'Health' | 'Education' | 'Transport' | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Project {
  id: string;
  name: string;
  sector: string;
  location: string;
  fundingType: FundingType;
  funder: string;
  contractor: string | null;
  valueKES: number | null;
  paidKES: number | null;
  status: ProjectStatus;
  note: string;
  sources: string[];
}

export interface CommunityNeed {
  id: string;
  title: string;
  category: NeedCategory;
  location: string;
  supportNeeded: string;
  description: string;
  sources: string[];
  submittedBy?: string;
  submittedAt?: string;
  status?: ReportStatus;
}

export interface CitizenReport {
  id: string;
  type: 'project-issue' | 'community-need';
  projectId?: string;
  projectName?: string;
  title: string;
  issueType?: IssueType;
  category?: NeedCategory;
  description: string;
  location: string;
  county: string;
  photos: string[];
  anonymous: boolean;
  submittedBy: string;
  submittedAt: string;
  status: ReportStatus;
  response?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  referenceNumber: string;
  urgency?: UrgencyLevel;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  county?: string;
}

export interface Contractor {
  name: string;
  projects: string[];
  flagged: boolean;
  delayedCount: number;
  qualityReviewCount: number;
}

export interface DashboardStats {
  projectsMonitored: number;
  projectsNeedingReview: number;
  communityNeeds: number;
  stalledProjects: number;
  totalPaidOnStalledDelayed: number;
  contractorsFlagged: number;
  citizenReportsNew: number;
}