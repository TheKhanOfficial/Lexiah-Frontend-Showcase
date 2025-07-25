export async function getAIResponse(
  messageHistory: { role: string; content: string }[]
) {
  try {
    console.log("FETCHING FROM API WITH:", messageHistory);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messageHistory }),
    });

    const data = await res.json();
    console.log("Raw response data:", data);

    if (!data || !data.output) {
      throw new Error("Invalid API response");
    }

    return data.output;
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}
