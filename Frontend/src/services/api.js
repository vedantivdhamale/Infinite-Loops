const API_BASE_URL = "http://localhost:8000";

/**
 * Sends transactions to the backend for scoring.
 * @param {Array} transactions 
 * @returns {Promise<Array>} Scored transactions
 */
export async function scoreTransactions(transactions) {
  const response = await fetch(`${API_BASE_URL}/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transactions)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Checks backend health status.
 * @returns {Promise<Object>} Health status
 */
export async function checkApiHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("API unavailable");
  }

  return await response.json();
}
