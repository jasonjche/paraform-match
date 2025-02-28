import { RoleToCandidatesResponse } from "../types";
// This function fetches data from the actual API endpoint
export const fetchData = async (
  roleId?: string
): Promise<RoleToCandidatesResponse | null> => {
  if (!roleId) {
    console.log("No role link provided");
    return null;
  }

  const TIMEOUT_MS = 10000; // 10 seconds

  try {
    const response = await fetch(
      `https://nodejs-serverless-function-express-inky-ten.vercel.app/api/getMatchedCandidates?roleId=${roleId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${TIMEOUT_MS}ms`);
      }
      console.error("Error fetching data from API:", error.message);
      throw error;
    }
    console.error("Unknown error fetching data from API:", error);
    throw new Error("An unknown error occurred while fetching data");
  }
};

const API_BASE_URL = "http://localhost:3000/api";

export const analyzeCandidates = async (data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-candidates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing candidates:", error);
    throw error;
  }
};
