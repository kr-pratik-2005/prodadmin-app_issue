
import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase"; // corrected path to firebase
import { Input } from "../components/ui/input"; // corrected UI import path
import { Button } from "../components/ui/button"; // corrected UI import path
import { Search, Bell } from "lucide-react";

const rowColors = ["bg-red-100", "bg-yellow-100", "bg-green-100"];

export default function AttendanceDashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function fetchStudents() {
      const querySnapshot = await getDocs(collection(db, "students"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    }
    fetchStudents();
  }, []);

  const handlePresent = (id) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendance(prev => ({
      ...prev,
      [id]: { ...prev[id], present: true, absent: false, inTime: now }
    }));
  };

  const handleAbsent = (id) => {
    setAttendance(prev => ({
      ...prev,
      [id]: { ...prev[id], present: false, absent: true, inTime: "", outTime: "" }
    }));
  };

  const handleOutTimeChange = (id, value) => {
    setAttendance(prev => ({
      ...prev,
      [id]: { ...prev[id], outTime: value }
    }));
  };

  const handleSave = async (id) => {
    const data = attendance[id];
    if (!data) return;
    await setDoc(doc(db, "attendance", today + "_" + id), {
      studentId: id,
      ...data,
      date: today
    });
    alert("Saved for " + id);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Top Nav */}
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-sm">
        <div className="flex items-center gap-8">
          <img src="https://raw.githubusercontent.com/MimansaDeveloper/ProdAdminApp/main/Frontend/src/assets/Logo.png" alt="logo" className="h-8" />
          <nav className="flex gap-6 font-medium text-gray-700">
            <a href="#" className="text-purple-600">Home</a>
            <a href="#">Daily Report</a>
            <a href="#">Report</a>
            <a href="#">Child Data</a>
            <a href="#">Theme</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input className="pl-8" placeholder="Search" />
          </div>
          <Button variant="outline" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Welcome & Cards */}
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-semibold">Welcome <span className="font-bold">Hema</span>,</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white border border-blue-400 rounded-2xl p-4 shadow-md">
            <div className="text-blue-600 font-semibold">Today Attendance</div>
            <div className="text-gray-500 text-sm">{today}</div>
            <div className="mt-2 text-xl font-bold text-blue-800">10/12 Done</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div className="bg-lime-400 h-3 rounded-full w-[83%]"></div>
            </div>
          </div>

          <div className="rounded-2xl p-4 text-white shadow-md bg-lime-400">
            <div className="text-2xl font-bold">5</div>
            <div>20% of the class</div>
            <div className="text-sm">Grade: Playgroup</div>
          </div>

          <div className="rounded-2xl p-4 text-white shadow-md bg-yellow-400">
            <div className="text-2xl font-bold">20</div>
            <div>50% of the class</div>
            <div className="text-sm">Grade: Nursery</div>
          </div>

          <div className="rounded-2xl p-4 text-white shadow-md bg-red-300">
            <div className="text-2xl font-bold">7</div>
            <div>30% of the class</div>
            <div className="text-sm">Grade: Pre primary 1</div>
          </div>
        </div>
      </div>

      {/* Student Record */}
      <section className="mt-10 px-6">
        <h2 className="text-lg font-semibold mb-4">Student Record:</h2>
        <div className="grid grid-cols-6 bg-gray-100 font-bold p-2 rounded-t text-sm">
          <div>Full Name</div>
          <div>Attendance</div>
          <div>In - time</div>
          <div>Out - time</div>
          <div>Present</div>
          <div>Absent</div>
        </div>

        {students.map((student, i) => {
          const status = attendance[student.id] || {};
          const bgColor = rowColors[i % rowColors.length];

          return (
            <div
              key={student.id}
              className={"grid grid-cols-6 items-center p-2 mb-2 rounded-xl " + bgColor}
            >
              <div className="flex items-center gap-2">
                <img src={student.image} alt="avatar" className="w-8 h-8 rounded-full" />
                <span className="font-medium">{student.name}</span>
              </div>
              <div>1/30</div>
              <div>{status.inTime || "—"}</div>
              <Input
                className="text-sm max-w-[100px]"
                value={status.outTime || ""}
                onChange={(e) => handleOutTimeChange(student.id, e.target.value)}
                disabled={status.absent}
              />
              <div className="text-lg">
                {status.present ? "✅" : (
                  <button onClick={() => handlePresent(student.id)}>✔</button>
                )}
              </div>
              <div className="text-lg">
                {status.absent ? "🟥" : (
                  <button onClick={() => handleAbsent(student.id)}>⬛</button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}