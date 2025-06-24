
import { useState } from "react";

const CategoryFilters = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = [
    "All",
    "Email Marketing", 
    "Automation",
    "Database",
    "Website"
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === filter
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilters;
