'use client';

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateSelectProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  defaultYear?: number;
}

export function DateSelect({ value, onChange, defaultYear = 1997 }: DateSelectProps) {
  const [year, setYear] = useState<string>(
    value ? value.getFullYear().toString() : defaultYear.toString()
  );
  const [month, setMonth] = useState<string>(
    value ? (value.getMonth() + 1).toString().padStart(2, '0') : ""
  );
  const [day, setDay] = useState<string>(
    value ? value.getDate().toString().padStart(2, '0') : ""
  );

  useEffect(() => {
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);

    if (
      !isNaN(yearNum) &&
      !isNaN(monthNum) &&
      !isNaN(dayNum) &&
      yearNum >= 1900 &&
      yearNum <= new Date().getFullYear() &&
      monthNum >= 1 &&
      monthNum <= 12 &&
      dayNum >= 1 &&
      dayNum <= new Date(yearNum, monthNum, 0).getDate()
    ) {
      onChange(new Date(yearNum, monthNum - 1, dayNum));
    } else {
      onChange(undefined);
    }
  }, [year, month, day]);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d{0,4}$/.test(value) && parseInt(value) <= new Date().getFullYear())) {
      setYear(value);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d{0,2}$/.test(value) && parseInt(value) <= 12)) {
      setMonth(value);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maxDays = new Date(parseInt(year), parseInt(month), 0).getDate();
    if (value === "" || (/^\d{0,2}$/.test(value) && parseInt(value) <= maxDays)) {
      setDay(value);
    }
  };

  return (
    <div className="flex w-full items-start gap-2">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="year" className="text-xs">年</Label>
        <Input
          id="year"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="1997"
          value={year}
          onChange={handleYearChange}
          className="w-full"
          maxLength={4}
        />
      </div>
      <div className="w-20 space-y-1.5">
        <Label htmlFor="month" className="text-xs">月</Label>
        <Input
          id="month"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="01"
          value={month}
          onChange={handleMonthChange}
          className="w-full"
          maxLength={2}
        />
      </div>
      <div className="w-20 space-y-1.5">
        <Label htmlFor="day" className="text-xs">日</Label>
        <Input
          id="day"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="01"
          value={day}
          onChange={handleDayChange}
          className="w-full"
          maxLength={2}
        />
      </div>
    </div>
  );
} 