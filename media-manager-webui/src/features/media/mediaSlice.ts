import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  MediaListResponse,
  MediaPatchRequest,
  MediaRecord,
} from "../../../../src/shared/api-types.js";
import { MediaApi } from "../../api.js";
import type { ApiSettings } from "../../api.js";

interface RenamePayload {
  connection: ApiSettings;
  fileHash: string;
  fileName: string;
}

interface FetchMediaPayload {
  connection: ApiSettings;
  cursor?: string;
  append?: boolean;
  favoriteOnly?: boolean;
  albumId?: string;
}

interface UpdateMediaPayload {
  connection: ApiSettings;
  fileHash: string;
  patch: MediaPatchRequest;
}

interface AlbumMediaPayload {
  connection: ApiSettings;
  fileHash: string;
  albumId: string;
}

interface MediaState {
  items: MediaRecord[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  error: string | null;
}

const initialState: MediaState = {
  items: [],
  loading: false,
  loadingMore: false,
  hasMore: false,
  nextCursor: null,
  error: null,
};

export const fetchMedia = createAsyncThunk<MediaListResponse, FetchMediaPayload>(
  "media/fetch",
  async ({ connection, cursor, favoriteOnly, albumId }) =>
    new MediaApi(connection.apiUrl, connection.token).media(500, cursor, {
      ...(favoriteOnly ? { favoriteOnly } : {}),
      ...(albumId ? { albumId } : {}),
    }),
);

export const renameMedia = createAsyncThunk<MediaRecord, RenamePayload>(
  "media/rename",
  async ({ connection, fileHash, fileName }) =>
    new MediaApi(connection.apiUrl, connection.token).renameMedia(fileHash, fileName),
);

export const updateMedia = createAsyncThunk<MediaRecord, UpdateMediaPayload>(
  "media/update",
  async ({ connection, fileHash, patch }) =>
    new MediaApi(connection.apiUrl, connection.token).updateMedia(fileHash, patch),
);

export const addMediaToAlbum = createAsyncThunk<MediaRecord, AlbumMediaPayload>(
  "media/add-to-album",
  async ({ connection, fileHash, albumId }) =>
    new MediaApi(connection.apiUrl, connection.token).addToAlbum(albumId, fileHash),
);

export const removeMediaFromAlbum = createAsyncThunk<MediaRecord, AlbumMediaPayload>(
  "media/remove-from-album",
  async ({ connection, fileHash, albumId }) =>
    new MediaApi(connection.apiUrl, connection.token).removeFromAlbum(albumId, fileHash),
);

function replaceMedia(items: MediaRecord[], media: MediaRecord): MediaRecord[] {
  return items.map((item) => item.fileHash === media.fileHash ? media : item);
}

const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedia.pending, (state, action) => {
        const append = action.meta.arg.append === true;
        state.loading = !append;
        state.loadingMore = append;
        state.error = null;
      })
      .addCase(fetchMedia.fulfilled, (state, action) => {
        const append = action.meta.arg.append === true;
        const existing = new Set(state.items.map((item) => item.fileHash));
        state.loading = false;
        state.loadingMore = false;
        state.hasMore = action.payload.hasMore;
        state.nextCursor = action.payload.nextCursor;
        state.items = append
          ? [
              ...state.items,
              ...action.payload.items.filter((item) => !existing.has(item.fileHash)),
            ]
          : action.payload.items;
      })
      .addCase(fetchMedia.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.error.message ?? "Unable to load photos";
      })
      .addCase(renameMedia.fulfilled, (state, action) => {
        state.items = replaceMedia(state.items, action.payload);
      })
      .addCase(renameMedia.rejected, (state, action) => {
        state.error = action.error.message ?? "Unable to rename file";
      })
      .addCase(updateMedia.fulfilled, (state, action) => {
        state.items = replaceMedia(state.items, action.payload);
      })
      .addCase(updateMedia.rejected, (state, action) => {
        state.error = action.error.message ?? "Unable to update media details";
      })
      .addCase(addMediaToAlbum.fulfilled, (state, action) => {
        state.items = replaceMedia(state.items, action.payload);
      })
      .addCase(removeMediaFromAlbum.fulfilled, (state, action) => {
        state.items = replaceMedia(state.items, action.payload);
      });
  },
});

export const mediaReducer = mediaSlice.reducer;
