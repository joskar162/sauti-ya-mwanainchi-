import seedData from '@/../tharaka_nithi_seed_data.json';
import type { Project, CommunityNeed } from '@/types';

export const projects: Project[] = seedData.projects as Project[];
export const communityNeeds: CommunityNeed[] = seedData.communityNeeds as CommunityNeed[];

export const getProjectById = (id: string): Project | undefined => {
  return projects.find(p => p.id === id);
};

export const getProjectsByContractor = (contractor: string): Project[] => {
  return projects.filter(p => p.contractor === contractor);
};

export const getProjectsByCounty = (county: string): Project[] => {
  return projects.filter(p => p.location.includes(county));
};

export const getUniqueContractors = (): string[] => {
  const contractors = projects
    .map(p => p.contractor)
    .filter((c): c is string => c !== null);
  return [...new Set(contractors)].sort();
};

export const getUniqueFunders = (): string[] => {
  const funders = projects.map(p => p.funder);
  return [...new Set(funders)].sort();
};

export const getUniqueSectors = (): string[] => {
  const sectors = projects.map(p => p.sector);
  return [...new Set(sectors)].sort();
};

export const getUniqueLocations = (): string[] => {
  const locations = projects.map(p => p.location);
  return [...new Set(locations)].sort();
};

export const getUniqueFundingTypes = (): Project['fundingType'][] => {
  const types = projects.map(p => p.fundingType);
  return [...new Set(types)].sort();
};

export const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return 'Unknown';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-KE').format(value);
};