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