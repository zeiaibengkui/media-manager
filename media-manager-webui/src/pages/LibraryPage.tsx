import { useEffect, useMemo, useState } from "react";
import type { UIEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MediaViewerDialogWrapper } from "../components/MediaViewerDialogWrapper.js";
import { MediaApi } from "../api.js";
import type { MediaQuery } from "../api.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { MediaGrid } from "../features/library/MediaGrid.js";
import { filterMedia, groupByMonth } from "../features/library/group-media.js";
import { fetchMedia } from "../features/media/mediaSlice.js";
import { useElementWidth } from "../hooks/use-element-width.js";
import { useProgressiveItems } from "../hooks/use-progressive-items.js";

interface LibraryPageProps {
  favoriteOnly?: boolean;
  albumId?: string;
}

export function LibraryPage({ favoriteOnly = false, albumId }: LibraryPageProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const query = useAppSelector((state) => state.ui.query);
  const { items, loading, loadingMore, hasMore, nextCursor, error } = useAppSelector((state) => state.media);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [gridRef, gridWidth] = useElementWidth<HTMLDivElement>();
  const api = useMemo(() => new MediaApi(connection.apiUrl, connection.token), [connection.apiUrl, connection.token]);
  const filters = useMemo<MediaQuery>(() => ({
    ...(favoriteOnly ? { favoriteOnly } : {}),
    ...(albumId ? { albumId } : {}),
  }), [albumId, favoriteOnly]);
  const isLarge = useMediaQuery(theme.breakpoints.up("lg"));
  const targetRowHeight = isLarge ? 210 : 150;
  const filteredItems = useMemo(() => filterMedia(items, query), [items, query]);
  const {
    visibleItems,
    sentinelRef,
    hasMore: localHasMore,
    atEnd,
    loadMore,
  } = useProgressiveItems(
    filteredItems,
    80,
    `${query}:${connection.apiUrl}:${favoriteOnly}:${albumId ?? ""}`,
  );
  const groups = useMemo(() => groupByMonth(visibleItems), [visibleItems]);

  useEffect(() => {
    void dispatch(fetchMedia({ connection, ...filters }));
  }, [connection, dispatch, filters]);

  useEffect(() => {
    if (!atEnd || !hasMore || !nextCursor || loadingMore || error) return;
    void dispatch(fetchMedia({
      connection,
      ...filters,
      cursor: nextCursor,
      append: true,
    }));
  }, [atEnd, connection, dispatch, error, filters, hasMore, loadingMore, nextCursor]);

  if (loading && items.length === 0) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading library...</Typography>
      </Stack>
    );
  }
  if (error && items.length === 0) {
    return (
      <Alert severity="error" action={<Button onClick={() => void dispatch(fetchMedia({ connection, ...filters }))}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  return (
    <Stack
      ref={setScrollRoot}
      spacing={5}
      onScroll={(event: UIEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 900) {
          loadMore();
        }
      }}
      sx={{ height: "100%", overflowY: "auto", pr: 1 }}
    >
      {error ? (
        <Alert
          severity="error"
          action={(
            <Button onClick={() => void dispatch(fetchMedia({
              connection,
              ...filters,
              ...(nextCursor ? { cursor: nextCursor, append: true } : {}),
            }))}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      ) : null}
      {groups.length ? (
        <Box ref={gridRef}>
          <MediaGrid
            api={api}
            groups={groups}
            containerWidth={gridWidth}
            targetRowHeight={targetRowHeight}
            scrollRoot={scrollRoot}
            onOpen={(media) => setSelectedHash(media.fileHash)}
          />
        </Box>
      ) : (
        <Typography color="text.secondary">
          {query ? "No matching photos." : "Your library is empty."}
        </Typography>
      )}
      {localHasMore || hasMore || loadingMore ? (
        <Box ref={sentinelRef} sx={{ height: 32, display: "grid", placeItems: "center" }}>
          {loadingMore ? <CircularProgress size={20} /> : null}
        </Box>
      ) : null}
      <MediaViewerDialogWrapper
        api={api}
        fileHash={selectedHash}
        onClose={() => setSelectedHash(null)}
      />
    </Stack>
  );
}
