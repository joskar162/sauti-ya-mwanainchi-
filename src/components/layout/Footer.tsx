export const Footer = () => (
  <footer className="bg-white border-t border-gray-200 mt-auto">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p className="text-center sm:text-left">
          Compiled from public news, government and audit reports. Not verified against official project records.
        </p>
        <p className="text-center sm:text-right">
          Member project submissions are unverified until reviewed by oversight.
        </p>
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">
        Illustrative sample data only. Build Kenya &copy; {new Date().getFullYear()}
      </p>
    </div>
  </footer>
);