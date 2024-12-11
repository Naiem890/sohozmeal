import React, { useState, useEffect } from "react";
import { Axios } from "../../api/api";
import { toast } from "react-hot-toast";

export default function Notice() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const toastId = toast.loading("Loading notices...");
    try {
      const res = await Axios.get("/notice");
      setNotices(res.data);
      toast.success("Notices loaded", { id: toastId });
    } catch (error) {
      toast.error("Error loading notices", { id: toastId });
    }
  };

  const getNoticeTypeColor = (type) => {
    switch (type) {
      case "MALE":
        return "bg-blue-100 text-blue-800";
      case "FEMALE":
        return "bg-pink-100 text-pink-800";
      case "ALL":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Notice Board</h1>

      {/* Notices Grid */}
      <div className="flex flex-col gap-1.5 max-w-3xl mx-auto">
        {notices.map((notice) => (
          <div
            key={notice._id}
            className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 shadow-sm transition-all duration-200"
          >
            <div className="p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 bg-blue-50 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{notice.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-1">{notice.description}</p>
                </div>
              </div>
              
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getNoticeTypeColor(
                  notice.noticeFor
                )}`}
              >
                {notice.noticeFor}
              </span>
            </div>
          </div>
        ))}
      </div>

      {notices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            No Notices Yet
          </h3>
          <p className="text-gray-400">
            Stay tuned for updates!
          </p>
        </div>
      )}
    </div>
  );
}
