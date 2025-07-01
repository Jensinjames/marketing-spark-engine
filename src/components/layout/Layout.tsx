import Sidebar from "./Sidebar";
interface LayoutProps {
  children: React.ReactNode;
}
const Layout = ({
  children
}: LayoutProps) => {
  return <div className="min-h-screen flex bg-inherit">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <main className="p-6 lg:p-8 my-0 mx-0 py-[31px] px-[32px] rounded-md">
          {children}
        </main>
      </div>
    </div>;
};
export default Layout;