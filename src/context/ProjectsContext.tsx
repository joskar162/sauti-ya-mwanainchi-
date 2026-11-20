import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { projects as seedProjects } from '@/data/projects';
import type { Project } from '@/types';

interface ProjectsContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id'>>) => boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);
const STORAGE_KEY = 'build-kenya-projects';

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedProjects;
    try {
      const customProjects = JSON.parse(stored) as Project[];
      return [...seedProjects, ...customProjects];
    } catch {
      return seedProjects;
    }
  });

  useEffect(() => {
    const customProjects = projects.filter(project => !seedProjects.some(seed => seed.id === project.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customProjects));
  }, [projects]);

  const addProject = (projectData: Omit<Project, 'id'>) => {
    const project: Project = {
      ...projectData,
      id: `TN-${String(Date.now()).slice(-6)}`
    };
    setProjects(previous => [...previous, project]);
    return project;
  };

  const updateProject = (id: string, updates: Partial<Omit<Project, 'id'>>) => {
    if (!projects.some(project => project.id === id)) return false;
    setProjects(previous => previous.map(project => (
      project.id === id ? { ...project, ...updates } : project
    )));
    return true;
  };

  return (
    <ProjectsContext.Provider value={{ projects, addProject, updateProject }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error('useProjects must be used within a ProjectsProvider');
  return context;
};
