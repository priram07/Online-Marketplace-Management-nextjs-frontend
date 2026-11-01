"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Customer } from "@/lib/types";
import Spinner from "@/components/Spinner";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    // Axios call #4: GET /customers/me — the JWT already identifies
    // who "me" is, so no id needs to be passed from the client.
    api
      .get<Customer>("/customers/me")
      .then((res) => {
        if (!cancelled) setProfile(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, "Could not load your profile."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) return <Spinner label="Loading your dashboard..." />;
  if (error) return <p className="text-sm text-rust">{error}</p>;
  if (!profile) return null;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">
        Welcome back, {profile.fullName.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-ink/55">Here&apos;s a quick look at your account.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink/45">Orders</p>
          <p className="mt-1 font-display text-2xl text-ink">{profile.orders?.length ?? 0}</p>
          <Link href="/dashboard/orders" className="mt-2 inline-block text-sm text-plum hover:underline">
            View orders
          </Link>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink/45">Account status</p>
          <p className="mt-1 font-display text-2xl text-ink">
            {profile.isActive ? "Active" : "Inactive"}
          </p>
          <Link href="/dashboard/profile" className="mt-2 inline-block text-sm text-plum hover:underline">
            Edit profile
          </Link>
        </div>
      </div>

      <div className="mt-8 card p-5">
        <p className="text-xs uppercase tracking-wide text-ink/45">Account details</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between border-b border-line/60 pb-2">
            <dt className="text-ink/55">Full name</dt>
            <dd className="text-ink">{profile.fullName}</dd>
          </div>
          <div className="flex justify-between border-b border-line/60 pb-2">
            <dt className="text-ink/55">Email</dt>
            <dd className="text-ink">{profile.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/55">Member since</dt>
            <dd className="text-ink">{new Date(profile.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
