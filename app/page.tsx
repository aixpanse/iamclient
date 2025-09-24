'use client';
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../lib/contexts/user-context";

function HomeContent() {
  const session = useSearchParams().get("session");
  const { user, isLoading, logout, login } = useUser(session);

  if (isLoading) {
    return (
      <div className="flex gap-4 flex-col items-center justify-center min-h-screen py-2">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 flex-col items-center justify-center min-h-screen py-2">
      <div>{user?.email || 'Not logged in'}</div>
      <button className="bg-blue-500 w-20 text-center rounded p-2" onClick={() => login()}>Log in</button>
      <button className="bg-blue-500 w-20 text-center rounded p-2" onClick={() => logout()}>Log out</button>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex gap-4 flex-col items-center justify-center min-h-screen py-2">
        <div>Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
