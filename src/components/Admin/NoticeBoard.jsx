import { useState, useEffect, useCallback } from "react";
import { Axios } from "../../api/api";
import { toast } from "sonner";
import { useAuthUser } from "react-auth-kit";
import { format } from "date-fns";
import { Plus, X, Pencil, Trash2, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Pagination from "../Common/Pagination";

const PAGE_SIZE = 10;

const WING_BADGE = {
  MALE:   "bg-blue-100 text-blue-700 border-blue-200",
  FEMALE: "bg-pink-100 text-pink-700 border-pink-200",
  ALL:    "bg-violet-100 text-violet-700 border-violet-200",
};

export default function NoticeBoard() {
  const auth = useAuthUser()();
  const [notices,    setNotices]    = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page,       setPage]       = useState(1);
  const [expanded,   setExpanded]   = useState({});
  const [formData,   setFormData]   = useState({
    title: "",
    description: "",
    noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm,  setShowForm]  = useState(false);

  const fetchNotices = useCallback(async (pg = 1) => {
    try {
      const params = `?page=${pg}&limit=${PAGE_SIZE}`;
      const res = auth.wing === "ALL"
        ? await Axios.get(`/notice${params}`)
        : await Axios.get(`/notice/${auth.wing}${params}`);
      setNotices(res.data.notices);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Error loading notices");
    }
  }, [auth.wing]);

  useEffect(() => {
    fetchNotices(page);
  }, [page, fetchNotices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditing ? "Updating notice..." : "Creating notice...");
    try {
      if (isEditing) {
        await Axios.put(`/notice/${editingId}`, formData);
        toast.success("Notice updated", { id: toastId });
      } else {
        await Axios.post("/notice", formData);
        toast.success("Notice posted", { id: toastId });
      }
      resetForm();
      setShowForm(false);
      setPage(1);
      fetchNotices(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error occurred", { id: toastId });
    }
  };

  const handleEdit = (notice) => {
    setFormData({ title: notice.title, description: notice.description, noticeFor: notice.noticeFor });
    setIsEditing(true);
    setEditingId(notice._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const toastId = toast.loading("Deleting notice...");
    try {
      await Axios.delete(`/notice/${id}`);
      toast.success("Notice deleted", { id: toastId });
      const newTotal = pagination.total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const newPage = Math.min(page, newTotalPages);
      setPage(newPage);
      fetchNotices(newPage);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error deleting notice", { id: toastId });
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing });
    setIsEditing(false);
    setEditingId(null);
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Admins can only edit/delete notices for their accessible wing
  const canManage = (notice) =>
    auth.wing === "ALL" || auth.wing === notice.noticeFor;

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Post and manage notices for your wing</p>
        </div>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => {
            if (showForm) resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm
            ? <><X className="h-4 w-4 mr-1" />Close</>
            : <><Plus className="h-4 w-4 mr-1" />New Notice</>}
        </Button>
      </div>

      {/* Form */}
      <div className={`overflow-hidden transition-all duration-300 ${showForm ? "max-h-96" : "max-h-0"}`}>
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <h2 className="text-sm font-semibold">{isEditing ? "Edit Notice" : "New Notice"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder="Notice title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="flex-1"
              />
              {auth.wing === "ALL" && (
                <Select
                  value={formData.noticeFor}
                  onValueChange={(v) => setFormData({ ...formData, noticeFor: v })}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male Wing</SelectItem>
                    <SelectItem value="FEMALE">Female Wing</SelectItem>
                    <SelectItem value="ALL">All Wings</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <textarea
              placeholder="Notice content…"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows={4}
              required
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {auth.wing !== "ALL" && `Posting to ${auth.wing === "MALE" ? "Male" : "Female"} Wing`}
              </span>
              <div className="flex gap-2">
                {isEditing && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => { resetForm(); setShowForm(false); }}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" size="sm">
                  {isEditing ? "Update" : "Post Notice"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Notice list */}
      <div className="border rounded-lg bg-card overflow-hidden">
        {notices.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notices yet</p>
            <p className="text-sm">Create your first notice to get started</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {notices.map((notice) => {
              const open = !!expanded[notice._id];
              return (
                <li key={notice._id} className="hover:bg-muted/20 transition-colors">
                  {/* Row header — always visible */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleExpand(notice._id)}
                  >
                    <div className="shrink-0 bg-primary/10 p-2 rounded-lg">
                      <Megaphone className="w-4 h-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{notice.title}</p>
                      {!open && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{notice.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {notice.createdAt && (
                        <span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(notice.createdAt), "dd MMM yyyy")}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${WING_BADGE[notice.noticeFor] || "bg-muted"}`}>
                        {notice.noticeFor}
                      </span>
                      {canManage(notice) && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(notice)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(notice._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {open
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                  </div>

                  {/* Expanded content */}
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
