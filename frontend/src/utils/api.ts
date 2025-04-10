export async function getAIResponse(message: string) {
  const res = await fetch("http://localhost:8000/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await res.json();
  console.log("Raw response data:", data);
  return data.output;
}
