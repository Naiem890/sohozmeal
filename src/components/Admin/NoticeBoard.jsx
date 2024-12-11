import React, { useState, useEffect } from "react";
import { Axios } from "../../api/api";
import toast from "react-hot-toast";
import { useAuthUser } from "react-auth-kit";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function NoticeBoard() {
  const auth = useAuthUser()();
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(
      isEditing ? "Updating notice..." : "Creating notice..."
    );

    try {
      if (isEditing) {
        await Axios.put(`/notice/${editingId}`, formData);
        toast.success("Notice updated successfully", { id: toastId });
      } else {
        await Axios.post("/notice", formData);
        toast.success("Notice created successfully", { id: toastId });
      }

      setFormData({
        title: "",
        description: "",
        noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing,
      });
      setIsEditing(false);
      setEditingId(null);
      setShowForm(false);
      fetchNotices();
    } catch (error) {
      toast.error("Error occurred", { id: toastId });
    }
  };

  const handleEdit = (notice) => {
    setFormData({
      title: notice.title,
      description: notice.description,
      noticeFor: notice.noticeFor,
    });
    setIsEditing(true);
    setEditingId(notice._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const toastId = toast.loading("Deleting notice...");
    try {
      await Axios.delete(`/notice/${id}`);
      toast.success("Notice deleted successfully", { id: toastId });
      fetchNotices();
    } catch (error) {
      toast.error("Error deleting notice", { id: toastId });
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setIsEditing(false);
              setFormData({
                title: "",
                description: "",
                noticeFor: auth.wing === "ALL" ? "MALE" : auth.wing,
              });
            }
          }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {showForm ? (
            <>
              <XMarkIcon className="h-5 w-5" />
              Close Form
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              New Notice
            </>
          )}
        </button>
      </div>

      {/* Collapsible Form */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showForm ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Notice Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  required
                />
              </div>
              {auth.wing === "ALL" && (
                <select
                  value={formData.noticeFor}
                  onChange={(e) =>
                    setFormData({ ...formData, noticeFor: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                >
                  <option value="MALE">Male Wing</option>
                  <option value="FEMALE">Female Wing</option>
                  <option value="ALL">All Wings</option>
                </select>
              )}
            </div>
            <textarea
              placeholder="Notice Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              rows="3"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isEditing ? "Update Notice" : "Post Notice"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="flex flex-col gap-1.5 max-w-3xl mx-auto">
        {notices.map((notice) => (
          <div
            key={notice._id}
            className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow transition-all duration-200"
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
              
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getNoticeTypeColor(
                    notice.noticeFor
                  )}`}
                >
                  {notice.noticeFor}
                </span>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(notice)}
                    className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                    title="Edit Notice"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(notice._id)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors duration-200"
                    title="Delete Notice"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
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
            Create your first notice to get started
          </p>
        </div>
      )}
    </div>
  );
}
