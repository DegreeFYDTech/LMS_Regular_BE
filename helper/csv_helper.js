import { Parser } from 'json2csv';

export function convertToCSV(data, fields, fieldNames) {
  const flatData = data.map((item) => {
    const flattened = {};

    fields.forEach((field) => {
      if (field.includes('.')) {
        const parts = field.split('.');
        let val = item;
        for (const part of parts) {
          val = val ? val[part] : '';
        }
        flattened[field] = val ?? '';
      } else {
        flattened[field] = item[field] ?? '';
      }
    });

    return flattened;
  });

  const fieldDefs = fields.map((f) => ({
    value: f,
    label: (fieldNames && fieldNames[f]) || f,
  }));
  const parser = new Parser({ fields: fieldDefs });
  return parser.parse(flatData);
}
