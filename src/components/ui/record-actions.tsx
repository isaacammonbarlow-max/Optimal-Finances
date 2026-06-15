"use client";

import { Button } from "@/components/ui/button";

type RecordActionsProps = {
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave?: () => void;
  onCancel?: () => void;
};

export function RecordActions({
  editing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: RecordActionsProps) {
  if (editing) {
    return (
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onSave}>
          Save
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={onEdit}>
        Edit
      </Button>
      <Button type="button" size="sm" variant="danger" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}

export async function patchRecord(endpoint: string, id: string, body: object) {
  const res = await fetch(`${endpoint}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Update failed");
  }
  return res.json();
}

export async function deleteRecord(endpoint: string, id: string) {
  if (!confirm("Delete this item permanently?")) return false;
  const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Delete failed");
  }
  return true;
}
