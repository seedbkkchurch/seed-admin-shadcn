import { useState } from "react";
import { PrayerRequestFormDialog } from "./prayer-request-form-dialog";
import { PrayerRequestItem } from "./prayer-request-item";
import type { PrayerEntryType, PrayerRequest } from "../data/schema";

type PrayerRequestListProps = {
  lambId: string;
  type: PrayerEntryType;
  requests: PrayerRequest[];
};

export function PrayerRequestList({
  lambId,
  type,
  requests,
}: PrayerRequestListProps) {
  const [editingRequest, setEditingRequest] = useState<PrayerRequest | null>(
    null,
  );

  if (requests.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        ยังไม่มีรายการ — กด "เพิ่ม" เพื่อเริ่มจดรายการแรก
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {requests.map((request) => (
          <PrayerRequestItem
            key={request.id}
            request={request}
            onEdit={() => setEditingRequest(request)}
          />
        ))}
      </div>

      {editingRequest && (
        <PrayerRequestFormDialog
          open
          lambId={lambId}
          type={type}
          editingRequest={editingRequest}
          onOpenChange={(open) => !open && setEditingRequest(null)}
        />
      )}
    </>
  );
}
