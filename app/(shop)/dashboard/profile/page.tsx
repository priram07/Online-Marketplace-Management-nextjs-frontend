"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api, { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Customer } from "@/lib/types";
import FormField from "@/components/FormField";
import Spinner from "@/components/Spinner";
import { profileSchema, type ProfileFormValues } from "@/lib/validations";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  // Axios call #5: GET /customers/me, used here to pre-fill the edit form.
  useEffect(() => {
    if (!user) return;
    api
      .get<Customer>("/customers/me")
      .then((res) => {
        setProfile(res.data);
        reset({ fullName: res.data.fullName });
      })
      .catch((err) => setServerError(getApiErrorMessage(err, "Could not load your profile.")))
      .finally(() => setIsLoading(false));
  }, [user, reset]);

  // Axios call #6: PATCH /customers/:id — partial update (fullName only,
  // matching PatchCustomerDto on the backend).
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setServerError(null);
    setSaved(false);
    try {
      const { data: updated } = await api.patch<Customer>(`/customers/${user.id}`, {
        fullName: data.fullName
      });
      setProfile(updated);
      setSaved(true);
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Could not update your profile."));
    }
  };

  if (isLoading) return <Spinner label="Loading profile..." />;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Profile</h1>
      <p className="mt-1 text-sm text-ink/55">Update the name attached to your account.</p>

      <div className="mt-6 max-w-sm">
        {profile && (
          <p className="mb-4 text-sm text-ink/60">
            Signed in as <span className="text-ink">{profile.email}</span>
          </p>
        )}

        {serverError && <p className="mb-4 text-sm text-rust">{serverError}</p>}
        {saved && <p className="mb-4 text-sm text-moss">Saved.</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
            <input
              id="fullName"
              className={`input ${errors.fullName ? "input-error" : ""}`}
              {...register("fullName")}
            />
          </FormField>

          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
