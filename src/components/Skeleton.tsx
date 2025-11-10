import type { FC } from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-slate-800/60 ${className}`} role="status" aria-live="polite">
    <span className="sr-only">Loading...</span>
  </div>
);

export default Skeleton;
