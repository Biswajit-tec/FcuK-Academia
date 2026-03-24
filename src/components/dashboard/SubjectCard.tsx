'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import ProgressBar from '../ui/ProgressBar';
import { Subject } from '@/lib/types';

interface SubjectCardProps {
  subject: Subject;
  type: 'attendance' | 'marks';
}

export default function SubjectCard({ subject, type }: SubjectCardProps) {
  const isAttendance = type === 'attendance';
  const attPct = subject.attendance.percentage;
  const marksPct = subject.marks.totalInternal > 0
    ? (subject.marks.internal / subject.marks.totalInternal) * 100
    : 0;
  const attendanceMargin = Math.floor((subject.attendance.attended / 0.75) - subject.attendance.total);
  const attendanceRequired = Math.ceil((0.75 * subject.attendance.total - subject.attendance.attended) / 0.25);
  const attendancePillClass = attPct < 75
    ? 'bg-[#3b1513] text-[#ff7d72] border border-[#6c2520]'
    : attendanceMargin === 0
      ? 'bg-[#1b2636] text-[#7fc4ff] border border-[#295377]'
      : 'bg-[#112616] text-[#8df2a3] border border-[#1f5b2b]';
  const attendancePillLabel = attPct < 75
    ? `required: ${Math.max(0, attendanceRequired)}`
    : `margin: ${Math.max(0, attendanceMargin)}`;

  // Derive glow colors from images
  let colorClass = 'text-primary';
  let glowColor: 'primary' | 'secondary' | 'error' = 'primary';
  let hexColor = 'var(--primary)';

  if (isAttendance) {
    if (attPct < 75) { glowColor = 'error'; colorClass = 'text-error'; hexColor = 'var(--error)'; }
    else if (attPct > 90) { glowColor = 'secondary'; colorClass = 'text-secondary'; hexColor = 'var(--secondary)'; }
  } else {
    if (marksPct > 90) { glowColor = 'secondary'; hexColor = 'var(--secondary)'; colorClass = 'text-secondary'; }
  }

  return (
    <div className={cn(
      "relative rounded-[28px] overflow-hidden bg-[#121212] border border-[#2a2a2a] p-7 md:p-8 flex flex-col gap-6",
      `shadow-[0_0_20px_rgba(0,0,0,0.5)]`
    )}>
      {/* Glow Left Edge Indicator */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", 
        glowColor === 'primary' ? 'bg-primary shadow-[0_0_15px_var(--primary)]' :
        glowColor === 'secondary' ? 'bg-secondary shadow-[0_0_15px_var(--secondary)]' :
        'bg-error shadow-[0_0_15px_var(--error)]'
      )} />

      {isAttendance ? (
        // ATTENDANCE LAYOUT
        <>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-headline text-2xl font-bold lowercase text-white">{subject.name}</h3>
              <p className="font-label text-xs tracking-widest text-[#adaaaa] mt-1">{subject.attendance.attended} of {subject.attendance.total} sessions attended</p>
              <span className={cn('inline-flex mt-3 rounded-full px-3 py-1 font-label text-[10px] font-bold tracking-widest uppercase', attendancePillClass)}>
                {attendancePillLabel}
              </span>
            </div>
            <span className={cn("font-headline text-3xl font-bold tracking-tighter", colorClass)}>
              {attPct.toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={attPct} color={hexColor} showText={false} />
        </>
      ) : (
        // MARKS LAYOUT
        <>
          <div className="flex justify-between items-start">
            <h3 className="font-headline text-3xl font-bold lowercase text-white max-w-[60%] leading-tight">{subject.name}</h3>
            <div className="bg-[#003A43]/40 border border-[#00E0FF]/20 px-4 py-1.5 rounded-full text-[#00E0FF] font-label text-[10px] font-bold tracking-widest">
              {subject.credits} CREDITS
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-primary rounded-[2px]" />
              <div className="w-3 h-3 bg-primary rounded-[2px]" />
              <div className="w-3 h-3 bg-primary rounded-[2px]" />
            </div>
            <span className="font-label text-xs tracking-widest text-[#adaaaa] uppercase">INTERNALS: {subject.marks.internal}/{subject.marks.totalInternal}</span>
          </div>
          <ProgressBar value={marksPct} color={hexColor} />
          <div className="text-right mt-2">
            <span className="font-headline text-6xl font-bold tracking-tighter text-white inline-block">{subject.marks.internal.toFixed(1)}</span>
          </div>
        </>
      )}
    </div>
  );
}
