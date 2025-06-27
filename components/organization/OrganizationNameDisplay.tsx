"use client";
import React from "react";

interface OrganizationNameDisplayProps {
  organizationName: string;
}

export const OrganizationNameDisplay: React.FC<OrganizationNameDisplayProps> = ({
  organizationName,
}) => {
  if (!organizationName) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          {/* ビルディングアイコン */}
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V5a2 2 0 012-2h2a2 2 0 012 2v16m8 0V5a2 2 0 012-2h2a2 2 0 012 2v16M9 21h6" />
          </svg>
          <h1 className="text-xl font-bold text-gray-800">
            {organizationName}
          </h1>
        </div>
      </div>
    </div>
  );
}; 