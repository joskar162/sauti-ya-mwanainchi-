import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CitizenReport } from '@/types';

interface ReportsContextType {
  reports: CitizenReport[];
  addReport: (report: Omit<CitizenReport, 'id' | 'submittedAt' | 'referenceNumber' | 'status'>) => CitizenReport;
  updateReportStatus: (id: string, status: CitizenReport['status'], response?: string, reviewedBy?: string) => void;
  getReportsByUser: (userId: string) => CitizenReport[];
  getReportsByProject: (projectId: string) => CitizenReport[];
  getNewReports: () => CitizenReport[];
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

const STORAGE_KEY = 'build-kenya-reports';

const generateReferenceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BK-${year}${month}${day}-${random}`;
};

export const ReportsProvider = ({ children }: { children: ReactNode }) => {
  const [reports, setReports] = useState<CitizenReport[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  const saveReports = (nextReports: CitizenReport[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReports));
    } catch (error) {
      console.error('Could not save project reports in browser storage:', error);
      throw new Error('Could not save this submission. Browser storage may be full; remove photos from this submission and try again.');
    }
    setReports(nextReports);
  };

  const addReport = (reportData: Omit<CitizenReport, 'id' | 'submittedAt' | 'referenceNumber' | 'status'>) => {
    const newReport: CitizenReport = {
      ...reportData,
      id: `report-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      referenceNumber: generateReferenceNumber(),
      status: 'New'
    };
    saveReports([newReport, ...reports]);
    return newReport;
  };

  const updateReportStatus = (id: string, status: CitizenReport['status'], response?: string, reviewedBy?: string) => {
    saveReports(reports.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          response,
          reviewedBy,
          reviewedAt: new Date().toISOString()
        };
      }
      return r;
    }));
  };

  const getReportsByUser = (userId: string) => {
    return reports.filter(r => r.submittedBy === userId);
  };

  const getReportsByProject = (projectId: string) => {
    return reports.filter(r => r.projectId === projectId);
  };

  const getNewReports = () => {
    return reports.filter(r => r.status === 'New');
  };

  return (
    <ReportsContext.Provider value={{ reports, addReport, updateReportStatus, getReportsByUser, getReportsByProject, getNewReports }}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};