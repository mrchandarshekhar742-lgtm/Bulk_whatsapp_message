import { MdMenu } from 'react-icons/md';

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-3 left-3 lg:hidden z-40 p-2.5 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-all duration-200 border border-primary-500"
      aria-label="Open menu"
    >
      <MdMenu className="text-lg" />
    </button>
  );
}