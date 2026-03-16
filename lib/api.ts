export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function submitB24Form(data: Record<string, string>) {
  const response = await fetch(`${BASE_URL}/b24`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit B24 form: ${response.statusText}`);
  }

  return response.json();
}

export async function submitCr02Form(data: Record<string, string>) {
  const response = await fetch(`${BASE_URL}/cr02`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit CR02 form: ${response.statusText}`);
  }

  return response.json();
}

export async function getUnreadNotifications(username: string, nicNo: string, role: string) {
  const params = new URLSearchParams({ role });
  if (username) params.append("username", username);
  if (nicNo) params.append("nicNo", nicNo);
  const response = await fetch(`${BASE_URL}/notifications/unread?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }
  return response.json();
}

export async function getTrackingInfo(familyNicNo: string) {
  const response = await fetch(`${BASE_URL}/tracking/nic/${familyNicNo}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tracking info: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRegistrars() {
  const response = await fetch(`${BASE_URL}/users/registrars`);
  if (!response.ok) {
    throw new Error(`Failed to fetch registrars: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchB24ById(id: number) {
  const response = await fetch(`${BASE_URL}/b24/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch B24 form: ${response.statusText}`);
  }
  return response.json();
}
