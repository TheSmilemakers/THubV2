/**
 * EODHD API Type Generator Tool
 * Automatically generates TypeScript types from API responses
 */

import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

interface Field {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

interface GeneratorConfig {
  outputDir: string;
  apiKey: string;
  baseUrl: string;
}

export class EODHDTypeGenerator {
  private config: GeneratorConfig;
  private generatedTypes: Map<string, string> = new Map();
  private logger = logger.createChild('EODHDTypeGenerator');

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Parse JSON response and infer TypeScript types
   */
  parseResponse(endpoint: string, response: any): Field[] {
    const fields: Field[] = [];

    if (Array.isArray(response) && response.length > 0) {
      // For arrays, analyze the first element
      return this.analyzeObject(response[0]);
    } else if (typeof response === 'object' && response !== null) {
      return this.analyzeObject(response);
    }

    return fields;
  }

  /**
   * Analyze object structure and determine field types
   */
  private analyzeObject(obj: any): Field[] {
    const fields: Field[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const field: Field = {
        name: this.toCamelCase(key),
        type: this.inferType(value),
        optional: false, // Could be enhanced with multiple samples
      };

      fields.push(field);
    }

    return fields;
  }

  /**
   * Infer TypeScript type from JavaScript value
   */
  private inferType(value: any): string {
    if (value === null || value === undefined) {
      return 'any';
    }

    const type = typeof value;

    switch (type) {
      case 'string':
        // Check for date patterns
        if (this.isDateString(value)) {
          return 'DateString';
        }
        if (this.isDateTimeString(value)) {
          return 'DateTimeString';
        }
        return 'string';

      case 'number':
        // Check if it's an integer
        if (Number.isInteger(value)) {
          // Check for timestamp
          if (value > 1000000000 && value < 9999999999) {
            return 'UnixTimestamp';
          }
          return 'number';
        }
        return 'number';

      case 'boolean':
        return 'boolean';

      case 'object':
        if (Array.isArray(value)) {
          if (value.length > 0) {
            const elementType = this.inferType(value[0]);
            return `${elementType}[]`;
          }
          return 'any[]';
        }
        // For nested objects, generate interface name
        return this.generateNestedInterfaceName();

      default:
        return 'any';
    }
  }

  /**
   * Generate TypeScript interface from fields
   */
  generateInterface(name: string, fields: Field[], description?: string): string {
    const lines: string[] = [];

    if (description) {
      lines.push('/**');
      lines.push(` * ${description}`);
      lines.push(' */');
    }

    lines.push(`export interface ${name} {`);

    for (const field of fields) {
      if (field.description) {
        lines.push(`  /** ${field.description} */`);
      }
      const optional = field.optional ? '?' : '';
      lines.push(`  ${field.name}${optional}: ${field.type};`);
    }

    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Write generated types to file
   */
  async writeTypeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.config.outputDir, filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Add header
    const header = `/**
 * Auto-generated EODHD API Types
 * Generated: ${new Date().toISOString()}
 * 
 * DO NOT EDIT MANUALLY
 */

`;

    const finalContent = header + content;
    
    fs.writeFileSync(fullPath, finalContent, 'utf8');
    this.logger.info(`Generated types written to ${fullPath}`);
  }

  /**
   * Test endpoint and generate types
   */
  async generateFromEndpoint(
    endpoint: string,
    interfaceName: string,
    params?: Record<string, any>
  ): Promise<string> {
    try {
      // Make API request
      const url = new URL(`${this.config.baseUrl}${endpoint}`);
      url.searchParams.append('api_token', this.config.apiKey);
      url.searchParams.append('fmt', 'json');
      
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.append(key, String(value));
        }
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      // Parse response
      const fields = this.parseResponse(endpoint, data);

      // Generate interface
      const interfaceCode = this.generateInterface(
        interfaceName,
        fields,
        `Response type for ${endpoint}`
      );

      // Cache generated type
      this.generatedTypes.set(interfaceName, interfaceCode);

      return interfaceCode;
    } catch (error) {
      this.logger.error(`Failed to generate types for ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Generate types for all discovered endpoints
   */
  async generateAllTypes(endpoints: Array<{ path: string; name: string; params?: any }>): Promise<void> {
    const results: string[] = [];

    for (const endpoint of endpoints) {
      try {
        const typeCode = await this.generateFromEndpoint(
          endpoint.path,
          endpoint.name,
          endpoint.params
        );
        results.push(typeCode);

        // Rate limit compliance
        await this.sleep(100);
      } catch (error) {
        this.logger.error(`Skipping ${endpoint.name} due to error`, error);
      }
    }

    // Group by category and write files
    await this.organizeAndWriteTypes(results);
  }

  /**
   * Utility functions
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private isDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private isDateTimeString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(value);
  }

  private generateNestedInterfaceName(): string {
    return `NestedObject${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async organizeAndWriteTypes(types: string[]): Promise<void> {
    // This would organize types by category
    // For now, write to a single file
    const allTypes = types.join('\n');
    await this.writeTypeFile('generated/all-types.ts', allTypes);
  }
}

/**
 * Example usage
 */
export async function runTypeGenerator() {
  const generator = new EODHDTypeGenerator({
    outputDir: 'src/types/eodhd',
    apiKey: process.env.EODHD_API_KEY || 'demo',
    baseUrl: 'https://eodhd.com/api'
  });

  // Example endpoints to generate types for
  const endpoints = [
    { path: '/real-time/AAPL.US', name: 'RealTimeQuote' },
    { path: '/eod/AAPL.US', name: 'EODPrice', params: { from: '2024-01-01', to: '2024-01-31' } },
    { path: '/technical/AAPL.US', name: 'RSIIndicator', params: { function: 'rsi' } },
    { path: '/fundamentals/AAPL.US', name: 'FundamentalData' },
  ];

  await generator.generateAllTypes(endpoints);
}

// CLI interface
if (require.main === module) {
  runTypeGenerator()
    .then(() => console.log('Type generation complete'))
    .catch(error => console.error('Type generation failed:', error));
}