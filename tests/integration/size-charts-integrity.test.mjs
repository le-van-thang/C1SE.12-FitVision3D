import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizeChartsPath = path.resolve(__dirname, '../../shared/size-charts.json');
const sizeCharts = JSON.parse(fs.readFileSync(sizeChartsPath, 'utf-8'));

describe('Integration — Shared Multi-System Size Charts Contract', () => {
  it('TC-INT-01: validates men & women topwear/bottomwear monotonic ranges and 4 sizing systems', () => {
    for (const group of ['men', 'women']) {
      assert.ok(sizeCharts[group], `Missing ${group} size table`);
      const { topwear, bottomwear } = sizeCharts[group];
      assert.ok(Array.isArray(topwear) && topwear.length >= 5, `${group}.topwear must have >= 5 sizes`);
      assert.ok(Array.isArray(bottomwear) && bottomwear.length >= 5, `${group}.bottomwear must have >= 5 sizes`);

      for (const row of topwear) {
        assert.ok(row.asia && row.us && row.eu && row.uk, `Missing international system labels in ${group}.topwear`);
        assert.ok(row.chest_min < row.chest_max, `Invalid chest range in ${group} size ${row.asia}`);
      }

      for (const row of bottomwear) {
        assert.ok(row.asia && row.us, `Missing labels in ${group}.bottomwear`);
        assert.ok(row.waist_min < row.waist_max, `Invalid waist range in ${group} size ${row.asia}`);
      }
    }

    assert.ok(
      Array.isArray(sizeCharts.standard_inseams) && sizeCharts.standard_inseams.length >= 4,
      'standard_inseams must be defined'
    );
  });
});
