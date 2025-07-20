import { fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { RootState } from "@/app/redux";
import { setAuthUser, clearAuth } from "./index"; // adjust import if needed

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  credentials: "include", // send cookies
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    // optionally attach auth header if stored
    const token = state.global.auth.user?.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const fetchBaseQueryWithReauth: BaseQueryFn<
  any,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle expired access token
  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      { url: "/users/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Update user in Redux store
      api.dispatch(setAuthUser(refreshResult.data.user));

      // Retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearAuth());
    }
  }

  return result;
};
