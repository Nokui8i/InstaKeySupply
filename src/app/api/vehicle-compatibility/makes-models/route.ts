import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src/data/vehicleCompatibilityMaster.json');

export async function GET() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Could not read vehicle compatibility data.' }, { status: 500 });
  }
}

// POST: Add make, model, or year range
export async function POST(request: NextRequest) {
  try {
    const { make, model, yearRange } = await request.json();
    const data = JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'));
    if (!data[make]) data[make] = {};
    if (model) {
      if (!data[make][model]) data[make][model] = [];
      if (yearRange && !data[make][model].includes(yearRange)) data[make][model].push(yearRange);
    }
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Could not add make/model/yearRange.' }, { status: 500 });
  }
}

// PUT: Reorder makes, models, or year ranges
export async function PUT(request: NextRequest) {
  try {
    const { make, model, orderedMakes, orderedModels, orderedYearRanges } = await request.json();
    const data = JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'));
    
    // Reorder makes
    if (orderedMakes && Array.isArray(orderedMakes)) {
      const newData: { [key: string]: { [key: string]: string[] } } = {};
      orderedMakes.forEach((makeName: string) => {
        if (data[makeName]) {
          newData[makeName] = data[makeName];
        }
      });
      // Add any remaining makes that weren't in the ordered list
      Object.keys(data).forEach(makeName => {
        if (!newData[makeName]) {
          newData[makeName] = data[makeName];
        }
      });
      // Update data object
      Object.keys(data).forEach(key => delete data[key]);
      Object.assign(data, newData);
    }
    
    // Reorder models
    if (make && orderedModels && Array.isArray(orderedModels)) {
      if (!data[make]) {
        return NextResponse.json({ error: 'Make not found.' }, { status: 404 });
      }
      const newModelsObject: { [key: string]: string[] } = {};
      orderedModels.forEach((modelName: string) => {
        if (data[make][modelName]) {
          newModelsObject[modelName] = data[make][modelName];
        }
      });
      // Add any remaining models that weren't in the ordered list
      Object.keys(data[make]).forEach(modelName => {
        if (!newModelsObject[modelName]) {
          newModelsObject[modelName] = data[make][modelName];
        }
      });
      data[make] = newModelsObject;
    }
    
    // Reorder year ranges
    if (make && model && orderedYearRanges && Array.isArray(orderedYearRanges)) {
      if (!data[make]) {
        return NextResponse.json({ error: 'Make not found.' }, { status: 404 });
      }
      if (data[make][model]) {
        data[make][model] = orderedYearRanges;
      }
    }
    
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Could not reorder makes/models/year ranges.' }, { status: 500 });
  }
}

// DELETE: Remove year range, model, or make
export async function DELETE(request: NextRequest) {
  try {
    const { make, model, yearRange } = await request.json();
    const data = JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'));
    if (make && model && yearRange) {
      // Remove year range from model
      if (data[make] && data[make][model]) {
        data[make][model] = data[make][model].filter((y: string) => y !== yearRange);
        if (data[make][model].length === 0) delete data[make][model];
        if (Object.keys(data[make]).length === 0) delete data[make];
      }
    } else if (make && model) {
      // Remove model from make
      if (data[make]) {
        delete data[make][model];
        if (Object.keys(data[make]).length === 0) delete data[make];
      }
    } else if (make) {
      // Remove make
      delete data[make];
    }
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Could not remove make/model/yearRange.' }, { status: 500 });
  }
} 