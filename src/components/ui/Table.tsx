import React from 'react';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="table-container">
      <table className={`table ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="">{children}</tbody>;
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={className}>{children}</th>;
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}

// Convenience components matching the usage in pages
export function TableTextHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`font-semibold text-zinc-700 px-4 py-3 text-left ${className}`}>{children}</th>;
}

export function TableTextCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-zinc-700 ${className}`}>{children}</td>;
}

// Alias for backward compatibility with <Table.Head> style usage
Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;
Table.TextHeader = TableTextHeader;
Table.TextCell = TableTextCell;
TableHeader.TextHeader = TableTextHeader;
TableCell.TextCell = TableTextCell;
