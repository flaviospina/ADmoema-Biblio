"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stepper, type Step } from "@/components/Stepper";
import { StoryForm } from "@/components/StoryForm";
import { LyricsEditor } from "@/components/LyricsEditor";
import { MusicPlayer } from "@/components/MusicPlayer";
import type { Briefing, MusicJob, MusicTrack, SongDraft } from "@/lib/types";

const POLL_INTERVAL = 4000;
const POLL_TIMEOUT = 5 * 60 * 1000; // 5 min

interface SongResponse {
  id: string;
  status: MusicJob["status"];
  tracks: MusicTrack[];
  error?: string;
}

export function Creator() {
  const [step, setStep] = useState<Step>("briefing");
  const [draft, setDraft] = useState<SongDraft | null>(null);
  const [job, setJob] = useState<MusicJob | null>(null);
  const [songId, setSongId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStart = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
    setPolling(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // Passo 1 -> 2: gerar a letra.
  async function handleBriefing(b: Briefing) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar a letra.");
      setDraft(data.draft as SongDraft);
      // Guarda o briefing junto do draft para persistir depois.
      (data.draft as SongDraft & { _briefing?: Briefing })._briefing = b;
      setStep("lyrics");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const pollSong = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/songs/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha ao consultar status.");
        const song = data.song as SongResponse;
        setJob({ jobId: id, status: song.status, tracks: song.tracks, error: song.error });

        if (song.status === "complete" || song.status === "failed") {
          stopPolling();
          return;
        }
        if (Date.now() - pollStart.current > POLL_TIMEOUT) {
          setError("Tempo esgotado aguardando o Suno. A musica ficou salva no seu historico.");
          stopPolling();
          return;
        }
        pollTimer.current = setTimeout(() => pollSong(id), POLL_INTERVAL);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao consultar status.");
        stopPolling();
      }
    },
    [stopPolling]
  );

  // Passo 2 -> 3: gerar a musica.
  async function handleGenerateMusic(finalDraft: SongDraft, instrumental: boolean) {
    setLoading(true);
    setError(null);
    setJob(null);
    setDraft(finalDraft);
    const briefing = (draft as (SongDraft & { _briefing?: Briefing }) | null)?._briefing;
    try {
      const res = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: finalDraft, instrumental, briefing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao iniciar a geracao.");
      setSongId(data.songId as string);
      setStep("music");
      setPolling(true);
      pollStart.current = Date.now();
      pollSong(data.songId as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    stopPolling();
    setStep("briefing");
    setDraft(null);
    setJob(null);
    setSongId(null);
    setError(null);
  }

  return (
    <div>
      <Stepper current={step} />

      {step === "briefing" && (
        <StoryForm loading={loading} error={error} onSubmit={handleBriefing} />
      )}

      {step === "lyrics" && draft && (
        <LyricsEditor
          draft={draft}
          loading={loading}
          error={error}
          onBack={() => {
            setError(null);
            setStep("briefing");
          }}
          onConfirm={handleGenerateMusic}
        />
      )}

      {step === "music" && (
        <MusicPlayer
          job={job}
          songId={songId}
          polling={polling}
          error={error}
          onRestart={restart}
        />
      )}
    </div>
  );
}
