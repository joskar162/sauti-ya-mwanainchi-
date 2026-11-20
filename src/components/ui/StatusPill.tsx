import { HTMLAttributes, forwardRef, SVGAttributes } from 'react';
import type { ProjectStatus, ReportStatus, FundingType } from '../../types';
import { getStatusColors, getReportStatusColors, getFundingTypeColors } from '../../utils/constants';

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status: ProjectStatus | ReportStatus | FundingType | string;
  type?: 'project' | 'report' | 'funding';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

type IconProps = SVGAttributes<SVGSVGElement>;

const CheckIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SearchIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EyeIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const XIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BuildingIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MapIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const HeartIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 1 0 7.78L12 20.35 3.16 12.39a5.5 5.5 0 0 1 0-7.78 5.5 5.5 0 0 1 7.78 0l1.55 1.55 1.55-1.55a5.5 5.5 0 0 1 7.78 0z" />
  </svg>
);

const BriefcaseIcon = ({ className, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} {...props}>
    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <rect x="2" y="6" width="20" height="14" rx="2" />
  </svg>
);

const Icons: Record<string, React.ComponentType<IconProps>> = {
  'On track': CheckIcon,
  'Completed': CheckIcon,
  'Delayed': ClockIcon,
  'Stalled': AlertIcon,
  'Quality review': SearchIcon,
  'New': PlusIcon,
  'Under review': EyeIcon,
  'Verified': CheckIcon,
  'Dismissed': XIcon,
  'Government': BuildingIcon,
  'County': MapIcon,
  'NGO': HeartIcon,
  'Corporate': BriefcaseIcon
};

export const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ status, type = 'project', size = 'md', showIcon = false, className = '', children, ...props }, ref) => {
    let colors = getStatusColors(status as ProjectStatus);
    if (type === 'report') colors = getReportStatusColors(status as ReportStatus);
    if (type === 'funding') colors = getFundingTypeColors(status as FundingType);

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm'
    };

    const IconComponent = Icons[status];

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${sizes[size]} ${className}
        `}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`
        }}
        {...props}
      >
        {showIcon && IconComponent && <IconComponent className="w-3 h-3 flex-shrink-0" />}
        {children || status}
      </span>
    );
  }
);

StatusPill.displayName = 'StatusPill';