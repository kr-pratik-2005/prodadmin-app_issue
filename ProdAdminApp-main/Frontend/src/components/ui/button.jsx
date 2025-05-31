
import React from "react";

export function Button({ children, className = "", variant = "default", size = "default", ...props }) {
  const baseStyle = "rounded-md font-medium transition";
  const variantStyle = variant === "outline"
    ? "border border-gray-300 text-gray-700 bg-white"
    : "bg-blue-600 text-white";
  const sizeStyle = size === "icon" ? "p-2" : "px-4 py-2";

  return (
    <button className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}