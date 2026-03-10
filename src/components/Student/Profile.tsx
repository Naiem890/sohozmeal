import { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { Axios } from "../../api/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "../../Utils/constant";
import { User } from "lucide-react";

interface StudentProfile {
  name: string;
  studentId: string;
  hallId: string;
  phoneNumber: string;
  batch: string;
  roomNo: string;
  residence: string;
  gender: string;
  department: string;
  profileImage?: { data: number[] };
}

const ReadonlyField = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="space-y-1.5">
    <Label className="text-muted-foreground">{label}</Label>
    <Input value={value ?? ""} disabled className="bg-muted/40" readOnly />
  </div>
);

export default function Profile() {
  const auth = useAuthUser();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [image, setImage] = useState<string | null>(null);

  const createObjectURL = (buffer: number[]) => {
    const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  };

  useEffect(() => {
    Axios.get("/student")
      .then((res) => setStudent(res.data.student))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (student?.profileImage) {
      setImage(createObjectURL(student.profileImage.data));
    }
  }, [student]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Contact the hall office to update your information.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
          {image ? (
            <img src={image} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-semibold text-lg">{student?.name || auth()?.name}</p>
          <p className="text-sm text-muted-foreground">{student?.studentId}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5">
        <ReadonlyField label="Full Name"    value={student?.name} />
        <ReadonlyField label="Student ID"   value={student?.studentId} />
        <ReadonlyField label="Hall ID"      value={student?.hallId} />
        <ReadonlyField label="Phone Number" value={student?.phoneNumber} />
        <ReadonlyField label="Batch"        value={student?.batch} />
        <ReadonlyField label="Room No"      value={student?.roomNo} />
        <ReadonlyField label="Residence"    value={student?.residence?.replace(/_/g, " ")} />
        <ReadonlyField label="Gender"       value={student?.gender} />

        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Department</Label>
          <Select value={student?.department ?? ""} disabled>
            <SelectTrigger className="bg-muted/40">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
