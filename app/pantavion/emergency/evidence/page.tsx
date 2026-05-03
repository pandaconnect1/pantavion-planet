"use client";

import { useRef, useState } from "react";

export default function EvidenceCapsulePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [status, setStatus] = useState("Evidence Capsule ready.");
  const [error, setError] = useState("");

  async function requestCameraMic() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera/microphone capture is not supported on this device/browser.");
      return;
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setStream(nextStream);

      if (videoRef.current) {
        videoRef.current.srcObject = nextStream;
      }

      setStatus("Camera and microphone permission granted.");
    } catch (captureError) {
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Camera/microphone permission failed."
      );
    }
  }

  function takePhoto() {
    setError("");

    const video = videoRef.current;

    if (!video) {
      setError("No video preview available. Request camera/microphone first.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Photo capture is not available on this browser.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoUrl(canvas.toDataURL("image/png"));
    setStatus("Emergency photo captured locally.");
  }

  function startRecording() {
    setError("");

    if (!stream) {
      setError("Request camera/microphone first.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setError("MediaRecorder is not supported on this device/browser.");
      return;
    }

    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoUrl(URL.createObjectURL(blob));
      setRecording(false);
      setStatus("Emergency video/audio capsule recorded locally.");
    };

    recorder.start();
    setRecording(true);
    setStatus("Recording emergency evidence capsule for 10 seconds...");

    window.setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }, 10000);
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function stopCameraMic() {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setStatus("Camera/microphone stopped.");
  }

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-[#081229] via-[#07101f] to-black p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-300">
          Pantavion Emergency Evidence
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-6xl">
          Evidence Capsule
        </h1>

        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-200">
          Capture short emergency audio/video/photo evidence with consent and
          device permission. The capsule stays local in this browser session
          unless the user downloads or shares it. Future versions can encrypt,
          queue, and upload evidence to trusted contacts when a provider is configured.
        </p>

        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-red-50">
          <p className="font-bold">Permission boundary</p>
          <p className="mt-2 text-sm leading-6">
            Camera and microphone require user permission. Background evidence
            capture requires native app/platform support and strict consent rules.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button onClick={requestCameraMic} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">
            Request camera/mic
          </button>
          <button onClick={takePhoto} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">
            Take emergency photo
          </button>
          <button onClick={startRecording} disabled={recording} className="rounded-2xl border border-red-300/30 bg-red-500/20 px-5 py-4 text-left font-bold text-red-100 hover:bg-red-500/30 disabled:opacity-60">
            {recording ? "Recording..." : "Record 10s video/audio"}
          </button>
          <button onClick={stopRecording} className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-4 text-left font-bold text-yellow-100 hover:bg-yellow-300/20">
            Stop recording
          </button>
          <button onClick={stopCameraMic} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-left font-bold hover:bg-white/10">
            Stop camera/mic
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="font-semibold text-yellow-200">Status</p>
          <p className="mt-2 text-slate-200">{status}</p>
          {error ? <p className="mt-2 text-red-300">{error}</p> : null}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="mb-3 font-semibold text-yellow-200">Live preview</p>
            <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-xl bg-black" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="mb-3 font-semibold text-yellow-200">Captured files</p>

            {photoUrl ? (
              <a href={photoUrl} download="pantavion-emergency-photo.png" className="mb-3 block rounded-xl border border-white/10 px-4 py-3 text-yellow-100 hover:bg-white/10">
                Download emergency photo
              </a>
            ) : null}

            {videoUrl ? (
              <a href={videoUrl} download="pantavion-emergency-evidence.webm" className="block rounded-xl border border-white/10 px-4 py-3 text-yellow-100 hover:bg-white/10">
                Download emergency video/audio
              </a>
            ) : null}

            {!photoUrl && !videoUrl ? (
              <p className="text-sm text-slate-400">No captured evidence yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
