import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiFileText, FiCode, FiDatabase, FiTable } from 'react-icons/fi';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface FormatInfo {
  name: string;
  fullName: string;
  description: string;
  extension: string;
  useCase: string;
  icon: React.ReactNode;
  example: string;
}

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const formats: FormatInfo[] = [
    {
      name: 'CSV',
      fullName: 'Comma-Separated Values',
      description: 'A plain text format that uses commas to separate values. Each line represents a data record, and each record consists of one or more fields separated by commas.',
      extension: '.csv',
      useCase: 'Ideal for spreadsheet data, database exports, and simple tabular data. Widely supported by Excel, Google Sheets, and database systems.',
      icon: <FiTable className="text-green-500 dark:text-green-400" />,
      example: 'name,age,city\nJohn,30,New York\nJane,25,London'
    },
    {
      name: 'JSON',
      fullName: 'JavaScript Object Notation',
      description: 'A lightweight data interchange format that is easy for humans to read and write, and easy for machines to parse and generate. Uses key-value pairs and arrays.',
      extension: '.json',
      useCase: 'Perfect for API responses, configuration files, and web applications. The de facto standard for data exchange on the web.',
      icon: <FiCode className="text-blue-500 dark:text-blue-400" />,
      example: '{"name": "John", "age": 30, "city": "New York"}'
    },
    {
      name: 'XML',
      fullName: 'Extensible Markup Language',
      description: 'A markup language that defines rules for encoding documents in a format that is both human-readable and machine-readable. Uses nested tags to represent data hierarchy.',
      extension: '.xml',
      useCase: 'Common in enterprise systems, SOAP APIs, configuration files, and document formats like Office files. Supports schema validation.',
      icon: <FiCode className="text-orange-500 dark:text-orange-400" />,
      example: '<person><name>John</name><age>30</age></person>'
    },
    {
      name: 'YAML',
      fullName: 'YAML Ain\'t Markup Language',
      description: 'A human-friendly data serialization format that uses indentation to denote structure. More readable than JSON with support for comments.',
      extension: '.yaml, .yml',
      useCase: 'Popular for configuration files (Docker, Kubernetes), CI/CD pipelines, and settings. Preferred when human readability is priority.',
      icon: <FiFileText className="text-purple-500 dark:text-purple-400" />,
      example: 'name: John\nage: 30\ncity: New York'
    },
    {
      name: 'HTML',
      fullName: 'HyperText Markup Language',
      description: 'The standard markup language for documents designed to be displayed in a web browser. Defines the structure and content of web pages.',
      extension: '.html, .htm',
      useCase: 'Web pages, email templates, and any content meant for browser display. Can include styling and scripts.',
      icon: <FiCode className="text-red-500 dark:text-red-400" />,
      example: '<table><tr><td>Name</td><td>John</td></tr></table>'
    },
    {
      name: 'TABLE',
      fullName: 'Plain Text Table',
      description: 'A simple text-based table format using spaces or special characters for alignment. Human-readable tabular representation.',
      extension: '.txt',
      useCase: 'Console output, plain text reports, and documentation. Great for displaying data in terminals or text editors.',
      icon: <FiTable className="text-gray-600 dark:text-gray-400" />,
      example: '| Name  | Age | City     |\n|-------|-----|----------|\n| John  | 30  | New York |'
    },
    {
      name: 'TSV',
      fullName: 'Tab-Separated Values',
      description: 'Similar to CSV but uses tabs instead of commas to separate values. More reliable when data contains commas.',
      extension: '.tsv, .tab',
      useCase: 'Data exports, clipboard data, and situations where comma conflicts exist. Cleaner for data containing punctuation.',
      icon: <FiTable className="text-teal-500 dark:text-teal-400" />,
      example: 'name\tage\tcity\nJohn\t30\tNew York'
    },
    {
      name: 'KML',
      fullName: 'Keyhole Markup Language',
      description: 'An XML-based format for geographic data, used to display geographic information in applications like Google Earth and Google Maps.',
      extension: '.kml',
      useCase: 'Geographic visualization, GPS data, mapping applications, and location-based services. Supports placemarks, paths, and polygons.',
      icon: <FiCode className="text-green-600 dark:text-green-400" />,
      example: '<kml><Placemark><name>Location</name><Point><coordinates>-122.0822,37.4220</coordinates></Point></Placemark></kml>'
    },
    {
      name: 'TXT',
      fullName: 'Plain Text',
      description: 'Unformatted text without any special markup or structure. Contains only readable characters.',
      extension: '.txt',
      useCase: 'Notes, logs, simple documentation, and any basic text content. Universal compatibility across all platforms.',
      icon: <FiFileText className="text-gray-700 dark:text-gray-300" />,
      example: 'This is plain text content\nwith multiple lines'
    },
    {
      name: 'MARKDOWN',
      fullName: 'Markdown',
      description: 'A lightweight markup language with plain text formatting syntax. Converts to HTML while remaining highly readable in source form.',
      extension: '.md, .markdown',
      useCase: 'Documentation, README files, blogs, forums, and content management. Widely used on GitHub and static site generators.',
      icon: <FiFileText className="text-blue-600 dark:text-blue-400" />,
      example: '# Heading\n\n**Bold text** and *italic text*\n\n- List item'
    },
    {
      name: 'JSONL',
      fullName: 'JSON Lines',
      description: 'A format where each line is a valid JSON object. Also known as newline-delimited JSON. Useful for streaming and large datasets.',
      extension: '.jsonl',
      useCase: 'Log files, streaming data, machine learning datasets, and processing large JSON collections line-by-line.',
      icon: <FiDatabase className="text-blue-500 dark:text-blue-300" />,
      example: '{"name":"John","age":30}\n{"name":"Jane","age":25}'
    },
    {
      name: 'NDJSON',
      fullName: 'Newline Delimited JSON',
      description: 'Identical to JSONL - each line contains a separate JSON object. Optimized for streaming and incremental processing.',
      extension: '.ndjson',
      useCase: 'Same as JSONL - streaming APIs, log aggregation, and processing large datasets without loading everything into memory.',
      icon: <FiDatabase className="text-indigo-500 dark:text-indigo-400" />,
      example: '{"id":1,"value":"data"}\n{"id":2,"value":"more"}'
    },
    {
      name: 'LINES',
      fullName: 'Line-Based Text',
      description: 'Simple format where each line represents a separate data item. No specific structure within each line.',
      extension: '.txt',
      useCase: 'Simple lists, line-by-line processing, word lists, and basic data collections. Easy to parse and manipulate.',
      icon: <FiFileText className="text-gray-600 dark:text-gray-400" />,
      example: 'Item 1\nItem 2\nItem 3'
    },
    {
      name: 'ICS',
      fullName: 'iCalendar',
      description: 'A standard format for calendar data exchange. Stores events, tasks, appointments, and scheduling information.',
      extension: '.ics',
      useCase: 'Calendar applications, event sharing, meeting invitations, and scheduling systems. Compatible with Outlook, Google Calendar, Apple Calendar.',
      icon: <FiFileText className="text-red-500 dark:text-red-300" />,
      example: 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Meeting\nDTSTART:20250105T100000Z\nEND:VEVENT\nEND:VCALENDAR'
    },
    {
      name: 'TOML',
      fullName: 'Tom\'s Obvious, Minimal Language',
      description: 'A configuration file format that is easy to read due to obvious semantics. Similar to INI files but with more features.',
      extension: '.toml',
      useCase: 'Configuration files for applications, especially popular in Rust projects (Cargo.toml). Clear section-based structure.',
      icon: <FiCode className="text-yellow-600 dark:text-yellow-400" />,
      example: '[database]\nserver = "192.168.1.1"\nports = [8001, 8002]'
    },
    {
      name: 'EXCEL',
      fullName: 'Microsoft Excel',
      description: 'Binary or XML-based spreadsheet format from Microsoft. Supports multiple sheets, formulas, formatting, and complex data structures.',
      extension: '.xlsx, .xls',
      useCase: 'Business reports, financial data, complex spreadsheets with calculations, charts, and formatting. Industry standard for tabular data.',
      icon: <FiTable className="text-green-700 dark:text-green-400" />,
      example: 'Binary format - typically contains sheets with rows and columns of data'
    },
    {
      name: 'SQL',
      fullName: 'Structured Query Language',
      description: 'Scripts containing database commands for creating tables, inserting data, or querying databases. Standard language for relational databases.',
      extension: '.sql',
      useCase: 'Database migrations, data dumps, backup scripts, and database initialization. Works with MySQL, PostgreSQL, SQL Server, etc.',
      icon: <FiDatabase className="text-blue-700 dark:text-blue-400" />,
      example: 'INSERT INTO users (name, age) VALUES (\'John\', 30);'
    }
  ];

  const faqs: FAQItem[] = [
    {
      question: 'How do I convert between different formats?',
      answer: 'Simply select your source format from the dropdown, paste or upload your data, choose the target format you want to convert to, and click Convert. The tool will automatically handle the conversion.',
      category: 'usage'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! All conversions are performed on our secure servers. We do not store your data after the conversion is complete. Your data is only held in memory during the conversion process and is immediately discarded afterward.',
      category: 'security'
    },
    {
      question: 'What is the maximum file size I can convert?',
      answer: 'Free users can convert files up to 10MB. Premium users have access to conversions up to 100MB. For larger files, please contact our enterprise support team.',
      category: 'limits'
    },
    {
      question: 'Can I batch convert multiple files?',
      answer: 'Yes! Use our Batch Processor feature to queue multiple conversion items and process them all at once. This is available for all users.',
      category: 'usage'
    },
    {
      question: 'Which formats are best for data exchange?',
      answer: 'JSON is the most popular for web APIs, CSV for spreadsheet data, XML for enterprise systems, and YAML for configuration files. Choose based on your specific use case and the systems you\'re integrating with.',
      category: 'formats'
    },
    {
      question: 'Do you support custom format conversions?',
      answer: 'Currently, we support the most common format conversions. If you need a specific format not listed, please contact our support team with your requirements.',
      category: 'features'
    },
    {
      question: 'Can I automate conversions using an API?',
      answer: 'Yes! Premium and Enterprise plans include API access. You can integrate our conversion service directly into your applications. Check our API documentation for details.',
      category: 'features'
    },
    {
      question: 'What happens if a conversion fails?',
      answer: 'If a conversion fails, you\'ll receive a detailed error message explaining what went wrong. Common issues include invalid data format, unsupported characters, or malformed input. Check your source data and try again.',
      category: 'troubleshooting'
    }
  ];

  const categories = [
    { value: 'all', label: 'All Questions' },
    { value: 'usage', label: 'Usage' },
    { value: 'security', label: 'Security' },
    { value: 'limits', label: 'Limits' },
    { value: 'formats', label: 'Formats' },
    { value: 'features', label: 'Features' },
    { value: 'troubleshooting', label: 'Troubleshooting' }
  ];

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to know about file format conversions and our supported formats
          </p>
        </div>

        {/* File Formats Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Supported File Formats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formats.map((format) => (
              <div
                key={format.name}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-all hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{format.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {format.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format.extension}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {format.fullName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {format.description}
                </p>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                    Best for:
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format.useCase}
                  </p>
                </div>
                <div className="mt-3 bg-gray-50 dark:bg-gray-900 rounded p-2">
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {format.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Common Questions
          </h2>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-left font-semibold text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <FiChevronUp className="text-primary-600 dark:text-primary-400 flex-shrink-0 ml-4" size={24} />
                  ) : (
                    <FiChevronDown className="text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4" size={24} />
                  )}
                </button>
                {openIndex === index && (
                  <div className="p-5 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No questions found in this category.
              </p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border-2 border-primary-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our support team is here to help you with any questions or concerns.
          </p>
          <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
