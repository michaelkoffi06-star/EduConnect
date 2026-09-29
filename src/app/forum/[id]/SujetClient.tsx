"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  BackLink,
  Backdrop,
  ErrorBox,
  Glow,
  Icon,
  InfoBox,
  Page,
  SkeletonCards,
  SuccessBox,
  cardClass,
  inputClass,
  primaryBtn,
} from "@/components/compte/ui";
import { AuthorLine, LEVEL_LABELS, type ForumAuthor } from "@/components/forum/shared";

interface Post { id: string; body: string; createdAt: string; author: ForumAuthor; }
interface Thread {
  id: string;
  space: "QUESTIONS" | "SALLE_DES_PROFS";
  title: string;
  body: string;
  level: string | null;
  createdAt: string;
  subject: { id: string; name: string } | null;
  author: ForumAuthor;
}

// Actions discrètes sous un message : signaler (tout compte connecté), supprimer (auteur)
function MessageActions({
  threadId,
  postId,
  isMine,
  loggedIn,
  onDeleted,
}: {
  threadId: string;
  postId?: string;
  isMine: boolean;
  loggedIn: boolean;
  onDeleted: () => void;
}) {
  const [reported, setReported] = useState(false);

  const report = async () => {
    const reason = window.prompt("Pourquoi signaler ce message ? (optionnel)");
    if (reason === null) return;
    const res = await fetch("/api/forum/signalements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, postId, reason }),
    }).catch(() => null);
    if (res?.ok) setReported(true);
  };

  const remove = async () => {
    if (!window.confirm(postId ? "Supprimer ta réponse ?" : "Supprimer ce sujet et toutes ses réponses ?")) return;
    const res = await fetch(postId ? `/api/forum/posts/${postId}` : `/api/forum/threads/${threadId}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) onDeleted();
  };

  if (!loggedIn) return null;
  return (
    <div className="flex gap-4 text-xs text-gray-400">
      {isMine ? (
        <button type="button" onClick={remove} className="inline-flex items-center gap-1 hover:text-red-600 transition-colors">{Icon.trash(14)} Supprimer</button>
      ) : reported ? (
        <span className="inline-flex items-center gap-1 text-emerald-600">{Icon.check(14)} Signalé, merci.</span>
      ) : (
        <button type="button" onClick={report} className="inline-flex items-center gap-1 hover:text-red-600 transition-colors">{Icon.flag(14)} Signaler</button>
      )}
    </div>
  );
}

export default function SujetClient({ id }: { id: string }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [justPosted, setJustPosted] = useState(false);

  useEffect(() => {
    fetch(`/api/forum/threads/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setThread(data.thread);
        setPosts(data.posts);
        setCanWrite(data.canWrite);
        setCurrentUserId(data.currentUserId);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message || "Ce sujet n'a pas pu se charger.");
        setStatus("error");
      });
  }, [id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError("");
    setSending(true);
    try {
      const res = await fetch(`/api/forum/threads/${id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts((prev) => [...prev, data]);
      setReply("");
      setJustPosted(true);
    } catch (err: any) {
      setReplyError(err.message || "Impossible d'envoyer la réponse.");
    } finally {
      setSending(false);
    }
  };

  const backHref = thread?.space === "SALLE_DES_PROFS" ? "/forum?espace=profs" : "/forum";

  if (status === "loading") {
    return (
      <Page width="max-w-3xl">
        <SkeletonCards count={3} />
      </Page>
    );
  }

  if (status === "error" || !thread) {
    return (
      <Page>
        <ErrorBox>{error}</ErrorBox>
        <p className="text-center mt-6">
          <BackLink href="/forum">Retour au forum</BackLink>
        </p>
      </Page>
    );
  }

  const isProfs = thread.space === "SALLE_DES_PROFS";

  return (
    <div className="min-h-screen bg-[#faf8f2] flex flex-col">
      <SiteHeader theme="light" />

      {/* Bandeau sombre : la question en titre */}
      <section className="relative overflow-hidden">
        <Backdrop src={isProfs ? "/images/comptes/espace-instructeur.jpg" : "/images/comptes/forum.jpg"} position="center 40%" dark />
        <div className="relative max-w-3xl mx-auto px-5 pt-8 pb-24 md:pt-10 md:pb-28 text-white animate-fade-blur">
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#f0d58a] hover:gap-2.5 transition-all">
            {Icon.back(16)} {isProfs ? "Salle des profs" : "Forum"}
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-6">
            {thread.subject && (
              <span className="text-[11px] font-bold uppercase tracking-wide bg-[#c9951a] text-white rounded-full px-3 py-1">{thread.subject.name}</span>
            )}
            {thread.level && <span className="text-[11px] font-semibold bg-white/15 backdrop-blur rounded-full px-3 py-1">{LEVEL_LABELS[thread.level]}</span>}
          </div>
          <h1 className="mt-4 text-2xl md:text-4xl font-bold leading-tight">{thread.title}</h1>
        </div>
      </section>

      <div className="relative flex-1 -mt-16">
        <Glow />
        <div className="relative max-w-3xl mx-auto px-4 pb-16">
          <article className={`${cardClass} space-y-4 animate-fade-blur [animation-delay:100ms]`}>
            <AuthorLine author={thread.author} date={thread.createdAt} size="md" />
            <p className="text-[15px] md:text-base text-gray-800 leading-relaxed whitespace-pre-line break-words">{thread.body}</p>
            <MessageActions
              threadId={thread.id}
              isMine={currentUserId === thread.author.id}
              loggedIn={!!currentUserId}
              onDeleted={() => (window.location.href = backHref)}
            />
          </article>

          <div className="flex items-center gap-3 mt-10 mb-5">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#e2d5b4]" />
            <span className="text-xs font-bold text-[#8a6510] uppercase tracking-[0.14em]">
              {posts.length} réponse{posts.length > 1 ? "s" : ""}
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#e2d5b4]" />
          </div>

          {/* Fil de réponses : ligne verticale qui relie les messages */}
          <div className="relative space-y-4 stagger before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-px before:bg-[#e8dcbd]">
            {posts.map((p, i) => {
              const fromInstructor = p.author.badge === "Instructeur";
              return (
                <div
                  key={p.id}
                  style={{ "--i": Math.min(i, 10) } as React.CSSProperties}
                  className={`relative rounded-[1.5rem] border p-5 space-y-3 ${
                    fromInstructor
                      ? "border-[#c9951a]/50 bg-gradient-to-br from-white to-[#fbf3de] shadow-[0_16px_40px_-22px_rgba(201,149,26,0.8)]"
                      : "border-[#eee6d3] bg-white/90 backdrop-blur shadow-sm"
                  }`}
                >
                  {fromInstructor && (
                    <span className="absolute -top-2.5 right-5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[#c9951a] text-white rounded-full px-2.5 py-1 shadow">
                      {Icon.check(12)} Réponse d&apos;instructeur
                    </span>
                  )}
                  <AuthorLine author={p.author} date={p.createdAt} />
                  <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-line break-words">{p.body}</p>
                  <MessageActions
                    threadId={thread.id}
                    postId={p.id}
                    isMine={currentUserId === p.author.id}
                    loggedIn={!!currentUserId}
                    onDeleted={() => setPosts((prev) => prev.filter((x) => x.id !== p.id))}
                  />
                </div>
              );
            })}
            {posts.length === 0 && (
              <p className="relative text-center text-sm text-gray-500 py-6">Pas encore de réponse. Sois le premier à aider !</p>
            )}
          </div>

          <div className="mt-8">
            {canWrite ? (
              <form onSubmit={sendReply} className={`${cardClass} space-y-4`}>
                <h2 className="flex items-center gap-2 font-bold text-[#0d1b3e]">
                  <span className="text-[#c9951a]">{Icon.pen(18)}</span> Ta réponse
                </h2>
                {justPosted && <SuccessBox>Réponse publiée, merci !</SuccessBox>}
                <textarea
                  aria-label="Ta réponse"
                  required
                  maxLength={5000}
                  rows={5}
                  value={reply}
                  onChange={(e) => { setReply(e.target.value); setJustPosted(false); }}
                  placeholder="Explique la méthode plutôt que de donner seulement le résultat."
                  className={`${inputClass} resize-y`}
                />
                {replyError && <ErrorBox>{replyError}</ErrorBox>}
                <button type="submit" disabled={sending} className={primaryBtn}>{sending ? "Envoi..." : "Répondre"}</button>
              </form>
            ) : !currentUserId ? (
              <InfoBox>
                <Link href={`/connexion?suite=/forum/${thread.id}`} className="font-semibold text-[#8a6510] hover:underline">Connecte-toi</Link> ou{" "}
                <Link href="/inscription" className="font-semibold text-[#8a6510] hover:underline">crée un compte gratuit</Link> pour répondre.
              </InfoBox>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
