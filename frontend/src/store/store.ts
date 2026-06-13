import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import parcelsReducer from "../features/parcels/parcelSlice";
import notificationsReducer from "../features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    parcels: parcelsReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

