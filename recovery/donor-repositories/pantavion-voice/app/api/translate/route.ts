import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text, targetLang } = await req.json();

  try {
    const res = await fetch(
      "https://api.mymemory.translated.net/get?q=" +
        encodeURIComponent(text) +
        "&langpair=auto|" +
        encodeURIComponent(targetLang)
    );

    const data = await res.json();

    const translation = data?.responseData?.translatedText || "";

    return NextResponse.json({ translation });
  } catch (err) {
    return NextResponse.json({ translation: "" });
  }
}
