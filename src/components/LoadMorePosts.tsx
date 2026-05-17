"use client";

import { ArrowDown } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import type { PostWithAuthor } from "@/lib/db";
import type { FeedScope } from "@/lib/queries";
import { PostCard } from "./PostCard";
import { showToast } from "./ToastProvider";

type LoadMorePostsProps = {
  initialPage: number;
  scope: FeedScope;
  currentUserId: number;
};

export function LoadMorePosts({
  initialPage,
  scope,
  currentUserId,
}: LoadMorePostsProps) {
  const [page, setPage] = useState(initialPage);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const response = await fetch(`/api/posts?page=${page}&scope=${scope}`);

      if (!response.ok) {
        showToast("Non sono riuscito a caricare altri post.", "error");
        return;
      }

      const nextPosts = (await response.json()) as PostWithAuthor[];
      setPosts((current) => [...current, ...nextPosts]);
      setPage((current) => current + 1);
      setHasMore(response.headers.get("X-Has-More") === "1");

      if (!nextPosts.length) {
        showToast("Hai raggiunto la fine del feed.");
      }
    });
  }

  return (
    <>
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} staggerIndex={i} />
      ))}
      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={pending}
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-charcoal/10 bg-paper px-4 text-sm font-semibold text-charcoal/70 transition hover:border-charcoal/25 hover:text-charcoal active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ArrowDown size={17} weight="bold" />
          {pending ? "Caricamento" : "Carica altri post"}
        </button>
      ) : null}
    </>
  );
}
