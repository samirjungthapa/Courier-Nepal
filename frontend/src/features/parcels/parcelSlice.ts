import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { http } from "../../api/http";

export type ParcelEvent = {
  id: number;
  status: "PICKED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED";
  updatedByUserId: number | null;
  createdAt: string;
};

export type ParcelTrack = {
  parcelId: number;
  status: ParcelEvent["status"];
  events: ParcelEvent[];
};

export type Payment = {
  id: number;
  provider: "ESEWA" | "KHALTI";
  amount: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  providerTransactionId?: string | null;
  receiptCode?: string | null;
  createdAt: string;
};

export type ParcelHistoryItem = {
  id: number;
  status: ParcelTrack["status"];
  pickupScheduledAt?: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverAddressLine1: string;
  receiverCity?: string | null;
  createdAt: string;
  events: ParcelEvent[];
  payments: Payment[];
};

type ParcelsState = {
  tracking: ParcelTrack | null;
  history: ParcelHistoryItem[] | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  historyStatus: "idle" | "loading" | "succeeded" | "failed";
  createStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  createError: string | null;
  historyError: string | null;
};

const initialState: ParcelsState = {
  tracking: null,
  history: null,
  status: "idle",
  historyStatus: "idle",
  createStatus: "idle",
  error: null,
  createError: null,
  historyError: null,
};

export const trackParcel = createAsyncThunk(
  "parcels/track",
  async (parcelId: number, { rejectWithValue }) => {
    try {
      const res = await http.get(`/api/parcels/${parcelId}/track`);
      return res.data as ParcelTrack;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Tracking failed");
    }
  }
);

export const createParcel = createAsyncThunk(
  "parcels/create",
  async (
    payload: {
      pickupScheduledAt?: string | null;
      pickupAddressLine1: string;
      pickupAddressLine2?: string | null;
      pickupCity?: string | null;
      receiverName: string;
      receiverPhone: string;
      receiverAddressLine1: string;
      receiverAddressLine2?: string | null;
      receiverCity?: string | null;
      parcelType?: string | null;
      weightKg?: number | null;
      notes?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await http.post("/api/parcels", payload);
      return res.data as { parcelId: number };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Create parcel failed");
    }
  }
);

export const fetchOrderHistory = createAsyncThunk(
  "parcels/history",
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get("/api/parcels/history");
      return res.data as { parcels: ParcelHistoryItem[] };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load order history");
    }
  }
);

const parcelsSlice = createSlice({
  name: "parcels",
  initialState,
  reducers: {
    clearTracking(state) {
      state.tracking = null;
      state.status = "idle";
      state.error = null;
    },
    clearHistory(state) {
      state.history = null;
      state.historyStatus = "idle";
      state.historyError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(trackParcel.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(trackParcel.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tracking = action.payload;
      })
      .addCase(trackParcel.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Tracking failed";
      })
      .addCase(createParcel.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createParcel.fulfilled, (state) => {
        state.createStatus = "succeeded";
      })
      .addCase(createParcel.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = (action.payload as string) || "Create parcel failed";
      })
      .addCase(fetchOrderHistory.pending, (state) => {
        state.historyStatus = "loading";
        state.historyError = null;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.historyStatus = "succeeded";
        state.history = action.payload.parcels;
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.historyStatus = "failed";
        state.historyError = (action.payload as string) || "Failed to load order history";
      });
  },
});

export const { clearTracking, clearHistory } = parcelsSlice.actions;
export default parcelsSlice.reducer;

