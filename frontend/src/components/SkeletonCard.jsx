import React from "react";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 animate-pulse">
    <div className="bg-gray-300 dark:bg-gray-700 rounded-xl mb-3 w-full h-48"></div>
    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded mb-3 w-1/3"></div>
    <div className="bg-gray-300 dark:bg-gray-700 h-10 rounded w-1/2 mx-auto"></div>
  </div>
);

export default SkeletonCard;
