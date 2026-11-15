import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { MediaRecord } from "../../../../src/shared/api-types.js";
import type { MediaApi } from "../../api.js";
import { MediaTile } from "../../components/MediaTile.js";
import { buildJustifiedLayout } from "./justified-layout.js";
import type { MediaGroup } from "./group-media.js";

interface Props {
  api: MediaApi;
  group: MediaGroup;
  containerWidth: number;
  targetRowHeight: number;
  scrollRoot: HTMLElement | null;
  onOpen: (media: MediaRecord) => void;
}

export function JustifiedSection({
  api,
  group,
  containerWidth,
  targetRowHeight,
  scrollRoot,
  onOpen,
}: Props) {
  const rows = useMemo(
    () => buildJustifiedLayout(group.items, containerWidth, targetRowHeight),
    [containerWidth, group.items, targetRowHeight],
  );

  return (
    <Box component="section">
      <Typography variant="h5" gutterBottom>{group.label}</Typography>
      <Stack spacing={0.5}>
        {rows.map((row) => (
          <Box key={row.items.map((item) => item.fileHash).join("-")} sx={{ display: "flex", gap: 0.5 }}>
            {row.items.map((media, index) => (
              <MediaTile
                key={media.fileHash}
                api={api}
                media={media}
                width={row.widths[index] ?? row.height}
                height={row.height}
                scrollRoot={scrollRoot}
                onOpen={onOpen}
              />
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
