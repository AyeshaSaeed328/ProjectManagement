import { fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { clearAuth } from "@/state"; // update path as needed

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  credentials: "include", // for sending/receiving cookies
});

export const fetchBaseQueryWithReauth: BaseQueryFn<
  any,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      { url: "/users/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.error) {
      // Refresh failed: log out user
      api.dispatch(clearAuth());
    } else {
      // Refresh succeeded, retry original request
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};
