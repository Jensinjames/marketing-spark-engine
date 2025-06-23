
import PageHeader from "@/components/shared/PageHeader";

const AnalyticsHeader = () => {
  const handleExport = () => {
    console.log("Exporting analytics data...");
  };

  const handleDateFilterChange = (filter: string) => {
    console.log("Date filter changed:", filter);
  };

  return (
    <PageHeader
      title="Analytics"
      description="Track your content performance and usage"
      showExport={true}
      showDateFilter={true}
      onExport={handleExport}
      onDateFilterChange={handleDateFilterChange}
    />
  );
};

export default AnalyticsHeader;
