"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    const result = await deleteProductAction(productId);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Product deleted");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-rose-600 hover:bg-rose-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete product?"
        description="This removes the product, its images and pricing options from the storefront."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep product
            </Button>
            <Button variant="danger" loading={pending} onClick={confirm}>
              Delete permanently
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-navy/70">
          <span className="font-medium text-navy">{productName}</span> will be
          removed. Existing orders keep their saved item details.
        </p>
      </Modal>
    </>
  );
}
