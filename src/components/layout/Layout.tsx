import Sidebar from "./Sidebar";
interface LayoutProps {
  children: React.ReactNode;
}
const Layout = ({
  children
}: LayoutProps) => {
  return <div className="min-h-screen flex bg-inherit py-0 px-[13px] my-0 rounded-full">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <main className="p-6 lg:p-8 my-0 mx-0 px-[32px] rounded-md py-[193px]">
          {children}
        </main>
      </div>
    </div>;
};
export default Layout;