import EmptyState from "../../components/EmptyState.jsx";
import RentalCard from "./RentalCard.jsx";

export default function RentalList({ records, emptyTitle, ...cardProps }) {
  if (!records.length) {
    return <EmptyState title={emptyTitle} description="当前钱包暂无链上租赁记录" />;
  }

  return (
    <div className="item-list">
      {records.map((record) => (
        <RentalCard key={record.idText} rental={record} {...cardProps} />
      ))}
    </div>
  );
}
