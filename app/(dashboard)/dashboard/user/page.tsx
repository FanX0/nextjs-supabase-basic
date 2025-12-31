"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  UpdateProfileInput,
} from "@/features/users/user.schema";
import { updateProfile } from "@/features/users/user.actions";
import { useTransition, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function UserProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [defaultValues, setDefaultValues] = useState<{
    avatar_url?: string | null;
  }>();
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitSuccessful },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (data) {
          setValue("full_name", data.full_name || "");
          setValue("avatar_url", data.avatar_url || undefined);
          setDefaultValues({ avatar_url: data.avatar_url });
        }
      }
    }
    getProfile();
  }, [setValue, supabase]);

  const onSubmit = (data: UpdateProfileInput) => {
    startTransition(async () => {
      try {
        await updateProfile(data);
        router.refresh();
        // Optional: Add toast notification here
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-center mb-6">
            <ImageUpload
              bucket="avatars"
              defaultImage={defaultValues?.avatar_url}
              onUpload={(url) => setValue("avatar_url", url)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              {...register("full_name")}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-transparent dark:text-white border"
              placeholder="Your Name"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Update Profile"}
            </button>
          </div>

          {isSubmitSuccessful && !isPending && (
            <p className="text-green-600 text-sm mt-2 text-center">
              Profile updated successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
