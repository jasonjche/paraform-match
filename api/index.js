import type { VercelRequest, VercelResponse } from '@vercel/node';
const axios = require('axios')

export default async function handler(req: VercelRequest, res: VercelResponse) {
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