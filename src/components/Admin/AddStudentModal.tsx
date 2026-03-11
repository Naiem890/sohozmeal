import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "react-auth-kit";
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

interface AuthUser {
  wing: string;
  [key: string]: unknown;
}

interface AddStudentModalProps {
  showAddStudentModal: boolean;
  setShowAddStudentModal: (v: boolean) => void;
  refetchHandler: () => void;
  setRefetchHallIdHandler: React.Dispatch<React.SetStateAction<boolean>>;
  refetchHallIdHandler: boolean;
}

export const AddStudentModal = ({
  showAddStudentModal,
  setShowAddStudentModal,
  refetchHandler,
  setRefetchHallIdHandler,
  refetchHallIdHandler,
}: AddStudentModalProps) => {
  const auth = useAuthUser()() as AuthUser;
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [hallId, setHallId] = useState("");
  const [suggestedHallId, setSuggestedHallId] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [residence, setResidence] = useState("NOT_SELECTED");
  const [halls, setHalls] = useState<{ _id: string; name: string }[]>([]);
  const [gender, setGender] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [department, setDepartment] = useState("");
  const [isHallIdAvailable, setIsHallIdAvailable] = useState<boolean | null>(null);
  const [hallIdChecked, setHallIdChecked] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const getHallId = async (selectedGender: string) => {
    try {
      const res = await Axios.get("/student/hallId", { params: { wing: selectedGender } });
      setSuggestedHallId(res.data.hallId);
    } catch {
      toast.error("Failed to fetch Hall ID.");
    }
  };

  const checkHallIdAvailability = async (inputHallId: string, selectedGender: string) => {
    try {
      const res = await Axios.get("/student/checkHallId", {
        params: { hallId: inputHallId, wing: selectedGender },
      });
      setIsHallIdAvailable(!res.data.exists);
      setHallIdChecked(true);
    } catch {
      toast.error("Failed to check Hall ID availability.");
    }
  };

  useEffect(() => {
    getHallId(gender);
  }, [gender, refetchHallIdHandler]);

  useEffect(() => {
    Axios.get(`/hall?wing=${gender}`).then((r) => setHalls(r.data)).catch(() => {});
  }, [gender]);

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isHallIdAvailable || !hallIdChecked) {
      toast.error("Please enter a valid and available Hall ID.");
      return;
    }
    const form = e.currentTarget;
    const getField = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";
    try {
      const formData = new FormData();
      if (profileImage) formData.append("profileImage", profileImage);
      formData.append("name", getField("name"));
      formData.append("phoneNumber", getField("phoneNumber"));
      formData.append("studentId", getField("studentId"));
      formData.append("department", department);
      formData.append("batch", getField("batch"));
      formData.append("gender", gender);
      formData.append("hallId", hallId);
      formData.append("roomNo", roomNo);
      formData.append("residence", residence || "NOT_SELECTED");

      const res = await Axios.post("/student/add", formData);
      setShowAddStudentModal(false);
      form.reset();
      setImagePreview("");
      setProfileImage(null);
      refetchHandler();
      setRefetchHallIdHandler((p) => !p);
      toast.success(res.data.message);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? "Failed to add student");
    }
  };

  return (
    <Dialog open={showAddStudentModal} onOpenChange={setShowAddStudentModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddStudent} className="space-y-5">
          {/* Photo + basic info row */}
          <div className="flex gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <UserCircle className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <label className="text-xs text-primary cursor-pointer hover:underline">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      fileToBase64(file).then(setImagePreview);
                      setProfileImage(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Name + Phone */}
            <div className="flex-1 grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Enter full name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" name="phoneNumber" placeholder="01712345678" required />
              </div>
            </div>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" name="studentId" placeholder="e.g. 2020114035" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hallId">Hall ID</Label>
              <div className="relative">
                <Input
                  id="hallId"
                  value={hallId}
                  onChange={(e) => {
                    setHallId(e.target.value);
                    setHallIdChecked(false);
                    if (e.target.value.trim()) checkHallIdAvailability(e.target.value, gender);
                  }}
                  placeholder="Enter Hall ID"
                  className="pr-8"
                />
                {hallId && hallIdChecked && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isHallIdAvailable ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  setHallId(suggestedHallId);
                  checkHallIdAvailability(suggestedHallId, gender);
                }}
              >
                Use suggested: {suggestedHallId}
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment} required>
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
              <Label htmlFor="batch">Batch</Label>
              <Input id="batch" name="batch" type="number" placeholder="e.g. 2020" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roomNo">Room No</Label>
              <Input
                id="roomNo"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="Enter room number"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Residence</Label>
              <Select value={residence} onValueChange={setResidence}>
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

            {auth.wing === "ALL" && (
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddStudentModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!hallIdChecked || !isHallIdAvailable}>
              Add Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
