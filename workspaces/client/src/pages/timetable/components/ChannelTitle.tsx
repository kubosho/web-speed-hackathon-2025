import invariant from 'tiny-invariant';
import { useEffect, useState } from 'react';

import { useChannelById } from '@wsh-2025/client/src/features/channel/hooks/useChannelById';
import { loadSvg } from '@wsh-2025/client/src/features/channel/utils/loadSvg';
import { Gutter } from '@wsh-2025/client/src/pages/timetable/components/Gutter';
import { useColumnWidth } from '@wsh-2025/client/src/pages/timetable/hooks/useColumnWidth';

interface Props {
  channelId: string;
}

export const ChannelTitle = ({ channelId }: Props) => {
  const channel = useChannelById({ channelId });
  invariant(channel);

  const width = useColumnWidth(channelId);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    loadSvg(channel.logoUrl).then(setSvgContent);
  }, [channel.logoUrl]);

  return (
    <div className="relative">
      <div className={`border-x-solid h-[72px] w-auto border-x-[1px] border-x-[#212121] p-[14px]`} style={{ width }}>
        {svgContent ? (
          <div className="size-full" dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : (
          <div className="size-full bg-[#212121]" />
        )}
      </div>

      <div className="absolute inset-y-0 right-[-4px] z-10 w-[8px]">
        <Gutter channelId={channelId} />
      </div>
    </div>
  );
};
