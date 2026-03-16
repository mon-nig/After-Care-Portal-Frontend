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

export async function getUnreadNotifications(userId: number, role: string) {
  const response = await fetch(`${BASE_URL}/notifications/unread?userId=${userId}&role=${role}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }
  return response.json();
}

export async function getTrackingInfo(familyUserId: number) {
  const response = await fetch(`${BASE_URL}/tracking/${familyUserId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tracking info: ${response.statusText}`);
  }
  return response.json();
}

