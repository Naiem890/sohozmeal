import { useState, useEffect, useCallback } from "react";
import { Axios } from "../../api/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import Pagination from "../Common/Pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const WING_STYLE = {
  MALE:   "bg-blue-100 text-blue-700 border-blue-200",
  FEMALE: "bg-pink-100 text-pink-700 border-pink-200",
  ALL:    "bg-violet-100 text-violet-700 border-violet-200",
};

export default function Notice() {
  const [wing,       setWing]       = useState(null);
  const [notices,    setNotices]    = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page,       setPage]       = useState(1);
  const [expanded,   setExpanded]   = useState({});
  const [loading,    setLoading]    = useState(true);

  // Fetch student profile to get gender (students don't have wing in JWT)
  useEffect(() => {
    Axios.get("/student")
      .then((res) => setWing(res.data.student?.gender || "MALE"))
      .catch(() => setWing("MALE"));
  }, []);

  const fetchNotices = useCallback(async (pg = 1) => {
    if (!wing) return;
    setLoading(true);
    try {
      const res = await Axios.get(`/notice/${wing}?page=${pg}&limit=${PAGE_SIZE}`);
      setNotices(res.data.notices);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, [wing]);

  useEffect(() => {
    fetchNotices(page);
  }, [page, fetchNotices]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <ul className="divide-y divide-border">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-muted/50 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
                </div>
              </li>
            ))}
          </ul>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Megaphone className="h-10 w-10 opacity-30" />
            <p className="font-medium">No notices yet</p>
            <p className="text-sm">Stay tuned for updates from your wing admin.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notices.map((notice) => {
              const open = !!expanded[notice._id];
              return (
                <li key={notice._id} className="hover:bg-muted/20 transition-colors">
                  {/* Clickable header row */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleExpand(notice._id)}
                  >
                    <div className="mt-0.5 shrink-0 rounded-lg bg-accent p-2">
                      <Megaphone className="h-4 w-4 text-accent-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{notice.title}</p>
                      {!open && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {notice.description}
                        </p>
                      )}
                      {notice.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notice.createdAt), "dd MMM yyyy")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        WING_STYLE[notice.noticeFor] ?? "bg-muted text-muted-foreground"
                      )}>
                        {notice.noticeFor === "ALL" ? "All" : notice.noticeFor === "MALE" ? "Male" : "Female"}
                      </span>
                      {open
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded body */}
                  {open && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="ml-11 bg-muted/30 rounded-lg p-3 border border-border/50">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {notice.description}
                        </p>
                        {notice.createdAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Posted on {format(new Date(notice.createdAt), "dd MMM yyyy, hh:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
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
