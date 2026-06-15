export const mapMongoDoc = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => mapMongoDoc(item));
  }

  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    const source = typeof value.toObject === 'function' ? value.toObject() : value;
    const result = {};

    for (const [key, item] of Object.entries(source)) {
      if (key === '__v') continue;
      if (key === '_id') {
        result.id = String(item);
        continue;
      }

      result[key] = mapMongoDoc(item);
    }

    return result;
  }

  return value;
};
