import { Stack } from "@mui/material";
import type { MediaRecord } from "../../../../src/shared/api-types.js";
import type { MediaApi } from "../../api.js";
import type { MediaGroup } from "./group-media.js";
import { JustifiedSection } from "./JustifiedSection.js";

interface MediaGridProps {
  api: MediaApi;
  groups: MediaGroup[];
  containerWidth: number;
  targetRowHeight: number;
  scrollRoot: HTMLElement | null;
  onOpen: (media: MediaRecord) => void;
}

export function MediaGrid({ api, groups, containerWidth, targetRowHeight, scrollRoot, onOpen }: MediaGridProps) {
  return (
    <Stack spacing={5}>
      {groups.map((group) => (
        <JustifiedSection
          key={group.key}
          api={api}
          group={group}
          containerWidth={containerWidth}
          targetRowHeight={targetRowHeight}
          scrollRoot={scrollRoot}
          onOpen={onOpen}
        />
      ))}
    </Stack>
  );
}
