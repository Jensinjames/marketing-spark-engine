import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
interface PageHeaderProps {
  title: string;
  description?: string;
  showExport?: boolean;
  showDateFilter?: boolean;
  dateFilter?: string;
  onExport?: () => void;
  onDateFilterChange?: (filter: string) => void;
  children?: React.ReactNode;
}
const PageHeader = ({
  title,
  description,
  showExport = false,
  showDateFilter = false,
  dateFilter = "Last 30 days",
  onExport,
  onDateFilterChange,
  children
}: PageHeaderProps) => {
  return <div className="border-b border-gray-200 pb-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          {description && <p className="mt-2 text-white text-base font-extralight">{description}</p>}
        </div>
        
        <div className="flex items-center gap-3">
          {showDateFilter && <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select value={dateFilter} onChange={e => onDateFilterChange?.(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 border-none outline-none">
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Last 90 days">Last 90 days</option>
              </select>
            </div>}
          
          {showExport && <Button onClick={onExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>}
          
          {children}
        </div>
      </div>
    </div>;
};
export default PageHeader;