import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdChevronRight, MdChevronLeft, MdDownload, MdSearch } from 'react-icons/md';

export function DataTable({ columns, data, onRowClick, title, subtitle, emptyMessage }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 10;

  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  const exportCSV = () => {
    const csv = [
      columns.map((c) => c.label).join(','),
      ...filteredData.map((row) =>
        columns.map((c) => `"${row[c.key] || ''}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'export'}.csv`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-secondary-200 bg-gradient-to-r from-secondary-50 to-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-secondary-900">{title}</h2>
            {subtitle && <p className="text-sm text-secondary-600 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={exportCSV}
            className="btn-secondary gap-2 whitespace-nowrap"
          >
            <MdDownload className="text-lg" /> Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-secondary-200">
        <div className="relative">
          <MdSearch className="absolute left-3 top-3 text-secondary-400 text-lg" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10 rounded-md"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {paginatedData.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left text-xs font-bold text-secondary-700 uppercase tracking-wide"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-secondary-100 hover:bg-primary-50/30 transition-colors duration-200"
                  onClick={() => onRowClick?.(row)}
                  role={onRowClick ? 'button' : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm text-secondary-800 font-medium"
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center rounded-lg">
            <div className="inline-block mb-4">
              <MdSearch className="text-5xl text-secondary-300" />
            </div>
            <p className="text-secondary-600 font-semibold mb-2">No Data Found</p>
            <p className="text-secondary-500 text-sm">
              {emptyMessage || 'No records match your search criteria.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginatedData.length > 0 && (
        <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between bg-secondary-50/50 rounded-b-lg">
          <span className="text-xs font-medium text-secondary-600">
            Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredData.length)} of{' '}
            {filteredData.length} results
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-ghost gap-1 px-3 py-2 text-sm rounded-md"
            >
              <MdChevronLeft /> Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 2), Math.min(totalPages, page + 1))
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-md text-xs font-semibold transition-all duration-200 ${
                      page === p
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white border border-secondary-200 text-secondary-700 hover:border-primary-500 hover:text-primary-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-ghost gap-1 px-3 py-2 text-sm rounded-md"
            >
              Next <MdChevronRight />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
