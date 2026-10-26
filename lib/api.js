export async function metaRequest(payload) {
  const response = await fetch("/api/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(175000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "Layanan sedang tidak tersedia. Coba lagi.",
    );
  return result;
}
