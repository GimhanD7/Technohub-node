"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { AlertCircle, Maximize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";

function normalizeVideoUrl(rawUrl) {
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawUrl;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const pathParts = url.pathname.split("/").filter(Boolean);

      if (url.pathname === "/watch" && url.searchParams.get("v")) {
        return `https://www.youtube.com/watch?v=${url.searchParams.get("v")}`;
      }

      if (["shorts", "live", "embed"].includes(pathParts[0]) && pathParts[1]) {
        return `https://www.youtube.com/watch?v=${pathParts[1]}`;
      }
    }

    if (host.endsWith("dropbox.com")) {
      url.searchParams.set("raw", "1");
      url.searchParams.delete("dl");
      return url.toString();
    }
  } catch {
    return rawUrl;
  }

  return rawUrl;
}

function getYouTubeVideoId(rawUrl) {
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      return pathParts[0] || "";
    }

    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      if (["shorts", "live", "embed", "v"].includes(pathParts[0])) return pathParts[1] || "";
    }
  } catch {
    return "";
  }

  return "";
}

function getGoogleDriveFileId(rawUrl) {
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host !== "drive.google.com" && host !== "docs.google.com") return "";

    const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (filePathMatch?.[1]) return filePathMatch[1];

    const fileId = url.searchParams.get("id");
    if (fileId) return fileId;
  } catch {
    return "";
  }

  return "";
}

export default function CustomVideoPlayer({ url }) {
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const youtubeFrameRef = useRef(null);
  const youtubeContainerRef = useRef(null);
  const source = useMemo(() => normalizeVideoUrl(url), [url]);
  const youtubeVideoId = useMemo(() => getYouTubeVideoId(source), [source]);
  const driveFileId = useMemo(() => getGoogleDriveFileId(url), [url]);
  const driveContainerRef = useRef(null);

  useEffect(() => {
    if (!youtubeVideoId) return;

    const handleYouTubeMessage = (event) => {
      if (!event.origin.includes("youtube.com") && !event.origin.includes("youtube-nocookie.com")) return;
      if (event.source !== youtubeFrameRef.current?.contentWindow) return;

      try {
        const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (message?.event === "onReady") {
          setIsYouTubeReady(true);
        }

        if (message?.event === "infoDelivery" && Number.isFinite(message.info?.currentTime)) {
          setCurrentTime(message.info.currentTime);
        }

        if (message?.event === "onStateChange") {
          setIsPlaying(message.info === 1);
        }

        if (message?.event === "onError") {
          setHasError(true);
        }
      } catch {
        // Ignore messages that are not from the YouTube player API.
      }
    };

    window.addEventListener("message", handleYouTubeMessage);
    return () => window.removeEventListener("message", handleYouTubeMessage);
  }, [youtubeVideoId]);

  const sendYouTubeCommand = (command, args = []) => {
    youtubeFrameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args }),
      "*"
    );
  };

  const toggleYouTubePlayback = () => {
    const nextPlayingState = !isPlaying;
    if (nextPlayingState) {
      sendYouTubeCommand("setVolume", [volume]);
      sendYouTubeCommand(isMuted ? "mute" : "unMute");
      sendYouTubeCommand("playVideo");
    } else {
      sendYouTubeCommand("pauseVideo");
    }
    setIsPlaying(nextPlayingState);
  };

  const toggleYouTubeMute = () => {
    const nextMutedState = !isMuted;
    sendYouTubeCommand(nextMutedState ? "mute" : "unMute");
    setIsMuted(nextMutedState);
  };

  const changeYouTubeVolume = (event) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
    sendYouTubeCommand("setVolume", [nextVolume]);
    sendYouTubeCommand(nextVolume === 0 ? "mute" : "unMute");
  };

  const openYouTubeFullscreen = () => {
    youtubeContainerRef.current?.requestFullscreen?.();
  };

  const seekYouTubeBy = (seconds) => {
    sendYouTubeCommand("seekTo", [Math.max(0, currentTime + seconds), true]);
  };

  const connectYouTubePlayer = () => {
    setIsYouTubeReady(true);
    youtubeFrameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: "techno-hub-course-player" }),
      "*"
    );
  };

  const openDriveFullscreen = () => {
    driveContainerRef.current?.requestFullscreen?.();
  };

  if (!source) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-300 text-sm">
        No video link was provided.
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400" />
        <div>
          <h3 className="text-white font-bold">This video is not available</h3>
          <p className="text-sm text-slate-400 mt-1">For YouTube, use an unlisted video with embedding enabled. For Google Drive, set the file sharing to Anyone with the link can view.</p>
        </div>
      </div>
    );
  }

  if (driveFileId) {
    const drivePreviewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

    return (
      <div ref={driveContainerRef} className="absolute inset-0 bg-black overflow-hidden">
        <iframe
          src={drivePreviewUrl}
          title="Course video"
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => setHasError(true)}
        />
        <div className="absolute top-0 left-0 right-0 z-20 h-14 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-auto" aria-hidden="true" />
        <button
          type="button"
          onClick={openDriveFullscreen}
          className="absolute bottom-3 right-3 z-20 rounded-md bg-black/70 px-3 py-2 text-xs font-bold text-white hover:bg-black"
        >
          Fullscreen
        </button>
      </div>
    );
  }

  if (youtubeVideoId) {
    const playerOrigin = typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : "";
    const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&origin=${playerOrigin}`;

    return (
      <div ref={youtubeContainerRef} className="absolute inset-0 bg-black overflow-hidden">
        <iframe
          ref={youtubeFrameRef}
          src={embedUrl}
          title="Course video"
          className="absolute inset-0 w-full h-full border-0 pointer-events-none"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={connectYouTubePlayer}
        />
        <button
          type="button"
          onClick={toggleYouTubePlayback}
          disabled={!isYouTubeReady}
          className="absolute inset-0 z-10 flex items-center justify-center bg-transparent disabled:cursor-wait"
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {!isPlaying && (
            <span className="w-16 h-16 rounded-full bg-blue-600/95 text-white flex items-center justify-center shadow-xl hover:bg-blue-700 transition-colors">
              <Play className="w-8 h-8 ml-1 fill-current" />
            </span>
          )}
        </button>
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between bg-black/90 px-4 py-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={toggleYouTubePlayback} disabled={!isYouTubeReady} className="text-white hover:text-blue-400 disabled:opacity-50" aria-label={isPlaying ? "Pause video" : "Play video"}>
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button type="button" onClick={() => seekYouTubeBy(-10)} disabled={!isYouTubeReady} className="text-white hover:text-blue-400 disabled:opacity-50" aria-label="Go back 10 seconds" title="Back 10 seconds">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => seekYouTubeBy(10)} disabled={!isYouTubeReady} className="text-white hover:text-blue-400 disabled:opacity-50" aria-label="Go forward 10 seconds" title="Forward 10 seconds">
              <RotateCw className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleYouTubeMute} disabled={!isYouTubeReady} className="text-white hover:text-blue-400 disabled:opacity-50" aria-label={isMuted ? "Unmute video" : "Mute video"}>
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={changeYouTubeVolume}
                className="w-24 accent-blue-500"
                aria-label="Video volume"
              />
            </div>
          </div>
          <button type="button" onClick={openYouTubeFullscreen} className="text-white hover:text-blue-400" aria-label="Enter fullscreen">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-12 right-0 z-20 h-14 w-40 bg-black pointer-events-auto" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      <ReactPlayer
        src={source}
        controls
        width="100%"
        height="100%"
        playsInline
        onError={() => setHasError(true)}
        config={{
          youtube: {
            rel: 0,
            modestbranding: 1
          }
        }}
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  );
}
