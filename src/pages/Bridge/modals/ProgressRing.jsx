import React from 'react';

export const ProgressRing = ({ radius, stroke, progress, totalProgress }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (progress / totalProgress) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#b8b9bb"
        fill="transparent"
        strokeWidth={stroke}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#03a9f4"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};
