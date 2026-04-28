export default function Table({ columns, data, loading, emptyMsg = 'Nenhum registro encontrado' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col, i) => (
              <th key={i} className={`py-3 px-4 text-left font-semibold text-slate-600 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="py-12 text-center text-slate-400">Carregando...</td></tr>
          ) : data?.length === 0 ? (
            <tr><td colSpan={columns.length} className="py-12 text-center text-slate-400">{emptyMsg}</td></tr>
          ) : (
            data?.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={`py-3 px-4 ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
