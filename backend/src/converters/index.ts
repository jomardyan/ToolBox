import { parseCSV, generateCSV } from '../utils/csvUtils';
import Papa from 'papaparse';

export const csvToJson = (csvData: string): string => {
  const { rows } = parseCSV(csvData);
  return JSON.stringify(rows, null, 2);
};

export const jsonToCSV = (jsonData: string): string => {
  const rows = JSON.parse(jsonData);
  const arrayRows = Array.isArray(rows) ? rows : [rows];
  return generateCSV(arrayRows);
};

export const csvToXml = (csvData: string): string => {
  const { rows } = parseCSV(csvData);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
  rows.forEach((row) => {
    xml += '  <record>\n';
    Object.entries(row).forEach(([key, value]) => {
      const escapedValue = String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      xml += `    <${sanitizeXmlTag(key)}>${escapedValue}</${sanitizeXmlTag(key)}>\n`;
    });
    xml += '  </record>\n';
  });
  xml += '</root>';
  
  return xml;
};

export const xmlToCSV = (xmlData: string): string => {
  // Simple XML to CSV conversion - works for basic structures
  const rows: Record<string, any>[] = [];
  
  // Try to parse as record-based first
  let recordRegex = /<record>([\s\S]*?)<\/record>/gi;
  let match;
  let foundRecords = false;
  
  while ((match = recordRegex.exec(xmlData)) !== null) {
    foundRecords = true;
    const record = match[1];
    const row: Record<string, any> = {};
    
    const elementRegex = /<([^>/\s]+)>([\s\S]*?)<\/\1>/g;
    let elementMatch;
    
    while ((elementMatch = elementRegex.exec(record)) !== null) {
      const tag = elementMatch[1];
      const value = elementMatch[2].trim();
      row[tag] = value;
    }
    
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }
  
  // If no <record> tags found, try item-based parsing
  if (!foundRecords) {
    let itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    while ((match = itemRegex.exec(xmlData)) !== null) {
      foundRecords = true;
      const item = match[1];
      const row: Record<string, any> = {};
      
      const elementRegex = /<([^>/\s]+)>([\s\S]*?)<\/\1>/g;
      let elementMatch;
      
      while ((elementMatch = elementRegex.exec(item)) !== null) {
        const tag = elementMatch[1];
        const value = elementMatch[2].trim();
        row[tag] = value;
      }
      
      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }
  }
  
  // If still no rows, try generic element parsing (only leaf elements with actual text content)
  if (!foundRecords) {
    const leafElements = /<([^>/\s]+)>([^<]+)<\/\1>/g;
    let tempRow: Record<string, any> = {};
    
    while ((match = leafElements.exec(xmlData)) !== null) {
      const tag = match[1];
      const value = match[2].trim();
      
      // Skip root and xml wrapper tags, only collect if value is non-empty
      if (tag.toLowerCase() !== 'root' && tag.toLowerCase() !== 'xml' && value.length > 0) {
        tempRow[tag] = value;
      }
    }
    
    if (Object.keys(tempRow).length > 0) {
      rows.push(tempRow);
    }
  }
  
  if (rows.length === 0) {
    // Return a minimal valid CSV if nothing could be parsed
    rows.push({ value: 'N/A' });
  }
  
  return generateCSV(rows);
};

export const csvToYaml = (csvData: string): string => {
  const { rows } = parseCSV(csvData);
  
  let yaml = '';
  rows.forEach((row, index) => {
    yaml += `- record_${index + 1}:\n`;
    Object.entries(row).forEach(([key, value]) => {
      yaml += `    ${key}: "${value}"\n`;
    });
  });
  
  return yaml;
};

export const yamlToCSV = (yamlData: string): string => {
  // Simple YAML to CSV conversion - handles array of objects
  const rows: Record<string, any>[] = [];
  
  if (!yamlData || yamlData.trim().length === 0) {
    return generateCSV([]);
  }
  
  const lines = yamlData.split('\n');
  let currentRow: Record<string, any> = {};
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    
    if (trimmed.startsWith('-')) {
      // New item in array
      if (Object.keys(currentRow).length > 0) {
        rows.push(currentRow);
      }
      currentRow = {};
      
      // Handle inline key-value after dash: "- name: value"
      const afterDash = trimmed.substring(1).trim();
      if (afterDash.includes(':')) {
        const [key, value] = afterDash.split(':').map((s) => s.trim());
        currentRow[key] = value.replace(/^["']|["']$/g, '');
      }
    } else if (trimmed.includes(':')) {
      // Key-value pair
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      currentRow[key] = value.replace(/^["']|["']$/g, '');
    }
  });
  
  if (Object.keys(currentRow).length > 0) {
    rows.push(currentRow);
  }
  
  if (rows.length === 0) {
    return generateCSV([]);
  }
  
  return generateCSV(rows);
};

export const csvToHtml = (csvData: string): string => {
  const { headers, rows } = parseCSV(csvData);
  
  let html = '<table border="1" style="border-collapse:collapse;"><thead><tr>';
  headers.forEach((header) => {
    html += `<th>${escapeHtml(header)}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  rows.forEach((row) => {
    html += '<tr>';
    headers.forEach((header) => {
      html += `<td>${escapeHtml(String(row[header] || ''))}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  return html;
};

export const htmlToCSV = (htmlData: string): string => {
  // Parse HTML table to CSV
  const rows: Record<string, any>[] = [];
  
  // Use regex to find table rows
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  
  let headers: string[] = [];
  let isFirstRow = true;
  
  let trMatch;
  while ((trMatch = trRegex.exec(htmlData)) !== null) {
    const rowContent = trMatch[1];
    
    // Check if this row contains <th> (header row)
    let cellMatches = [];
    
    // Try to extract <th> cells
    let thMatch;
    while ((thMatch = thRegex.exec(rowContent)) !== null) {
      cellMatches.push(thMatch[1]);
    }
    
    // If no <th> found, extract <td> cells
    if (cellMatches.length === 0) {
      let tdMatch;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        cellMatches.push(tdMatch[1]);
      }
    }
    
    if (cellMatches.length === 0) {
      continue;
    }
    
    // Extract clean text from cells
    const cleanCells = cellMatches.map((content) => 
      content.replace(/<[^>]+>/g, '').trim()
    );
    
    // First row with cells is the header if it's the first row
    if (isFirstRow && headers.length === 0) {
      headers = cleanCells;
      isFirstRow = false;
    } else if (headers.length > 0) {
      // Subsequent rows are data
      const row: Record<string, any> = {};
      cleanCells.forEach((content, index) => {
        const header = headers[index] || `column_${index}`;
        row[header] = content;
      });
      
      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }
  }
  
  return generateCSV(rows, headers);
};

export const csvToTsv = (csvData: string): string => {
  const { headers, rows } = parseCSV(csvData);
  
  let tsv = headers.join('\t') + '\n';
  rows.forEach((row) => {
    const values = headers.map((header) => String(row[header] || ''));
    tsv += values.join('\t') + '\n';
  });
  
  return tsv.trim();
};

export const tsvToCSV = (tsvData: string): string => {
  // TSV is similar to CSV, just with tabs
  const lines = tsvData.split('\n');
  const rows: Record<string, any>[] = [];
  
  if (lines.length < 2) {
    return '';
  }
  
  const headers = lines[0].split('\t');
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return generateCSV(rows);
};

export const csvToKml = (csvData: string): string => {
  const { rows } = parseCSV(csvData);
  
  // Assumes CSV has latitude, longitude, and name columns
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>`;
  
  rows.forEach((row) => {
    const lat = row.latitude || row.lat;
    const lng = row.longitude || row.lng || row.lon;
    const name = row.name || 'Location';
    
    if (lat && lng) {
      kml += `
    <Placemark>
      <name>${escapeHtml(String(name))}</name>
      <Point>
        <coordinates>${lng},${lat}</coordinates>
      </Point>
    </Placemark>`;
    }
  });
  
  kml += `
  </Document>
</kml>`;
  
  return kml;
};

export const kmlToCSV = (kmlData: string): string => {
  const rows: Record<string, any>[] = [];
  
  // Parse KML placemarks
  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
  const nameRegex = /<name>(.*?)<\/name>/i;
  const coordRegex = /<coordinates>(.*?)<\/coordinates>/i;
  
  let match;
  while ((match = placemarkRegex.exec(kmlData)) !== null) {
    const placemark = match[1];
    const nameMatch = nameRegex.exec(placemark);
    const coordMatch = coordRegex.exec(placemark);
    
    if (coordMatch) {
      const [lng, lat] = coordMatch[1].split(',');
      rows.push({
        name: nameMatch ? nameMatch[1] : 'Location',
        latitude: lat,
        longitude: lng,
      });
    }
  }
  
  return generateCSV(rows);
};

export const csvToTxt = (csvData: string): string => {
  const { headers, rows } = parseCSV(csvData);
  
  let txt = headers.join(' | ') + '\n';
  txt += '-'.repeat(headers.join(' | ').length) + '\n';
  
  rows.forEach((row) => {
    const values = headers.map((header) => String(row[header] || ''));
    txt += values.join(' | ') + '\n';
  });
  
  return txt;
};

export const txtToCSV = (txtData: string): string => {
  const lines = txtData.split('\n').filter((line) => line.trim());
  
  if (lines.length < 2) {
    return '';
  }
  
  // Try to detect delimiter
  const firstLine = lines[0];
  let delimiter = '|';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(',')) delimiter = ',';
  
  const headers = firstLine.split(delimiter).map((h) => h.trim());
  const rows: Record<string, any>[] = [];
  
  for (let i = 2; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim());
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return generateCSV(rows);
};

export const csvToMarkdown = (csvData: string): string => {
  const { headers, rows } = parseCSV(csvData);
  
  let markdown = '| ' + headers.join(' | ') + ' |\n';
  markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  rows.forEach((row) => {
    const values = headers.map((header) => String(row[header] || ''));
    markdown += '| ' + values.join(' | ') + ' |\n';
  });
  
  return markdown;
};

export const markdownToCSV = (markdownData: string): string => {
  const lines = markdownData.split('\n').filter((line) => line.trim());
  
  if (lines.length < 3) {
    throw new Error('Invalid markdown table format');
  }
  
  const headers = lines[0]
    .split('|')
    .map((h) => h.trim())
    .filter((h) => h.length > 0);
  
  const rows: Record<string, any>[] = [];
  
  for (let i = 2; i < lines.length; i++) {
    const values = lines[i]
      .split('|')
      .map((v) => v.trim())
      .filter((v, idx) => idx < headers.length);
    
    if (values.length === headers.length) {
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return generateCSV(rows, headers);
};

export const csvToJsonl = (csvData: string): string => {
  const { rows } = parseCSV(csvData);
  
  return rows
    .map((row) => JSON.stringify(row))
    .join('\n');
};

export const jsonlToCSV = (jsonlData: string): string => {
  const lines = jsonlData.split('\n').filter((line) => line.trim());
  
  if (lines.length === 0) {
    throw new Error('No data found in JSONL');
  }
  
  const rows: Record<string, any>[] = [];
  
  lines.forEach((line) => {
    try {
      const obj = JSON.parse(line);
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        rows.push(obj);
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  });
  
  if (rows.length === 0) {
    throw new Error('No valid JSON objects found in JSONL');
  }
  
  return generateCSV(rows);
};

export const csvToIcs = (csvData: string): string => {
  const { rows } = parseCSV(csvData);
  
  // Assumes CSV has title, start_date, end_date, description columns
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ToolBox//Events//EN
CALSCALE:GREGORIAN
`;
  
  rows.forEach((row) => {
    const title = row.title || row.name || 'Event';
    const startDate = row.start_date || row.date || '';
    const endDate = row.end_date || startDate || '';
    const description = row.description || '';
    
    if (startDate) {
      ics += `BEGIN:VEVENT
UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@toolbox
DTSTART:${formatDateForIcs(startDate)}
DTEND:${formatDateForIcs(endDate || startDate)}
SUMMARY:${escapeIcsField(title)}
DESCRIPTION:${escapeIcsField(description)}
END:VEVENT
`;
    }
  });
  
  ics += 'END:VCALENDAR';
  
  return ics;
};

export const icsToCSV = (icsData: string): string => {
  const rows: Record<string, any>[] = [];
  
  const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;
  
  while ((match = eventRegex.exec(icsData)) !== null) {
    const event = match[1];
    const row: Record<string, any> = {};
    
    const summaryMatch = /SUMMARY:(.+?)(?:\r?\n|$)/i.exec(event);
    const dtStartMatch = /DTSTART:(.+?)(?:\r?\n|$)/i.exec(event);
    const dtEndMatch = /DTEND:(.+?)(?:\r?\n|$)/i.exec(event);
    const descriptionMatch = /DESCRIPTION:(.+?)(?:\r?\n|$)/i.exec(event);
    
    if (summaryMatch) {
      row.title = unescapeIcsField(summaryMatch[1]);
    }
    if (dtStartMatch) {
      row.start_date = formatDateFromIcs(dtStartMatch[1]);
    }
    if (dtEndMatch) {
      row.end_date = formatDateFromIcs(dtEndMatch[1]);
    }
    if (descriptionMatch) {
      row.description = unescapeIcsField(descriptionMatch[1]);
    }
    
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }
  
  if (rows.length === 0) {
    throw new Error('No events found in ICS');
  }
  
  return generateCSV(rows);
};

export const csvToToml = (csvData: string): string => {
  const { rows } = parseCSV(csvData);
  
  let toml = '';
  
  rows.forEach((row, index) => {
    toml += `[[records]]\n`;
    Object.entries(row).forEach(([key, value]) => {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const stringValue = String(value)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      toml += `${cleanKey} = "${stringValue}"\n`;
    });
    if (index < rows.length - 1) {
      toml += '\n';
    }
  });
  
  return toml;
};

export const tomlToCSV = (tomlData: string): string => {
  const rows: Record<string, any>[] = [];
  
  // Simple TOML array of tables parser
  const tableRegex = /\[\[records\]\]([\s\S]*?)(?=\[\[records\]\]|$)/g;
  let match;
  
  while ((match = tableRegex.exec(tomlData)) !== null) {
    const tableContent = match[1];
    const row: Record<string, any> = {};
    
    const lineRegex = /(\w+)\s*=\s*"([^"]*)"/g;
    let lineMatch;
    
    while ((lineMatch = lineRegex.exec(tableContent)) !== null) {
      row[lineMatch[1]] = lineMatch[2];
    }
    
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }
  
  if (rows.length === 0) {
    throw new Error('No records found in TOML');
  }
  
  return generateCSV(rows);
};

// Excel Converters
export const csvToExcel = (csvData: string): string => {
  // For now, return CSV as-is with Excel-compatible formatting
  // In a real implementation with binary output, would use ExcelJS
  const { headers, rows } = parseCSV(csvData);
  
  // Create a tab-separated format that Excel can read
  let excel = headers.join('\t') + '\n';
  rows.forEach((row) => {
    const values = headers.map((header) => {
      const value = String(row[header] || '');
      // Escape quotes for Excel
      return value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
    });
    excel += values.join('\t') + '\n';
  });
  
  return excel;
};

export const excelToCSV = (excelData: string): string => {
  // Parse tab-separated or Excel-formatted data
  const lines = excelData.split('\n').filter((line) => line.trim());
  
  if (lines.length < 2) {
    throw new Error('Invalid Excel data: at least header and one data row required');
  }
  
  const headers = lines[0].split('\t').map((h) => h.trim());
  const rows: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map((v) => {
      // Unescape Excel quotes
      return v.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
    });
    
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return generateCSV(rows, headers);
};

// SQL Converters
export const csvToSql = (csvData: string, tableName: string = 'data'): string => {
  const { headers, rows } = parseCSV(csvData);
  
  // Generate CREATE TABLE statement
  let sql = `CREATE TABLE ${sanitizeSqlIdentifier(tableName)} (\n`;
  sql += headers.map((h) => `  ${sanitizeSqlIdentifier(h)} VARCHAR(255)`).join(',\n');
  sql += '\n);\n\n';
  
  // Generate INSERT statements
  rows.forEach((row) => {
    const columns = headers.map((h) => sanitizeSqlIdentifier(h)).join(', ');
    const values = headers
      .map((h) => {
        const value = String(row[h] || '');
        return `'${escapeSqlString(value)}'`;
      })
      .join(', ');
    
    sql += `INSERT INTO ${sanitizeSqlIdentifier(tableName)} (${columns}) VALUES (${values});\n`;
  });
  
  return sql;
};

export const sqlToCSV = (sqlData: string): string => {
  const rows: Record<string, any>[] = [];
  let headers: string[] = [];
  
  // Parse CREATE TABLE to extract column names
  const createRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/i;
  const createMatch = createRegex.exec(sqlData);
  
  if (createMatch) {
    const columnDefs = createMatch[2];
    headers = columnDefs
      .split(',')
      .map((col) => {
        const match = col.trim().match(/(\w+)/);
        return match ? match[1] : '';
      })
      .filter((h) => h.length > 0);
  }
  
  // Parse INSERT statements
  const insertRegex = /INSERT\s+INTO\s+\w+\s*(?:\((.*?)\))?\s*VALUES\s*\(([\s\S]*?)\);/gi;
  let insertMatch;
  
  while ((insertMatch = insertRegex.exec(sqlData)) !== null) {
    const valuesStr = insertMatch[2];
    const values = parseSqlValues(valuesStr);
    
    // If no headers from CREATE TABLE, extract from INSERT column list
    if (headers.length === 0 && insertMatch[1]) {
      headers = insertMatch[1]
        .split(',')
        .map((col) => col.trim().replace(/^`|`$/g, '').replace(/^"|"$/g, ''));
    }
    
    const row: Record<string, any> = {};
    if (headers.length > 0) {
      headers.forEach((h, index) => {
        row[h] = values[index] || '';
      });
    } else {
      // Fallback if no headers found
      values.forEach((v, index) => {
        row[`column_${index + 1}`] = v;
      });
    }
    
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }
  
  if (rows.length === 0) {
    throw new Error('No INSERT statements found in SQL');
  }
  
  return generateCSV(rows, headers.length > 0 ? headers : undefined);
};

// Aliases for naming consistency
export const csvToTable = (csvData: string): string => {
  return csvToHtml(csvData);
};

export const tableToCSV = (tableData: string): string => {
  return htmlToCSV(tableData);
};

export const csvToLines = (csvData: string): string => {
  return csvToJsonl(csvData);
};

export const linesToCSV = (linesData: string): string => {
  return jsonlToCSV(linesData);
};

// Helper functions
const sanitizeXmlTag = (tag: string): string => {
  return tag.replace(/[^a-zA-Z0-9_\-]/g, '_');
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDateForIcs = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch {
    return dateStr;
  }
};

const formatDateFromIcs = (icsDateStr: string): string => {
  try {
    const year = icsDateStr.substring(0, 4);
    const month = icsDateStr.substring(4, 6);
    const day = icsDateStr.substring(6, 8);
    const hour = icsDateStr.substring(9, 11) || '00';
    const minute = icsDateStr.substring(11, 13) || '00';
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch {
    return icsDateStr;
  }
};

const escapeIcsField = (field: string): string => {
  return String(field)
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
};

const unescapeIcsField = (field: string): string => {
  return String(field)
    .replace(/\\n/g, '\n')
    .replace(/\\;/g, ';')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\');
};

const sanitizeSqlIdentifier = (identifier: string): string => {
  // Remove special characters and quote if necessary
  const cleaned = identifier.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^\d/.test(cleaned) ? `_${cleaned}` : cleaned;
};

const escapeSqlString = (str: string): string => {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
};

const parseSqlValues = (valuesStr: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < valuesStr.length) {
    const char = valuesStr[i];
    const nextChar = valuesStr[i + 1];
    
    if (char === "'" && !inQuotes) {
      inQuotes = true;
      i++;
    } else if (char === "'" && inQuotes && nextChar === "'") {
      // Escaped quote
      current += "'";
      i += 2;
    } else if (char === "'" && inQuotes) {
      inQuotes = false;
      i++;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^'|'$/g, '').replace(/''/g, "'"));
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  if (current.trim()) {
    values.push(current.trim().replace(/^'|'$/g, '').replace(/''/g, "'"));
  }
  
  return values;
};
