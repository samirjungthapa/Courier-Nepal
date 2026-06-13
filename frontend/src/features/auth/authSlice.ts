import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { http, setAuthToken } from "../../api/http";

export type AppRole = "USER" | "ADMIN" | "SUPER_ADMIN" | "DELIVERY_STAFF";

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: AppRole;
  isBanned?: boolean;
};

type AuthState = {
  token: string | null;
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const storedToken = localStorage.getItem("token");
if (storedToken) setAuthToken(storedToken);

const initialState: AuthState = {
  token: storedToken,
  user: null,
  status: "idle",
  error: null,
};

// ── Thunks ─────────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await http.post("/api/auth/login", payload);
      return res.data as { token: string; user: User };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    payload: { name: string; email: string; phone?: string; password: string; role: "USER" | "DELIVERY_STAFF" },
    { rejectWithValue }
  ) => {
    try {
      const res = await http.post("/api/auth/register", payload);
      return res.data as { token: string; user: User };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const loadMe = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.token) return rejectWithValue("Not authenticated");
      const res = await http.get("/api/auth/me");
      return res.data as { user: User };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load user");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: { email: string }, { rejectWithValue }) => {
    try {
      const res = await http.post("/api/auth/forgot-password", payload);
      return res.data as { message: string };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to send reset email"
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload: { token: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await http.post("/api/auth/reset-password", payload);
      return res.data as { message: string };
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to reset password"
      );
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("token");
      setAuthToken(null);
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem("token", action.payload);
        setAuthToken(action.payload);
      } else {
        localStorage.removeItem("token");
        setAuthToken(null);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        localStorage.setItem("token", action.payload.token);
        setAuthToken(action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Login failed";
      })
      // register
      .addCase(register.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
        localStorage.setItem("token", action.payload.token);
        setAuthToken(action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Registration failed";
      })
      // loadMe
      .addCase(loadMe.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(loadMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
      })
      .addCase(loadMe.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.status = "failed";
        localStorage.removeItem("token");
        setAuthToken(null);
      })
      // forgotPassword / resetPassword — status only, no token changes
      .addCase(forgotPassword.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(forgotPassword.fulfilled, (state) => { state.status = "succeeded"; })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed";
      })
      .addCase(resetPassword.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(resetPassword.fulfilled, (state) => { state.status = "succeeded"; })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed";
      });
  },
});

export const { logout, setToken } = authSlice.actions;

export default authSlice.reducer;
