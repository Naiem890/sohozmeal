import React, { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-hot-toast";
import { Axios } from "../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";
import Select from "react-select";

export default function Tution() {
  const auth = useAuthUser();
  const [student, setStudent] = useState({
    preferredBackground: [],
    preferredArea: [],
    preferredSubject: [],
  });
  const [isTutor, setIsTutor] = useState(false);
  const [isTutorAvailable, setIsTutorAvailable] = useState(false);

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student");
      // Convert string arrays to react-select format
      const studentData = res?.data?.student;
      setStudent({
        ...studentData,
        preferredBackground:
          studentData?.preferredBackground?.map((bg) => ({
            value: bg,
            label: bg,
          })) || [],
        preferredArea:
          studentData?.preferredArea?.map((area) => ({
            value: area,
            label: area,
          })) || [],
        preferredSubject:
          studentData?.preferredSubject?.map((subject) => ({
            value: subject,
            label: subject,
          })) || [],
      });
      setIsTutor(studentData?.isTutor);
      setIsTutorAvailable(studentData?.isTutorAvailable);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await Axios.put("/student", {
        studentId: student.studentId,
        preferredBackground: (student.preferredBackground || []).map(
          (bg) => bg.value
        ),
        preferredArea: (student.preferredArea || []).map((area) => area.value),
        preferredSubject: (student.preferredSubject || []).map(
          (subject) => subject.value
        ),
        isTutor: isTutor,
        isTutorAvailable: isTutorAvailable,
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
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

  // Convert arrays to options format for react-select
  const backgroundOptions = backgrounds.map((bg) => ({ value: bg, label: bg }));
  const subjectOptions = subjects.map((subject) => ({
    value: subject,
    label: subject,
  }));
  const areaOptions = areas.map((area) => ({ value: area, label: area }));

  // Custom styles for react-select
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "42px",
      border: "1px solid #e2e8f0",
      borderRadius: "0.375rem",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#EBF4FF",
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#2563EB",
      padding: "2px 8px",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#2563EB",
      ":hover": {
        backgroundColor: "#DBEAFE",
        color: "#1E40AF",
      },
    }),
  };

  return (
    <div className="mb-10 lg:my-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Tuition Preferences</h2>
      <div className="divider"></div>

      <form onSubmit={handleSubmit}>
        {/* Tutor Status Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Tutor Status</h3>
                <p className="text-sm text-gray-500">
                  Are you available for tutoring?
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTutor}
                  onChange={() => setIsTutor(!isTutor)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Availability</h3>
                <p className="text-sm text-gray-500">
                  Can you take new students?
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

        {/* Preferences Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-4">Teaching Preferences</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Area
                </label>
                <Select
                  isMulti
                  options={areaOptions}
                  value={student.preferredArea || []}
                  onChange={(selected) =>
                    setStudent({ ...student, preferredArea: selected || [] })
                  }
                  styles={customStyles}
                  placeholder="Select areas..."
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Subject
                </label>
                <Select
                  isMulti
                  options={subjectOptions}
                  value={student.preferredSubject || []}
                  onChange={(selected) =>
                    setStudent({ ...student, preferredSubject: selected || [] })
                  }
                  styles={customStyles}
                  placeholder="Select subjects..."
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Background
              </label>
              <Select
                isMulti
                options={backgroundOptions}
                value={student.preferredBackground || []}
                onChange={(selected) =>
                  setStudent({
                    ...student,
                    preferredBackground: selected || [],
                  })
                }
                styles={customStyles}
                placeholder="Select backgrounds..."
                className="basic-multi-select"
                classNamePrefix="select"
              />
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
