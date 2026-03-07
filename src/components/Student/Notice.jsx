import { useState, useEffect } from "react";
import { Axios } from "../../api/api";
import { toast } from "sonner";
import { useAuthUser } from "react-auth-kit";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Pagination from "../Common/Pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const TYPE_STYLE = {
  MALE:   "bg-blue-100 text-blue-700 border-blue-200",
  FEMALE: "bg-pink-100 text-pink-700 border-pink-200",
  ALL:    "bg-violet-100 text-violet-700 border-violet-200",
};

export default function Notice() {
  const user = useAuthUser()();
  const [notices,    setNotices]    = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    const toastId = toast.loading("Loading notices…");
    Axios.get(`/notice/${user.wing}?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        setNotices(res.data.notices);
        setPagination(res.data.pagination);
        toast.dismiss(toastId);
      })
      .catch(() => toast.error("Failed to load notices", { id: toastId }));
  }, [page]);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Megaphone className="h-10 w-10 opacity-30" />
            <p className="text-sm">No notices yet. Stay tuned!</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notices.map((notice) => (
              <li
                key={notice._id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="mt-0.5 shrink-0 rounded-lg bg-accent p-2">
                  <Megaphone className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {notice.title}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {notice.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border",
                    TYPE_STYLE[notice.noticeFor] ?? "bg-muted text-muted-foreground"
                  )}
                >
                  {notice.noticeFor}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
