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
  const examBoxes = [...subject.marks.exams]
    .sort((a, b) => {
      if (a.obtained === null && b.obtained !== null) return 1;
      if (a.obtained !== null && b.obtained === null) return -1;
      return 0;
    })
    .slice(0, 3);

  while (examBoxes.length < 3) {
    examBoxes.push({
      exam: 'TBA',
      obtained: null,
      maxMark: null,
    });
  }
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
          <div className="grid grid-cols-3 gap-3">
            {examBoxes.map((exam, index) => {
              const isPending = exam.obtained === null || exam.maxMark === null;
              return (
                <div
                  key={`${exam.exam}-${index}`}
                  className={cn(
                    'min-w-0 rounded-[18px] border px-2 py-3 text-center',
                    isPending
                      ? 'border-dashed border-white/14 bg-transparent'
                      : 'border-primary/30 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_22px_rgba(182,255,0,0.08)]',
                  )}
                >
                  <p className={cn('font-label text-[10px] font-bold tracking-widest uppercase', isPending ? 'text-[#6f6f6f]' : 'text-primary/70')}>{exam.exam}</p>
                  {isPending ? (
                    <p className="mt-3 font-headline text-[1.5rem] font-bold leading-none tracking-tighter text-[#6f6f6f]">TBA</p>
                  ) : (
                    <div className="mt-2 flex flex-col items-center">
                      <p className="font-headline text-[1.4rem] font-bold leading-none tracking-tighter text-primary">{exam.obtained?.toFixed(2)}</p>
                      <p className="mt-1 font-label text-[10px] font-bold tracking-widest text-primary/70">/ {exam.maxMark?.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <ProgressBar value={marksPct} color={hexColor} />
          <div className="text-right mt-2">
            <span className="font-headline text-6xl font-bold tracking-tighter text-white inline-block">{subject.marks.internal.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
