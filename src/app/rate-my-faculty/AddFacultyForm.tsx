'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AddFacultyFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddFacultyForm({ onSuccess, onClose }: AddFacultyFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [addError, setAddError] = useState('');
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    designation: '',
    department: '',
  });

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name.trim()) return;

    setIsCreating(true);
    setAddError('');

    try {
      const res = await fetch('/api/rmf/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaculty),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewFaculty({ name: '', designation: '', department: '' });
      onSuccess();
      onClose();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden mb-8"
    >
      <div className="bg-[var(--surface-elevated)] border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-black font-[var(--font-headline)] uppercase tracking-tight">Add a Faculty Member</h3>
          <p className="text-xs text-on-surface-variant font-medium mt-1">Adding to SRMIST Kattankulathur. Please be accurate.</p>
        </div>

        {addError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-semibold">
            {addError}
          </div>
        )}

        <form onSubmit={handleAddFaculty} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">Full Name *</label>
            <input
              type="text" required
              placeholder="Dr. John Smith"
              value={newFaculty.name}
              onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
              className="w-full bg-[var(--surface-highlight)]/20 border border-white/10 rounded-2xl p-4 text-sm focus:border-[var(--primary)] focus:ring-1 ring-[var(--primary)]/50 outline-none transition-all text-[var(--text)] font-medium placeholder:text-on-surface-variant/40"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">Designation</label>
              <input
                type="text"
                placeholder="Associate Professor"
                value={newFaculty.designation}
                onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                className="w-full bg-[var(--surface-highlight)]/20 border border-white/10 rounded-2xl p-4 text-sm focus:border-[var(--primary)] focus:ring-1 ring-[var(--primary)]/50 outline-none transition-all text-[var(--text)] font-medium placeholder:text-on-surface-variant/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">Department</label>
              <input
                type="text"
                placeholder="Computer Science"
                value={newFaculty.department}
                onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                className="w-full bg-[var(--surface-highlight)]/20 border border-white/10 rounded-2xl p-4 text-sm focus:border-[var(--primary)] focus:ring-1 ring-[var(--primary)]/50 outline-none transition-all text-[var(--text)] font-medium placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-4 rounded-2xl bg-[var(--primary)] text-[#1a1a1a] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
          >
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'ADD FACULTY MEMBER'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
