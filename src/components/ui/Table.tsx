import { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, forwardRef } from 'react';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', children, ...props }, ref) => (
    <div className="overflow-x-auto">
      <table
        ref={ref}
        className={`w-full text-sm text-left ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);

Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <thead ref={ref} className={`[&_tr]:border-b [&_tr]:border-gray-200 ${className}`} {...props}>
      {children}
    </thead>
  )
);

TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, TableHTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
      {children}
    </tbody>
  )
);

TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, TableHTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`
        border-b border-gray-100 hover:bg-gray-50 transition-colors
        ${className}
      `}
      {...props}
    />
  )
);

TableRow.displayName = 'TableRow';

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  width?: string;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ width, className = '', children, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      style={{ width }}
      className={`
        px-4 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs
        ${className}
      `}
      {...props}
    >
      {children}
    </th>
  )
);

TableHead.displayName = 'TableHead';

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', children, ...props }, ref) => (
    <td
      ref={ref}
      className={`px-4 py-3 text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = 'TableCell';

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableHTMLAttributes<HTMLTableCaptionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <caption ref={ref} className={`sr-only ${className}`} {...props}>
      {children}
    </caption>
  )
);

TableCaption.displayName = 'TableCaption';