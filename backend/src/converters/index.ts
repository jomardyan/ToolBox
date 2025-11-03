import { parseCSV, generateCSV } from '../utils/csvUtils';

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
  
  // Parse XML records using regex
  const recordRegex = /<record>([\s\S]*?)<\/record>/gi;
  let match;
  
  while ((match = recordRegex.exec(xmlData)) !== null) {
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
  
  if (rows.length === 0) {
    throw new Error('No records found in XML');
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
  
  const lines = yamlData.split('\n');
  let currentRow: Record<string, any> = {};
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-')) {
      // New item
      if (Object.keys(currentRow).length > 0) {
        rows.push(currentRow);
      }
      currentRow = {};
    } else if (trimmed.includes(':')) {
      const [key, value] = trimmed.split(':').map((s) => s.trim());
      currentRow[key] = value.replace(/^["']|["']$/g, '');
    }
  });
  
  if (Object.keys(currentRow).length > 0) {
    rows.push(currentRow);
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
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  
  let isHeader = true;
  let headers: string[] = [];
  
  let trMatch;
  while ((trMatch = trRegex.exec(htmlData)) !== null) {
    const row: Record<string, any> = {};
    const tdMatches = [];
    let tdMatch;
    
    // Reset regex
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
      tdMatches.push(tdMatch[1]);
    }
    
    tdMatches.forEach((content, index) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      
      if (isHeader) {
        headers.push(cleanContent);
      } else {
        const header = headers[index] || `column_${index}`;
        row[header] = cleanContent;
      }
    });
    
    if (!isHeader && Object.keys(row).length > 0) {
      rows.push(row);
    }
    isHeader = false;
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
