export default function AppNavbar() {
  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 bg-white border-b shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-end gap-4">
        {/* Thêm các nút hoặc thông tin user ở đây */}
        <button className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition">Profile</button>
        <button className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition">Logout</button>
      </div>
    </nav>
  );
}