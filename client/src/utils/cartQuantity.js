export const normalizeCartStock = (stock) => {
  if (stock === null || stock === undefined || stock === "") return null;
  const value = Number(stock);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
};

export const clampCartQuantity = (value, stock, fallback = 1) => {
  const parsed = Number(value);
  const fallbackValue = Math.max(1, Math.floor(Number(fallback) || 1));
  const quantity = Number.isFinite(parsed) && parsed >= 1
    ? Math.floor(parsed)
    : fallbackValue;
  const availableStock = normalizeCartStock(stock);

  return availableStock === null
    ? quantity
    : Math.min(Math.max(1, availableStock), quantity);
};
