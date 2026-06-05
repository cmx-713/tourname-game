exports.handler = async function (event) {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
            body: "",
        };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { messages, model } = JSON.parse(event.body);
        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "API key not configured on server." }),
            };
        }

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || "deepseek-chat",
                messages: messages,
                temperature: 0.8,
                max_tokens: 400,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            return {
                statusCode: response.status,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: errText }),
            };
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "No response.";

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ reply }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: err.message }),
        };
    }
};
