import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  AlbumListResponse,
  AlbumRecord,
} from "../../../../src/shared/api-types.js";
import { MediaApi } from "../../api.js";
import type { ApiSettings } from "../../api.js";

interface CreateAlbumPayload {
  connection: ApiSettings;
  name: string;
}

interface AlbumsState {
  items: AlbumRecord[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: AlbumsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

export const fetchAlbums = createAsyncThunk<AlbumListResponse, ApiSettings>(
  "albums/fetch",
  async (connection) => new MediaApi(connection.apiUrl, connection.token).albums(),
);

export const createAlbum = createAsyncThunk<AlbumRecord, CreateAlbumPayload>(
  "albums/create",
  async ({ connection, name }) =>
    new MediaApi(connection.apiUrl, connection.token).createAlbum(name),
);

const albumsSlice = createSlice({
  name: "albums",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlbums.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbums.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
      })
      .addCase(fetchAlbums.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Unable to load albums";
      })
      .addCase(createAlbum.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAlbum.fulfilled, (state, action) => {
        state.creating = false;
        state.items = [
          action.payload,
          ...state.items.filter((album) => album.id !== action.payload.id),
        ];
      })
      .addCase(createAlbum.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message ?? "Unable to create album";
      });
  },
});

export const albumsReducer = albumsSlice.reducer;
