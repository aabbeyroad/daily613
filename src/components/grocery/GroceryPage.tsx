// ========================================
// 장보기 목록 페이지
// 식단 결정에서 자동 생성 + 수동 추가
// ========================================

import { useState } from 'react';
import { useAppStore } from '../../stores/householdStore';

export default function GroceryPage() {
  const household = useAppStore((s) => s.household);
  const addGroceryItem = useAppStore((s) => s.addGroceryItem);
  const toggleGroceryItem = useAppStore((s) => s.toggleGroceryItem);
  const removeGroceryItem = useAppStore((s) => s.removeGroceryItem);
  const clearCheckedGrocery = useAppStore((s) => s.clearCheckedGrocery);
  const generateGroceryFromMeals = useAppStore((s) => s.generateGroceryFromMeals);

  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  if (!household) return null;

  const items = household.groceryItems;
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const handleAdd = () => {
    if (!newItem.trim()) return;
    addGroceryItem({
      name: newItem.trim(),
      quantity: newQuantity.trim(),
      checked: false,
    });
    setNewItem('');
    setNewQuantity('');
  };

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-text-primary">장보기 목록</h1>
        <button
          onClick={generateGroceryFromMeals}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-medium"
        >
          🍳 식단에서 가져오기
        </button>
      </div>

      {/* 추가 입력 */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="재료 이름"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm outline-none focus:ring-2 focus:ring-primary-400"
        />
        <input
          type="text"
          placeholder="수량"
          value={newQuantity}
          onChange={(e) => setNewQuantity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-20 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium"
        >
          추가
        </button>
      </div>

      {/* 미구매 목록 */}
      {unchecked.length === 0 && checked.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          <p className="text-3xl mb-3">🛒</p>
          <p className="text-sm">장보기 목록이 비어있어요</p>
          <p className="text-xs mt-1">위에서 직접 추가하거나 식단에서 가져올 수 있어요</p>
        </div>
      ) : (
        <>
          {unchecked.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1">
                구매 필요 ({unchecked.length})
              </h3>
              <div className="space-y-1.5">
                {unchecked.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-surface-secondary border border-border"
                  >
                    <button
                      onClick={() => toggleGroceryItem(item.id)}
                      className="w-6 h-6 rounded-full border-2 border-border flex-shrink-0 transition-colors hover:border-primary-400"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-text-primary">{item.name}</p>
                    </div>
                    {item.quantity && (
                      <span className="text-xs text-text-tertiary flex-shrink-0">{item.quantity}</span>
                    )}
                    <button
                      onClick={() => removeGroceryItem(item.id)}
                      className="text-text-tertiary hover:text-red-500 flex-shrink-0"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 구매 완료 */}
          {checked.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  구매 완료 ({checked.length})
                </h3>
                <button
                  onClick={clearCheckedGrocery}
                  className="text-xs text-red-500 font-medium"
                >
                  비우기
                </button>
              </div>
              <div className="space-y-1.5 opacity-60">
                {checked.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-secondary"
                  >
                    <button
                      onClick={() => toggleGroceryItem(item.id)}
                      className="w-6 h-6 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </button>
                    <p className="text-sm text-text-secondary line-through flex-1">{item.name}</p>
                    {item.quantity && (
                      <span className="text-xs text-text-tertiary">{item.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
