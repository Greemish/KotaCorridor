import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAdd }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 bg-amber-50 flex items-center justify-center">
          <span className="text-5xl">🥪</span>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <p className="text-sm text-gray-500 mt-1 flex-1">{item.description}</p>
        <div className="mt-3 flex justify-between items-center">
          <span className="font-bold text-amber-600 text-lg">R{item.price.toFixed(2)}</span>
          <button
            onClick={() => onAdd(item)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
        {item.stockLevel !== undefined && item.stockLevel <= 5 && (
          <p className="text-xs text-red-500 mt-1">Only {item.stockLevel} left!</p>
        )}
      </div>
    </div>
  );
}
