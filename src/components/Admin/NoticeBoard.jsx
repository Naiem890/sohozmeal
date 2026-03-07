import React, { useState, useEffect } from "react";
import { Axios } from "../../api/api";
import { toast } from "sonner";
import { useAuthUser } from "react-auth-kit";
import { Plus, X, Pencil, Trash2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Pagination from "../Common/Pagination";

const PAGE_SIZE = 10;

export default function NoticeBoard() {
  const auth = useAuthUser()();
  const [notices,    setNotices]    = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page,       setPage]       = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm,  setShowForm]  = useState(false);

  useEffect(() => {
    fetchNotices(page);
  }, [page]);

  const fetchNotices = async (pg = 1) => {
    const toastId = toast.loading("Loading notices...");
    try {
      const params = `?page=${pg}&limit=${PAGE_SIZE}`;
      const res = auth.wing === "ALL"
        ? await Axios.get(`/notice${params}`)
        : await Axios.get(`/notice/${auth.wing}${params}`);
      setNotices(res.data.notices);
      setPagination(res.data.pagination);
      toast.success("Notices loaded", { id: toastId });
    } catch {
      toast.error("Error loading notices", { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditing ? "Updating notice..." : "Creating notice...");
    try {
      if (isEditing) {
        await Axios.put(`/notice/${editingId}`, formData);
        toast.success("Notice updated successfully", { id: toastId });
      } else {
        await Axios.post("/notice", formData);
        toast.success("Notice created successfully", { id: toastId });
      }
      setFormData({ title: "", description: "", noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing });
      setIsEditing(false);
      setEditingId(null);
      setShowForm(false);
      fetchNotices(1);
      setPage(1);
    } catch {
      toast.error("Error occurred", { id: toastId });
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
      toast.success("Notice deleted successfully", { id: toastId });
      // If last item on this page, go back one page
      const newTotal = pagination.total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const newPage = Math.min(page, newTotalPages);
      setPage(newPage);
      fetchNotices(newPage);
    } catch {
      toast.error("Error deleting notice", { id: toastId });
    }
  };

  const wingVariant = { MALE: "default", FEMALE: "secondary", ALL: "outline" };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setIsEditing(false);
              setFormData({ title: "", description: "", noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing });
            }
          }}
        >
          {showForm ? <><X className="h-4 w-4 mr-1" />Close</> : <><Plus className="h-4 w-4 mr-1" />New Notice</>}
        </Button>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${showForm ? "max-h-96" : "max-h-0"}`}>
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Notice Title"
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
              placeholder="Notice Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows="3"
              required
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                {isEditing ? "Update Notice" : "Post Notice"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="flex flex-col divide-y divide-border/50">
        {notices.map((notice) => (
          <div
            key={notice._id}
            className="bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 bg-primary/10 p-2 rounded-lg">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate">{notice.title}</h3>
                  <p className="text-muted-foreground text-xs line-clamp-1">{notice.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={wingVariant[notice.noticeFor] || "outline"} className="text-xs">
                  {notice.noticeFor}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => handleEdit(notice)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(notice._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        </div>

        {notices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No Notices Yet</p>
            <p className="text-sm">Create your first notice to get started</p>
          </div>
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
