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
    ? 'text-error'
    : attendanceMargin === 0
      ? 'text-secondary'
      : 'text-success';
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
      "theme-card relative flex flex-col gap-4 p-5 md:p-6",
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
              <h3 className="font-headline text-xl font-bold lowercase leading-tight text-on-surface">{subject.name}</h3>
              <p className="mt-1 font-label text-[11px] tracking-[0.16em] text-on-surface-variant">{subject.attendance.attended} of {subject.attendance.total} sessions attended</p>
              <span
                className={cn('inline-flex mt-2 rounded-full border px-2.5 py-1 font-label text-[9px] font-bold tracking-[0.18em] uppercase', attendancePillClass)}
                style={
                  attPct < 75
                    ? {
                        borderColor: 'color-mix(in srgb, var(--error) 30%, transparent)',
                        background: 'color-mix(in srgb, var(--error) 14%, transparent)',
                      }
                    : attendanceMargin === 0
                      ? {
                          borderColor: 'color-mix(in srgb, var(--secondary) 26%, transparent)',
                          background: 'color-mix(in srgb, var(--secondary) 14%, transparent)',
                        }
                      : {
                          borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)',
                          background: 'color-mix(in srgb, var(--success) 14%, transparent)',
                        }
                }
              >
                {attendancePillLabel}
              </span>
            </div>
            <span className={cn("font-headline text-[2rem] font-bold tracking-tighter", colorClass)}>
              {attPct.toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={attPct} color={hexColor} showText={false} />
        </>
      ) : (
        // MARKS LAYOUT
        <>
          <div className="flex justify-between items-start">
            <h3 className="max-w-[62%] font-headline text-[1.7rem] font-bold lowercase leading-[0.95] text-on-surface">{subject.name}</h3>
            <div
              className="rounded-full px-3 py-1 font-label text-[9px] font-bold tracking-[0.18em] text-secondary"
              style={{
                background: 'color-mix(in srgb, var(--secondary) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--secondary) 24%, transparent)',
              }}
            >
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
                    'min-w-0 rounded-[16px] border px-2 py-2.5 text-center',
                    isPending
                      ? 'border-dashed bg-transparent'
                      : 'shadow-[var(--glow-primary)]',
                  )}
                  style={isPending ? { borderColor: 'var(--border)' } : {
                    borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                    background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                  }}
                >
                  <p className={cn('font-label text-[9px] font-bold tracking-[0.16em] uppercase', isPending ? 'text-on-surface-variant' : 'text-primary/70')}>{exam.exam}</p>
                  {isPending ? (
                    <p className="mt-2 font-headline text-[1.2rem] font-bold leading-none tracking-tighter text-on-surface-variant">TBA</p>
                  ) : (
                    <div className="mt-1.5 flex flex-col items-center">
                      <p className="font-headline text-[1.15rem] font-bold leading-none tracking-tighter text-primary">{exam.obtained?.toFixed(2)}</p>
                      <p className="mt-1 font-label text-[9px] font-bold tracking-[0.14em] text-primary/70">/ {exam.maxMark?.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <ProgressBar value={marksPct} color={hexColor} />
          <div className="mt-1 text-right">
            <span className="inline-block font-headline text-[3.2rem] font-bold leading-none tracking-tighter text-on-surface">{subject.marks.internal.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
