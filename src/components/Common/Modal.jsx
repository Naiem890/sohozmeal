import { XCircleIcon } from "@heroicons/react/24/outline";
import React from "react";

export default function Modal({ children, setShowModal, className, idName }) {
  return (
    <dialog id={idName} className={`modal opacity-100 modal-open ${className}`}>
      <div className="modal-box max-w-2xl">
        {/* <button
          onClick={() => setShowModal((prev) => !prev)}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <XCircleIcon className="w-8 h-8 text-red-700 hover:bg-red-700 hover:text-white rounded-full transition-all" />
        </button> */}
        {children}
      </div>
    </dialog>
  );
}
