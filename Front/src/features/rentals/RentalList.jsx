import EmptyState from "../../components/EmptyState.jsx";
import RentalCard from "./RentalCard.jsx";

export default function RentalList({ records, emptyTitle, emptyDescription = "当前钱包暂无链上租赁记录", ...cardProps }) {
  if (!records.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="item-list">
      {records.map((record) => (
        <RentalCard key={record.idText} rental={record} {...cardProps} />
      ))}
    </div>
  );
}
