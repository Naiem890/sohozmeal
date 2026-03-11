import { useEffect, useRef, useState } from "react";
import { UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Axios } from "../../api/api";
import { DEPARTMENTS } from "../../Utils/constant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  _id: string;
  studentId: string;
  newStudentId?: string;
  hallId?: string;
  name?: string;
  phoneNumber?: string;
  department?: string;
  batch?: string | number;
  gender: string;
  roomNo?: string;
  residence?: string;
  profileImage?: { data: number[] };
  [key: string]: unknown;
}

interface EditStudentModalProps {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  student: Student | null;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  setStudent: React.Dispatch<React.SetStateAction<Student | null>>;
}

export const EditStudentModal = ({ showModal, setShowModal, student, setStudents, setStudent }: EditStudentModalProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prevImagePreview, setPrevImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [halls, setHalls] = useState<{ _id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!student?.gender) return;
    Axios.get(`/hall?wing=${student.gender}`).then((r) => setHalls(r.data)).catch(() => {});
  }, [student?.gender]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  useEffect(() => {
    let url: string | null = null;
    if (student?.profileImage) {
      url = URL.createObjectURL(
        new Blob([new Uint8Array(student.profileImage.data)], { type: "image/jpeg" })
      );
      setImagePreview(url);
      setPrevImagePreview(url);
    } else {
      setImagePreview(null);
      setPrevImagePreview(null);
    }
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const formData = new FormData();
    formData.append("name", student.name || "");
    formData.append("phoneNumber", student.phoneNumber || "");
    formData.append("studentId", student.newStudentId || student.studentId);
    formData.append("hallId", student.hallId || "");
    formData.append("department", student.department || "");
    formData.append("batch", String(student.batch ?? ""));
    formData.append("gender", student.gender);
    formData.append("roomNo", student.roomNo || "");
    formData.append("residence", student.residence || "");
    if (imageFile) formData.append("profileImage", imageFile);

    try {
      const res = await Axios.put("/student", formData);
      const updated = res.data.student as Student;
      setStudents((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      toast.success(res.data.message);
      setShowModal(false);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? "Failed to update student");
    }
  };

  const handleClose = () => {
    setImagePreview(prevImagePreview);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(false);
  };

  if (!student) return null;

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo */}
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <UserCircle className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <label className="text-xs text-primary cursor-pointer hover:underline">
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(await fileToBase64(file));
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex-1 grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={student.name || ""}
                  onChange={(e) => setStudent({ ...student, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  value={student.phoneNumber || ""}
                  onChange={(e) => setStudent({ ...student, phoneNumber: e.target.value })}
                  placeholder="01712345678"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Student ID</Label>
              <Input
                value={student.newStudentId ?? student.studentId ?? ""}
                onChange={(e) => setStudent({ ...student, newStudentId: e.target.value })}
                placeholder="Student ID"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hall ID</Label>
              <Input
                value={student.hallId || ""}
                onChange={(e) => setStudent({ ...student, hallId: e.target.value })}
                placeholder="Hall ID"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={student.department || ""}
                onValueChange={(v) => setStudent({ ...student, department: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Input
                type="number"
                value={student.batch || ""}
                onChange={(e) => setStudent({ ...student, batch: +e.target.value })}
                placeholder="e.g. 2020"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Room No</Label>
              <Input
                value={student.roomNo || ""}
                onChange={(e) => setStudent({ ...student, roomNo: e.target.value })}
                placeholder="Room number"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Residence</Label>
              <Select
                value={student.residence || "NOT_SELECTED"}
                onValueChange={(v) => setStudent({ ...student, residence: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select residence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_SELECTED">Not Selected</SelectItem>
                  {halls.map((h) => (
                    <SelectItem key={h._id} value={h.name}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                value={student.gender || ""}
                onValueChange={(v) => setStudent({ ...student, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
