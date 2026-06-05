const https = require("https");

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function httpsPost(url, headers, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname,
            method: "POST",
            headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
        };
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve({ status: res.statusCode, body: data }));
        });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

exports.handler = async function (event) {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers: CORS_HEADERS, body: "Method Not Allowed" };
    }

    try {
        const { messages, model } = JSON.parse(event.body);
        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: "DEEPSEEK_API_KEY not set in Netlify environment variables." }),
            };
        }

        const requestBody = JSON.stringify({
            model: model || "deepseek-chat",
            messages: messages,
            temperature: 0.8,
            max_tokens: 400,
        });

        const result = await httpsPost(
            "https://api.deepseek.com/v1/chat/completions",
            {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            requestBody
        );

        if (result.status !== 200) {
            return {
                statusCode: result.status,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: result.body }),
            };
        }

        const data = JSON.parse(result.body);
        const reply = data.choices?.[0]?.message?.content || "No response.";

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ reply }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
