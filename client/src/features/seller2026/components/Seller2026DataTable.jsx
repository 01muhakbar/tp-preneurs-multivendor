export default function Seller2026DataTable({ columns = [], rows = [], renderRow }) {
  return (
    <div className="s26-table-wrap">
      <table className="s26-table">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row, index) => renderRow(row, index))}</tbody>
      </table>
    </div>
  );
}
