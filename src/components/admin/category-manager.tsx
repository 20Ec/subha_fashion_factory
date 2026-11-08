"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/admin";
import { ImageUploader, type UploadedImage } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { FlowerMark } from "@/components/ui/logo";
import { formatDate } from "@/lib/utils";
import type { Category } from "@/lib/types";

type FormValues = {
  name: string;
  description: string;
  sort_order: string;
  is_active: boolean;
  image: UploadedImage[];
};

const empty: FormValues = {
  name: "",
  description: "",
  sort_order: "0",
  is_active: true,
  image: [],
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [values, setValues] = useState<FormValues>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  function openCreate() {
    setEditing(null);
    setValues(empty);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setValues({
      name: category.name,
      description: category.description ?? "",
      sort_order: String(category.sort_order ?? 0),
      is_active: category.is_active,
      image: category.image_url
        ? [
            {
              image_url: category.image_url,
              public_id: category.image_public_id ?? null,
            },
          ]
        : [],
    });
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const payload = {
      name: values.name,
      description: values.description,
      image_url: values.image[0]?.image_url ?? "",
      image_public_id: values.image[0]?.public_id ?? null,
      is_active: values.is_active,
      sort_order: Math.max(0, Number(values.sort_order) || 0),
    };

    const result = editing
      ? await updateCategoryAction(editing.id, payload)
      : await createCategoryAction(payload);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success(result.success ?? "Saved");
    closeForm();
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteCategoryAction(deleting.id);
    setDeletePending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Category deleted");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-rose">
            Catalog
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-ink">
            Group your flowers so customers can browse by collection.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          className="mt-6 bg-white"
          title="No categories yet"
          description="Create your first category to start organising your products."
        >
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </EmptyState>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
            >
              <div className="relative h-32 w-full bg-gradient-to-br from-pink-soft to-blush">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 360px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-deep-rose">
                    <FlowerMark className="h-8 w-8" />
                  </span>
                )}
                <span className="absolute left-3 top-3">
                  <StatusBadge
                    status={category.is_active ? "delivered" : "cancelled"}
                    label={category.is_active ? "Active" : "Hidden"}
                  />
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {category.name}
                    </h2>
                    <p className="mt-0.5 truncate text-[11px] text-ink">
                      /{category.slug}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-blush px-2 py-1 text-[10px] text-ink">
                    <Tags className="h-3 w-3" />
                    #{category.sort_order}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 min-h-[2.4em] text-xs leading-relaxed text-ink">
                  {category.description || "No description yet."}
                </p>

                {category.created_at && (
                  <p className="mt-2 text-[10px] text-navy/30">
                    Created {formatDate(category.created_at)}
                  </p>
                )}

                <div className="mt-3 flex gap-1.5 border-t border-line pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit category" : "Add category"}
        description="Categories appear in the storefront filters and on the home page."
      >
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              value={values.name}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, name: event.target.value }))
              }
              required
              placeholder="e.g. Bridal bouquets"
            />
          </div>

          <div>
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={values.description}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              maxLength={500}
              placeholder="A short line about this collection"
              className="min-h-20"
            />
          </div>

          <div>
            <Label>Collection image</Label>
            <ImageUploader
              images={values.image}
              onChange={(image) =>
                setValues((previous) => ({ ...previous, image }))
              }
              multiple={false}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category-order">Sort order</Label>
              <Input
                id="category-order"
                type="number"
                min={0}
                value={values.sort_order}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    sort_order: event.target.value,
                  }))
                }
              />
            </div>
            <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-navy/70">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    is_active: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-navy/20 text-blue focus:ring-blue/20"
              />
              Visible on the storefront
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete category?"
        description="Products in this category stay in your catalog but become uncategorised."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep category
            </Button>
            <Button variant="danger" loading={deletePending} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        {deleting && (
          <p className="text-sm leading-relaxed text-navy/70">
            <span className="font-medium text-navy">{deleting.name}</span> will be
            removed from your storefront. This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}
