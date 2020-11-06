export const buildInsertQuery = (tableName: string, obj: object): string => {
  const columns = Object.keys(obj).join(", ");
  const placeholders = Object.values(obj)
    .map((_el, index) => `$${index + 1}`)
    .join(", ");
  return `INSERT INTO ${tableName}(${columns}) VALUES(${placeholders})`;
};

export const buildUpdateQuery = (tableName: string, obj: object, primaryKeyName: string = "id"): string => {
  const setString = Object.keys(obj)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(", ");
  return `UPDATE ${tableName} SET ${setString} WHERE ${primaryKeyName} = $1`;
};

export const extractValuesForSQL = (obj: object): string[] => {
  return Object.values(obj).map((value) => (value == null ? "NULL" : value));
};
