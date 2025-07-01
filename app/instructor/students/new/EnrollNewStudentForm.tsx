'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, ExclamationCircleIcon, UserPlusIcon, UserIcon, BookOpenIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function EnrollNewStudentForm({ syllabi, students, instructor }: { syllabi: any[], students: any[], instructor: any }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Student search/add state
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [syllabusId, setSyllabusId] = useState("");
  const [phone, setPhone] = useState("");

  // Only show this instructor's students for existing
  // const instructorStudents = students.filter((s) => s.instructor_id === instructor.id);
  const filteredStudents = students.filter((s) => {
    const q = studentQuery.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const canContinueStep1 = (mode === 'existing' && selectedStudent) || (mode === 'new' && email && firstName && lastName && phone);
  const canContinueStep2 = syllabusId;

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      let payload;
      if (mode === 'new') {
        payload = {
          email,
          firstName,
          lastName,
          phone,
          syllabusId,
          instructorId: instructor.id,
        };
      } else {
        payload = {
          email: selectedStudent.email,
          firstName: selectedStudent.first_name,
          lastName: selectedStudent.last_name,
          phone: selectedStudent.phone,
          syllabusId,
          instructorId: instructor.id,
        };
      }
      const res = await fetch("/instructor/students/new/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to enroll student");
      }
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl mt-12 border border-blue-100">
      <h1 className="text-4xl font-extrabold mb-2 text-center flex items-center justify-center gap-2 text-blue-900">
        <UserPlusIcon className="h-9 w-9 text-blue-600" /> Enroll Student
      </h1>
      <p className="text-center text-blue-700 mb-10 text-lg">Enroll a student in a syllabus. Search, add, and confirm in just a few steps.</p>
      <Stepper step={step} />
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={mode === 'existing' ? 'default' : 'outline'}
          className={mode === 'existing'
            ? 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105 hover:text-white hover:bg-blue-700'
            : 'bg-white text-blue-700 border-blue-200 hover:text-blue-700 hover:bg-blue-100'}
          onClick={() => setMode('existing')}
        >
          {mode === 'existing' && <CheckCircleIcon className="h-5 w-5 mr-2 text-white inline" />} Enroll Existing Student
        </Button>
        <Button
          variant={mode === 'new' ? 'default' : 'outline'}
          className={mode === 'new'
            ? 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105 hover:text-white hover:bg-blue-700'
            : 'bg-white text-blue-700 border-blue-200 hover:text-blue-700 hover:bg-blue-100'}
          onClick={() => setMode('new')}
        >
          {mode === 'new' && <CheckCircleIcon className="h-5 w-5 mr-2 text-white inline" />} Enroll New Student
        </Button>
      </div>
      <div className="mt-10">
        {step === 1 && mode === 'existing' && (
          <div className="bg-white rounded-xl shadow p-6 border border-blue-100 flex flex-col gap-4">
            <label className="block font-semibold text-lg mb-1 text-blue-900">Select Existing Student</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-blue-300" />
              <input
                type="text"
                className="w-full border border-blue-200 rounded-lg pl-10 pr-8 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition text-blue-900 bg-blue-50"
                placeholder="Search by name or email..."
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  setSelectedStudent(null);
                }}
                autoFocus
              />
              <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-blue-300 pointer-events-none" />
            </div>
            <div className="relative mt-2">
              <div className="max-h-48 overflow-y-auto rounded-lg border border-blue-100 bg-white shadow-sm">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-50 transition ${selectedStudent?.id === s.id ? "bg-blue-100" : ""}`}
                      onClick={() => setSelectedStudent(s)}
                    >
                      <UserIcon className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-900">{s.first_name} {s.last_name}</span>
                      <span className="text-xs text-blue-400">({s.email})</span>
                      {selectedStudent?.id === s.id && <CheckCircleIcon className="h-5 w-5 text-green-500 ml-auto" />}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-blue-400 text-sm">No students found.</div>
                )}
              </div>
            </div>
          </div>
        )}
        {step === 1 && mode === 'new' && (
          <div className="bg-white rounded-xl shadow p-6 border border-blue-100 flex flex-col gap-4">
            <div className="mb-2">
              <label className="block font-medium mb-1 text-blue-800">First Name <span className="text-red-500">*</span></label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-blue-50 text-blue-900"
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium mb-1 text-blue-800">Last Name <span className="text-red-500">*</span></label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
                className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-blue-50 text-blue-900"
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium mb-1 text-blue-800">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                required
                className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-blue-50 text-blue-900"
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium mb-1 text-blue-800">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@email.com"
                required
                className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-blue-50 text-blue-900"
              />
            </div>
          </div>
        )}
        {/* Step navigation */}
        {step === 1 && (
          <div className="flex justify-end mt-10 gap-4">
            <Button
              size="lg"
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setStep(2)}
              disabled={!canContinueStep1}
            >
              Next
            </Button>
          </div>
        )}
        {step === 2 && (
          <form className="max-w-lg mx-auto bg-white rounded-xl shadow p-8 border border-blue-100">
            <label className="block font-semibold mb-2 text-lg text-blue-900">Select Syllabus</label>
            <select
              className="w-full border border-blue-200 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-400 outline-none transition text-blue-900 bg-blue-50"
              value={syllabusId}
              onChange={(e) => setSyllabusId(e.target.value)}
            >
              <option value="">Select a syllabus...</option>
              {syllabi.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            <div className="flex justify-between mt-8">
              <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg">
                Back
              </Button>
              <Button type="button" size="lg" className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setStep(3)} disabled={!canContinueStep2}>
                Next
              </Button>
            </div>
          </form>
        )}
        {step === 3 && (
          <div className="max-w-lg mx-auto animate-fade-in bg-white rounded-xl shadow p-8 border border-blue-100">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-900"><BookOpenIcon className="h-6 w-6 text-blue-600" /> Confirm Details</h2>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-4 shadow-sm">
              <ul className="space-y-2 text-blue-900">
                <li><b>Email:</b> {mode === 'new' ? email : selectedStudent?.email}</li>
                <li><b>Name:</b> {mode === 'new' ? `${firstName} ${lastName}` : `${selectedStudent?.first_name} ${selectedStudent?.last_name}`}</li>
                <li><b>Syllabus:</b> {syllabi.find(s => s.id === syllabusId)?.title || syllabusId}</li>
                <li><b>Instructor:</b> {instructor.first_name} {instructor.last_name} ({instructor.email})</li>
              </ul>
            </div>
            {error && <div className="flex items-center gap-2 text-red-600 mb-2"><ExclamationCircleIcon className="h-5 w-5" /> {error}</div>}
            {success && <div className="flex items-center gap-2 text-green-600 mb-2"><CheckCircleIcon className="h-5 w-5" /> Student enrolled successfully!</div>}
            <div className="flex justify-between mt-8">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={loading} size="lg">
                Back
              </Button>
              <Button type="button" size="lg" className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEnroll} disabled={loading || success}>
                {loading ? "Enrolling..." : "Confirm & Enroll"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = [
    { label: "Student", icon: UserIcon },
    { label: "Syllabus", icon: BookOpenIcon },
    { label: "Confirm", icon: CheckCircleIcon },
  ];
  return (
    <div className="flex items-center justify-center gap-4 mb-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <s.icon className={`h-6 w-6 ${step === i + 1 ? "text-blue-600" : "text-blue-300"}`} />
          <span className={`font-semibold ${step === i + 1 ? "text-blue-900" : "text-blue-400"}`}>{s.label}</span>
          {i < steps.length - 1 && <span className="w-8 h-1 bg-blue-200 rounded-full" />}
        </div>
      ))}
    </div>
  );
} 