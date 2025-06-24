// /api/generate.js

// This is a Node.js serverless function.
// It acts as a secure backend to handle API requests.

export default async function handler(req, res) {
    // --- CORS Headers ---
    // This allows your frontend (wherever it's hosted) to make requests to this backend.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle the browser's preflight request. This is required for CORS to work.
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests after the preflight check
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    // IMPORTANT: Your Google AI API key is stored securely as an environment variable, not in the code.
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleApiKey) {
        return res.status(500).json({ error: "API key is not configured on the server." });
    }

    const { type, payload } = req.body;

    if (!type || !payload) {
        return res.status(400).json({ error: "Missing 'type' or 'payload' in request body." });
    }

    let apiUrl;
    if (type === 'text') {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`;
    } else if (type === 'image') {
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${googleApiKey}`;
    } else {
        return res.status(400).json({ error: "Invalid 'type'. Must be 'text' or 'image'." });
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Google AI API Error:', errorBody);
            // Forward the error from Google's API to our frontend for better debugging
            return res.status(response.status).json({
                error: `Google AI API request failed: ${response.statusText}`,
                details: errorBody,
            });
        }

        const data = await response.json();
        // Securely send the successful response back to the frontend
        res.status(200).json(data);

    } catch (error) {
        console.error('Internal Server Error:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}
