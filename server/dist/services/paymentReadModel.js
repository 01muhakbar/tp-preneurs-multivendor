const getAttr = (row, key) => row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];
const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
export const compareTimelineDesc = (left, right) => {
    const leftTime = new Date(getAttr(left, "createdAt") || 0).getTime();
    const rightTime = new Date(getAttr(right, "createdAt") || 0).getTime();
    if (rightTime !== leftTime) {
        return rightTime - leftTime;
    }
    return toNumber(getAttr(right, "id")) - toNumber(getAttr(left, "id"));
};
export const getLatestTimelineRecord = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0)
        return null;
    return [...rows].sort(compareTimelineDesc)[0] ?? null;
};
export const sortTimelineDesc = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0)
        return [];
    return [...rows].sort(compareTimelineDesc);
};
