import EmptyState from "../../components/EmptyState.jsx";
import ItemCard from "./ItemCard.jsx";

export default function ItemList({ items, emptyTitle, ...cardProps }) {
  if (!items.length) {
    return <EmptyState title={emptyTitle} description="链上暂时没有符合条件的数据" />;
  }

  return (
    <div className="item-list">
      {items.map((item) => (
        <ItemCard key={item.idText} item={item} {...cardProps} />
      ))}
    </div>
  );
}
