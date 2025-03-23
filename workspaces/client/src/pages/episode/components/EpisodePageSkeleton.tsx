import { SkeletonLoader } from '@wsh-2025/client/src/features/layout/components/SkeletonLoader';

export const EpisodePageSkeleton = () => {
  return (
    <div className="px-[24px] py-[48px]">
      <div className="m-auto mb-[16px] h-auto w-full max-w-[1280px] outline outline-[1px] outline-[#212121]">
        <SkeletonLoader className="aspect-video w-full" />
      </div>

      <div className="mb-[24px]">
        <SkeletonLoader className="h-[20px] w-[200px]" />
        <SkeletonLoader className="mt-[8px] h-[28px] w-[400px]" />
        <SkeletonLoader className="mt-[16px] h-[60px] w-full" />
      </div>

      <div className="mt-[24px]">
        <SkeletonLoader className="h-[28px] w-[200px]" />
        <div className="mt-[12px] grid grid-cols-2 gap-[16px] md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} className="aspect-video w-full" />
          ))}
        </div>
      </div>

      <div className="mt-[24px]">
        <SkeletonLoader className="h-[28px] w-[200px]" />
        <div className="mt-[12px] grid grid-cols-2 gap-[16px] md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} className="aspect-video w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};
