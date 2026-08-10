"use client";

import {
  useActionState,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { CATEGORIES, type Item } from "@/types/database";

export type ItemFormState = { error?: string };

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const inputClass =
  "w-full rounded-md border border-green-200 px-3 py-2 outline-none focus:border-green-500 dark:border-green-800 dark:bg-transparent dark:focus:border-green-400";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1-2h6l1 2h2.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
      />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 17 4.5-5 3 3L17 10l2.5 3.5"
      />
    </svg>
  );
}

export default function ItemForm({
  mode,
  item,
  action,
}: {
  mode: "create" | "edit";
  item?: Item;
  action: (
    prevState: ItemFormState,
    formData: FormData
  ) => Promise<ItemFormState>;
}) {
  const [state, formAction, pending] = useActionState<
    ItemFormState,
    FormData
  >(action, {});
  const [type, setType] = useState<"lost" | "found">(item?.type ?? "lost");
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    item?.image_url ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openFilePicker(capture?: "environment") {
    const input = fileInputRef.current;
    if (!input) return;
    if (capture) {
      input.setAttribute("capture", capture);
    } else {
      input.removeAttribute("capture");
    }
    input.click();
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError(null);

    if (!file) {
      setPreview(item?.image_url ?? null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPG, JPEG or PNG images are supported.");
      event.target.value = "";
      setPreview(item?.image_url ?? null);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 5MB or smaller.");
      event.target.value = "";
      setPreview(item?.image_url ?? null);
      return;
    }

    setPreview(URL.createObjectURL(file));
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (mode === "create" && !preview) {
      event.preventDefault();
      setImageError("An image is required.");
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleFormSubmit}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="type" value={type} />

      <div>
        <span className="mb-1 block text-sm font-medium">Lost / Found</span>
        <div className="inline-flex overflow-hidden rounded-md border border-green-200 dark:border-green-800">
          {(["lost", "found"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 text-sm font-medium capitalize ${
                type === t
                  ? "bg-green-600 text-white"
                  : "hover:bg-green-50 dark:hover:bg-green-900/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={item?.title}
          placeholder="e.g. Brown Leather Wallet"
          className={inputClass}
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={3}
          defaultValue={item?.description ?? ""}
          placeholder="Describe the item and where/when you found/lost it..."
          className={inputClass}
        />
      </Field>

      <Field label="Category">
        <select
          name="category"
          required
          defaultValue={item?.category ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Date">
        <input
          type="date"
          name="item_date"
          required
          defaultValue={item?.item_date}
          className={inputClass}
        />
      </Field>

      <Field label="Location">
        <input
          name="location"
          required
          defaultValue={item?.location}
          placeholder="e.g. Library 2nd Floor"
          className={inputClass}
        />
      </Field>

      <div>
        <span className="mb-1 block text-sm font-medium">Photo</span>

        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openFilePicker("environment")}
            className="flex items-center gap-2 rounded-md border border-green-200 px-3 py-2 text-sm hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/40"
          >
            <CameraIcon />
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => openFilePicker()}
            className="flex items-center gap-2 rounded-md border border-green-200 px-3 py-2 text-sm hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/40"
          >
            <GalleryIcon />
            Choose File
          </button>
        </div>

        <p className="mt-1 text-xs text-green-900/50 dark:text-green-100/50">
          JPG or PNG, up to 5MB.
        </p>
        {imageError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {imageError}
          </p>
        )}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="mt-3 h-32 w-32 rounded-md border border-green-200 object-cover dark:border-green-800"
          />
        )}
      </div>

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || Boolean(imageError)}
        className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending
          ? "Saving..."
          : mode === "create"
            ? "Publish Listing"
            : "Save Changes"}
      </button>
    </form>
  );
}
