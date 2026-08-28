import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, GitBranch } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMentorshipTree } from "./data/queries";

// ผัง org-chart พี่เลี้ยง-ลูกแกะทั้งคริสตจักร /mentorship-chart — grill-me
// 2026-08-28. Read-only ให้ทุกคนที่ login แล้วดูได้ (ไม่ gate role) ไม่ใช้
// library วาดผังภายนอก (ไม่มีตัวไหนเหมาะในโปรเจกต์นี้อยู่แล้ว — recharts
// วาดกราฟข้อมูล ไม่ใช่ node/tree diagram) — วาดเองด้วย CSS flex + เส้นบอก
// ความสัมพันธ์แบบ pure-CSS connector (border-top/border-left) แทน
//
// เฉพาะคนที่ "มีส่วนร่วม" ในความสัมพันธ์พี่เลี้ยงจริง (มีพี่เลี้ยง หรือ เป็น
// พี่เลี้ยงของใครสักคน) เท่านั้นที่ขึ้นในผัง — ลูกแกะที่ไม่มีทั้งสองอย่างจะ
// รกผังเปล่าๆ (คริสตจักรนี้มีเกือบ 50 คน ส่วนใหญ่ยังไม่ได้อยู่ในสายพี่เลี้ยง
// ใดๆ) แสดงแยกเป็นสรุปจำนวนท้ายหน้าแทน

type TreeNode = {
  id: string;
  nick_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  role: string;
  status: boolean | null;
  children: TreeNode[];
};

function displayName(
  n: Pick<TreeNode, "nick_name" | "first_name" | "last_name">,
) {
  return (
    n.nick_name || [n.first_name, n.last_name].filter(Boolean).join(" ") || "?"
  );
}

function buildForest(
  flat: {
    id: string;
    nick_name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture: string | null;
    role: string;
    status: boolean | null;
    mentor_id: string | null;
  }[],
): { roots: TreeNode[]; isolatedCount: number } {
  const byId = new Map(flat.map((p) => [p.id, p]));
  const childrenOf = new Map<string, string[]>();
  for (const p of flat) {
    if (!p.mentor_id) continue;
    if (!byId.has(p.mentor_id)) continue; // orphaned mentor_id, ignore
    const list = childrenOf.get(p.mentor_id) ?? [];
    list.push(p.id);
    childrenOf.set(p.mentor_id, list);
  }

  const isParticipant = (id: string) => {
    const p = byId.get(id)!;
    return !!p.mentor_id || (childrenOf.get(id)?.length ?? 0) > 0;
  };

  function toNode(id: string, visited: Set<string>): TreeNode {
    const p = byId.get(id)!;
    const kids = visited.has(id) ? [] : (childrenOf.get(id) ?? []);
    const nextVisited = new Set(visited).add(id);
    return {
      id: p.id,
      nick_name: p.nick_name,
      first_name: p.first_name,
      last_name: p.last_name,
      profile_picture: p.profile_picture,
      role: p.role,
      status: p.status,
      // กันลูป infinite เผื่อมีความสัมพันธ์วนไกลกว่า 2 ทอด (DB trigger กัน
      // แค่ self + วนกลับตรง 2 ทอด — กรณีนี้ไม่ควรเกิดแต่กันไว้ไม่ให้หน้าค้าง)
      children: kids
        .filter((cid) => !nextVisited.has(cid))
        .map((cid) => toNode(cid, nextVisited)),
    };
  }

  const roots = flat
    .filter((p) => !p.mentor_id && isParticipant(p.id))
    .map((p) => toNode(p.id, new Set()));

  const isolatedCount = flat.filter((p) => !isParticipant(p.id)).length;

  return { roots, isolatedCount };
}

function PersonNode({ node }: { node: TreeNode }) {
  return (
    <Link
      to="/lamb-info/$lambId"
      params={{ lambId: node.id }}
      className={cn(
        "bg-card flex w-44 flex-col items-center gap-1.5 rounded-lg border p-4 text-center shadow-sm transition-colors hover:border-primary",
        node.status === false && "opacity-50",
      )}
    >
      <Avatar className="size-20">
        <AvatarImage src={node.profile_picture ?? undefined} />
        <AvatarFallback>
          {(node.nick_name || node.first_name || "?").charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="line-clamp-1 text-sm font-medium">
        {displayName(node)}
      </div>
      {(node.role === "cell_leader" || node.role === "team_leader") && (
        <div className="text-muted-foreground text-xs">
          {node.role === "team_leader" ? "ทีมผู้รับใช้หลัก" : "หัวหน้าแคร์"}
        </div>
      )}
    </Link>
  );
}

// 1 กิ่ง = โหนดตัวเอง + เส้นดิ่งลงมา + แถวลูก (ลูกแต่ละคนมีเส้นดิ่งสั้นๆ ต่อ
// ขึ้นมาจากเส้นนอนกลาง) เป็น pure-CSS connector แบบมาตรฐาน ไม่ต้องพึ่ง canvas/
// svg absolute positioning ที่คำนวณตำแหน่งเองยาก
function TreeBranch({ node }: { node: TreeNode }) {
  const hasChildren = node.children.length > 0;
  return (
    <div className="flex flex-col items-center">
      <PersonNode node={node} />
      {hasChildren && (
        <>
          <div className="bg-border h-6 w-px" />
          <div className="flex items-start">
            {node.children.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center px-3">
                <div className="relative h-6 w-full">
                  <div
                    className={cn(
                      "bg-border absolute top-0 h-px",
                      node.children.length === 1
                        ? "start-1/2 end-1/2"
                        : i === 0
                          ? "start-1/2 end-0"
                          : i === node.children.length - 1
                            ? "start-0 end-1/2"
                            : "start-0 end-0",
                    )}
                  />
                  <div className="bg-border absolute top-0 start-1/2 h-6 w-px -translate-x-1/2" />
                </div>
                <TreeBranch node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function MentorshipChart() {
  const { data, isPending, isError, error } = useMentorshipTree();

  const { roots, isolatedCount } = useMemo(
    () => (data ? buildForest(data) : { roots: [], isolatedCount: 0 }),
    [data],
  );

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <GitBranch className="size-6" /> ผังพี่เลี้ยงลูกแกะ
          </h2>
          <p className="text-muted-foreground">
            โครงสร้างพี่เลี้ยง-ลูกแกะทั้งคริสตจักร (ดูได้อย่างเดียว —
            แก้ไขที่หน้า{" "}
            <Link to="/mentorship" className="underline">
              พี่เลี้ยงลูกแกะ
            </Link>
            )
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดผังไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : roots.length === 0 ? (
          <Alert>
            <AlertCircle />
            <AlertTitle>ยังไม่มีความสัมพันธ์พี่เลี้ยงในระบบ</AlertTitle>
            <AlertDescription>
              เริ่มตั้งพี่เลี้ยงได้ที่หน้า{" "}
              <Link to="/mentorship" className="underline">
                พี่เลี้ยงลูกแกะ
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto rounded-md border p-6">
            <div className="flex w-max gap-10">
              {roots.map((root) => (
                <TreeBranch key={root.id} node={root} />
              ))}
            </div>
          </div>
        )}

        {isolatedCount > 0 && (
          <p className="text-muted-foreground text-sm">
            อีก {isolatedCount}{" "}
            คนยังไม่มีพี่เลี้ยงและยังไม่ได้เป็นพี่เลี้ยงของใคร — ไม่แสดงในผังนี้
          </p>
        )}
      </Main>
    </>
  );
}
