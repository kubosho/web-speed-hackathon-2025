import { ReactNode } from 'react';

interface Props {
  className?: string;
  children?: ReactNode;
}

export const SkeletonLoader = ({ className = '', children }: Props) => {
  return <div className={`animate-pulse bg-[#333333] ${className}`}>{children}</div>;
};
