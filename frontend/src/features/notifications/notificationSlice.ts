import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http } from "../../api/http";

export type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
};

type NotificationState = {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
};

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  unreadCount: 0,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get("/api/notifications");
      return res.data.notifications as Notification[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch notifications");
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markRead",
  async (id: number, { rejectWithValue }) => {
    try {
      await http.patch(`/api/notifications/${id}/read`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to mark as read");
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.notifications.find(notif => notif.id === action.payload);
        if (n && !n.isRead) {
          n.isRead = true;
          state.unreadCount--;
        }
      });
  },
});

export default notificationSlice.reducer;
