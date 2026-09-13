export const API_URL = "http://127.0.0.1:8000";


export async function apiFetch(url, options = {}) {
  let accessToken = localStorage.getItem("access_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });


  // If access token expired
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      return response;
    }

    const refreshResponse = await fetch(
      `${API_URL}/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    );

    if (!refreshResponse.ok) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return response;
    }

    const refreshData = await refreshResponse.json();

    localStorage.setItem(
      "access_token",
      refreshData.access_token
    );

    localStorage.setItem(
      "refresh_token",
      refreshData.refresh_token
    );


    // Retry original request with new token
    headers.Authorization =
      `Bearer ${refreshData.access_token}`;

    response = await fetch(url, {
      ...options,
      headers,
    });
  }

  return response;
}