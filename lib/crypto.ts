export async function hashText(text: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(text)
  const buf = await crypto.subtle.digest("SHA-256", data)
  const arr = Array.from(new Uint8Array(buf))
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("")
}
