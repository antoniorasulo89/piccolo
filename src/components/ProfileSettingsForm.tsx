"use client";

import { Check, FloppyDisk, ImageSquare } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { showToast } from "./ToastProvider";

type ProfileSettingsFormProps = {
  user: {
    name: string;
    bio: string;
    avatar_url: string | null;
    cover_url: string | null;
  };
};

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Il file deve essere una immagine."));
      return;
    }

    if (file.size > 650_000) {
      reject(new Error("Usa una immagine sotto 650 KB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Lettura file non riuscita."));
    reader.readAsDataURL(file);
  });
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [avatarData, setAvatarData] = useState("");
  const [coverUrl, setCoverUrl] = useState(user.cover_url ?? "");
  const [coverData, setCoverData] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);

    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          avatar_url: avatarUrl,
          avatar_data: avatarData,
          cover_url: coverUrl,
          cover_data: coverData,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        const message = payload.error ?? "Salvataggio non riuscito.";
        setError(message);
        showToast(message, "error");
        return;
      }

      setSaved(true);
      showToast("Profilo aggiornato.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 grid max-w-2xl gap-5">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-semibold text-charcoal">
          Nome pubblico
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={48}
          required
          className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="bio" className="text-sm font-semibold text-charcoal">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={160}
          rows={4}
          placeholder="Racconta in una frase chi sei o cosa condividi."
          className="min-h-28 resize-none rounded-lg border border-charcoal/10 bg-paper px-3 py-3 leading-7 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
        <p className="font-mono text-xs text-charcoal/45">{160 - bio.length} caratteri</p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="avatar" className="text-sm font-semibold text-charcoal">
          Avatar URL
        </label>
        <input
          id="avatar"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://..."
          className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
        <p className="text-xs text-charcoal/45">
          Usa un link HTTPS a una immagine pubblica. Lascia vuoto per usare le iniziali.
        </p>
      </div>

      <div className="grid gap-2 rounded-lg border border-charcoal/10 bg-surface p-4">
        <label htmlFor="avatar-file" className="text-sm font-semibold text-charcoal">
          Upload avatar
        </label>
        <input
          id="avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              setError("");
              setAvatarData(await readImageAsDataUrl(file));
              setAvatarUrl("");
            } catch (uploadError) {
              const message = uploadError instanceof Error ? uploadError.message : "Upload non riuscito.";
              setError(message);
              showToast(message, "error");
            }
          }}
          className="text-sm text-charcoal/65 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:text-sm file:font-semibold file:text-paper"
        />
        <p className="inline-flex items-center gap-2 text-xs text-charcoal/45">
          <ImageSquare size={15} />
          PNG, JPG, WebP, GIF o AVIF sotto 650 KB.
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="cover" className="text-sm font-semibold text-charcoal">
          Copertina URL
        </label>
        <input
          id="cover"
          value={coverUrl}
          onChange={(event) => {
            setCoverUrl(event.target.value);
            setCoverData("");
          }}
          placeholder="https://..."
          className="h-11 rounded-lg border border-charcoal/10 bg-paper px-3 text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-fern-700 focus:ring-4 focus:ring-fern-700/10"
        />
      </div>

      <div className="grid gap-2 rounded-lg border border-charcoal/10 bg-surface p-4">
        <label htmlFor="cover-file" className="text-sm font-semibold text-charcoal">
          Upload copertina
        </label>
        <input
          id="cover-file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              setError("");
              setCoverData(await readImageAsDataUrl(file));
              setCoverUrl("");
            } catch (uploadError) {
              const message = uploadError instanceof Error ? uploadError.message : "Upload non riuscito.";
              setError(message);
              showToast(message, "error");
            }
          }}
          className="text-sm text-charcoal/65 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:text-sm file:font-semibold file:text-paper"
        />
        <p className="text-xs text-charcoal/45">
          Usa una immagine larga e leggera: 1200x360 px e ideale.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-900/15 bg-rose-100 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-fern-900">
          <Check size={17} weight="bold" />
          Profilo aggiornato.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-fern-700 px-5 text-sm font-semibold text-paper transition hover:bg-fern-900 active:translate-y-px disabled:opacity-50"
      >
        <FloppyDisk size={17} weight="bold" />
        {pending ? "Salvataggio" : "Salva profilo"}
      </button>
    </form>
  );
}
