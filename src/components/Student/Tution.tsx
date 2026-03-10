import React, { useEffect, useState, useRef } from "react";
import { useAuthUser } from "react-auth-kit";
import { toast } from "sonner";
import { Axios } from "../../api/api";
const fixedInputClass = "w-full rounded-lg h-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6";
const fixedButtonClass = "w-full rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-colors";
import Select from "react-select";

interface SelectOption { value: string; label: string }
interface StudentTutorData {
  studentId: string;
  phoneNumber: string;
  preferredBackground: SelectOption[];
  preferredArea: SelectOption[];
  preferredSubject: SelectOption[];
  isTutorAvailable?: boolean;
  profileImage?: { data: number[] };
}

export default function Tution() {
  const auth = useAuthUser();
  const [student, setStudent] = useState<StudentTutorData>({
    studentId: "",
    phoneNumber: "",
    preferredBackground: [],
    preferredArea: [],
    preferredSubject: [],
  });
  const [isTutorAvailable, setIsTutorAvailable] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prevImage, setPrevImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrevImage(image);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const base64Image = await fileToBase64(file);
      setImageFile(file);
      setImage(base64Image as string);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student");
      const studentData = res?.data?.student;

      // Handle profile image
      if (studentData?.profileImage) {
        const imageUrl = URL.createObjectURL(
          new Blob([new Uint8Array(studentData.profileImage.data)], {
            type: "image/jpeg",
          })
        );
        setImage(imageUrl);
        setPrevImage(imageUrl);
      }

      setStudent({
        ...studentData,
        preferredBackground:
          studentData?.preferredBackground?.map((bg: string) => ({
            value: bg,
            label: bg,
          })) || [],
        preferredArea:
          studentData?.preferredArea?.map((area: string) => ({
            value: area,
            label: area,
          })) || [],
        preferredSubject:
          studentData?.preferredSubject?.map((subject: string) => ({
            value: subject,
            label: subject,
          })) || [],
      });
      setIsTutorAvailable(studentData?.isTutorAvailable);
    } catch {
      // silently handled
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // First request: Update regular data
      const regularDataRes = await Axios.put("/student", {
        studentId: student.studentId,
        phoneNumber: student.phoneNumber,
        preferredBackground: student.preferredBackground.map((bg) => bg.value),
        preferredArea: student.preferredArea.map((area) => area.value),
        preferredSubject: student.preferredSubject.map(
          (subject) => subject.value
        ),
        isTutorAvailable: isTutorAvailable,
      });

      // Second request: Update image if there's a new image
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("profileImage", imageFile);
        imageFormData.append("studentId", student.studentId);

        const imageRes = await Axios.put("/student", imageFormData);
        toast.success("Profile image updated successfully");
      }

      toast.success(regularDataRes.data.message);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Something went wrong");
    }
  };

  const backgrounds = [
    "English Medium",
    "English Version",
    "Bengali Medium",
    "Admission",
    "Cadet",
  ];

  const subjects = [
    "Math",
    "Physics",
    "Chemistry",
    "Biology",
    "ICT",
    "Bangla",
    "English",
  ];

  const areas = [
    "Adabor",
    "Agargaon",
    "Armanitola",
    "Ashkona",
    "Azimpur",
    "Badda",
    "Baily Road",
    "Bakshi Bazar",
    "Banani",
    "Banasree",
    "Bangabhaban",
    "Bangla Motor",
    "Bangshal",
    "Baridhara",
    "Bashabo",
    "Bashundhara R/A",
    "Begun Bari",
    "Bijoynagar",
    "Bimanbondor",
    "Cantonment",
    "Chackbazar",
    "College Gate",
    "Darussalam",
    "Daskhinkhan",
    "Demra",
    "Dhaka University Area",
    "Dhamrai",
    "Dhanmondi",
    "Dohar",
    "English Road",
    "Farmgate",
    "Fokirapul",
    "Gabtoli",
    "Gandaria",
    "Gopibagh",
    "Goran",
    "Green Road",
    "Gulistan",
    "Gulshan",
    "Hatirjheel",
    "Hazaribag",
    "Ibrahimpur",
    "Jatrabari",
    "Jurain",
    "Kadamtoli",
    "Kafrul",
    "Kakrail",
    "Kalabagan",
    "kamalapur",
    "Kamrangirchar",
    "Kathal Bagan",
    "Kawla",
    "Kawran Bazar",
    "Kazipara",
    "Keraniganj",
    "Khilgaon",
    "Khilkhet",
    "Kollanpur",
    "Kotwali",
    "Kuril",
    "Lalbag",
    "Malibagh",
    "Manda",
    "Maniknagar",
    "Matikata",
    "Mirpur",
    "Mirpur 1",
    "Mirpur 10",
    "Mirpur 11",
    "Mirpur 12",
    "Mirpur 13",
    "Mirpur 14",
    "Mirpur 2",
    "Mirpur 3",
    "Mirpur DOHS",
    "Mitford Road",
    "Mogbazar",
    "Mohakhali",
    "Mohammadpur",
    "Mollartek",
    "Motijheel",
    "Mouchak",
    "Mugda",
    "Nawabganj",
    "Naya Bazar",
    "Naya Paltan",
    "New Eskaton Road",
    "New Market",
    "Niketon",
    "Nikunja 1",
    "Nikunja 2",
    "Nobabgonj",
    "Norda",
    "Notun Bazar",
    "Pallabi",
    "Paltan",
    "Paribagh",
    "Pilkhana",
    "Pirerbag",
    "Postoghola",
    "Puran Dhaka",
    "Puran Paltan",
    "Rajarbagh",
    "Ramna",
    "Rampura",
    "Rayer Bazar",
    "Razarbagh",
    "Sabujbagh",
    "Sadarghat",
    "Saidabad",
    "Sankar",
    "Savar",
    "Segunbagicha",
    "Shahbag",
    "Shahinbag",
    "Shahjadpur",
    "Shajahanpur",
    "Shamoli",
    "Shantibag",
    "Shantinagar",
    "Sher-e-bangla Nagar",
    "Shewrapara",
    "Shyampur",
    "Sobahanbag",
    "Sonirakra",
    "Sukrabad",
    "Sutrapur",
    "Swamibagh",
    "Tejgaon",
    "Tikatuli",
    "Tongi",
    "Turag",
    "Uttara",
    "Uttarkhan",
    "Vasantek",
    "Wari",
    "West Rampura",
    "Zigatola",
  ];

  const backgroundOptions = backgrounds.map((bg) => ({ value: bg, label: bg }));
  const subjectOptions = subjects.map((subject) => ({
    value: subject,
    label: subject,
  }));
  const areaOptions = areas.map((area) => ({ value: area, label: area }));

  const customStyles = {
    control: (base: object) => ({
      ...base,
      minHeight: "42px",
      border: "1px solid #e2e8f0",
      borderRadius: "0.375rem",
    }),
    multiValue: (base: object) => ({
      ...base,
      backgroundColor: "#EBF4FF",
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (base: object) => ({
      ...base,
      color: "#2563EB",
      padding: "2px 8px",
    }),
    multiValueRemove: (base: object) => ({
      ...base,
      color: "#2563EB",
      ":hover": {
        backgroundColor: "#DBEAFE",
        color: "#1E40AF",
      },
    }),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-semibold">Tuition Preferences</h2>
      <hr className="my-3 border-gray-200" />

      <form onSubmit={handleSubmit}>
        {/* Profile Image and Tutor Status Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="md:w-1/4 w-full">
              <h3 className="text-lg font-medium mb-3">Profile Image</h3>
              <div className="relative">
                <div
                  className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={image ?? undefined}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  {/* Overlay with text */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm">Change Photo</span>
                  </div>
                </div>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Tutor Status */}
            <div className="md:w-3/4 w-full flex items-center">
              <div className="w-full bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tutoring Availability Status
                    </h3>
                    <p className="text-sm text-gray-600">
                      Are you available for tutoring and can take new students?
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTutorAvailable}
                      onChange={() => setIsTutorAvailable(!isTutorAvailable)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-4">Teaching Preferences</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full">
                  <label className="block text-sm font-medium leading-6 text-gray-600 mb-2">
                    Preferred Background
                  </label>
                  <Select
                    isMulti
                    options={backgroundOptions}
                    value={student.preferredBackground || []}
                    onChange={(selected) =>
                      setStudent({
                        ...student,
                        preferredBackground: [...(selected || [])],
                      })
                    }
                    styles={customStyles}
                    placeholder="Select backgrounds..."
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium leading-6 text-gray-600 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={student.phoneNumber}
                    onChange={(e) =>
                      setStudent({ ...student, phoneNumber: e.target.value })
                    }
                    className={`w-full rounded-lg border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6`}
                    placeholder="Enter phone number..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-600 mb-2">
                  Preferred Area
                </label>
                <Select
                  isMulti
                  options={areaOptions}
                  value={student.preferredArea || []}
                  onChange={(selected) =>
                    setStudent({ ...student, preferredArea: [...(selected || [])] })
                  }
                  styles={customStyles}
                  placeholder="Select areas..."
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-600 mb-2">
                  Preferred Subject
                </label>
                <Select
                  isMulti
                  options={subjectOptions}
                  value={student.preferredSubject || []}
                  onChange={(selected) =>
                    setStudent({ ...student, preferredSubject: [...(selected || [])] })
                  }
                  styles={customStyles}
                  placeholder="Select subjects..."
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className={`${fixedButtonClass} w-full md:w-auto`}
            >
              Update Preferences
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
