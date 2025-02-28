import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins (you can restrict this to specific origins if needed)
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS"); // Allow specific HTTP methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Allow specific headers

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Respond to OPTIONS requests with a 200 status
  }

  const { roleId } = req.query;

  if (!roleId) {
    return res.status(400).json({
      error: "Missing 'roleId' query parameter",
    });
  }

  const apiUrl = `http://paraform.com/api/cron/role/get_matched_candidates?role_id=${roleId}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error fetching matched candidates:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json({
      error: error.response?.data || "Internal server error",
    });
  }
}
