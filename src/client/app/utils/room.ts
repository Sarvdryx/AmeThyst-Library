function localizedKey(
  t: (key: string) => string,
  key: string,
  fallback: string
): string {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function localizedDesc(
  t: (key: string) => string,
  roomId: number,
  fallback: string
): string {
  return localizedKey(t, `room.desc_${roomId}`, fallback);
}

export function localizedRoomName(
  t: (key: string) => string,
  roomId: number,
  fallback: string
): string {
  return localizedKey(t, `room.name_${roomId}`, fallback);
}

const branchKeyMap: Record<number, string> = {
  1: 'floor_map.branch_nvc',
  2: 'floor_map.branch_lt',
};

export function localizedBranchName(
  t: (key: string) => string,
  branchId: number,
  fallback: string
): string {
  const key = branchKeyMap[branchId];
  return key ? localizedKey(t, key, fallback) : fallback;
}
