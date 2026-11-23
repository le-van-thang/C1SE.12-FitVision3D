import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ramanujanCircumference } from '../../src/core/biometrics/ramanujanEllipse.ts';
import {
  computeBiologicalVolume,
  computeVolumePenalty,
  applyCorrectionFactor,
  computeBMI,
} from '../../src/core/biometrics/volumePenalty.ts';

describe('Biometrics Core — Ramanujan Ellipse & Volume Penalty', () => {
  it('TC-BIO-01: computes exact circle circumference when semi-axes are equal (a = b = 15cm)', () => {
    // Arrange
    const radiusCm = 15;
    const expected = 2 * Math.PI * radiusCm;

    // Act
    const actual = ramanujanCircumference(radiusCm, radiusCm);

    // Assert
    assert.ok(Math.abs(actual - expected) < 0.01, `Expected ~${expected}, got ${actual}`);
  });

  it('TC-BIO-02: approximates non-circular torso ellipse (a=18cm, b=12cm) within 0.4% accuracy', () => {
    // Arrange: exact complete elliptic integral E(e) for a=18, b=12 is ~95.3607cm
    const a = 18;
    const b = 12;
    const exactPerimeter = 95.3607;

    // Act
    const actual = ramanujanCircumference(a, b);
    const relativeError = Math.abs(actual - exactPerimeter) / exactPerimeter;

    // Assert
    assert.ok(relativeError < 0.004, `Relative error ${(relativeError * 100).toFixed(3)}% exceeded 0.4%`);
  });

  it('TC-BIO-03: rejects non-positive semi-axes to prevent NaN propagation', () => {
    assert.throws(() => ramanujanCircumference(0, 12), /Ban truc phai > 0/);
    assert.throws(() => ramanujanCircumference(15, -3), /Ban truc phai > 0/);
  });

  it('TC-BIO-04: computes biological volume from weight and rejects out-of-range weights', () => {
    // Arrange & Act
    const vol = computeBiologicalVolume(65);

    // Assert: 65 / 1.01 * 1000 = 64356.4356 cm3
    assert.ok(Math.abs(vol - 64356.44) < 0.1);
    assert.throws(() => computeBiologicalVolume(0), /Can nang khong hop le/);
    assert.throws(() => computeBiologicalVolume(550), /Can nang khong hop le/);
  });

  it('TC-BIO-05: applies volume penalty (0 < k < 1) when baggy clothing inflates ellipsoid volume > 105%', () => {
    // Arrange: 60kg user (~59,406 cm3 bio volume), baggy coat ellipsoid ~90,000 cm3
    const inflatedSlices = [
      {
        slice: { name: 'chest', a_cm: 22, b_cm: 16, delta_h_cm: 45 },
        circumference_raw_cm: 120,
      },
      {
        slice: { name: 'waist', a_cm: 20, b_cm: 15, delta_h_cm: 45 },
        circumference_raw_cm: 110,
      },
    ];

    // Act
    const result = computeVolumePenalty(inflatedSlices, 60);
    const corrected = applyCorrectionFactor(120, result.k_penalty);

    // Assert
    assert.equal(result.penalty_applied, true);
    assert.ok(result.k_penalty > 0 && result.k_penalty < 1);
    assert.ok(corrected < 120, `Expected corrected girth < 120cm, got ${corrected}`);
  });

  it('TC-BIO-06: keeps k_penalty = 1.0 when fitted clothing stays within 5% threshold', () => {
    // Arrange: 70kg user (~69,307 cm3 bio volume), tight slices ~45,000 cm3
    const fittedSlices = [
      {
        slice: { name: 'chest', a_cm: 16, b_cm: 11, delta_h_cm: 40 },
        circumference_raw_cm: 86,
      },
      {
        slice: { name: 'waist', a_cm: 14, b_cm: 10, delta_h_cm: 40 },
        circumference_raw_cm: 76,
      },
    ];

    // Act
    const result = computeVolumePenalty(fittedSlices, 70);

    // Assert
    assert.equal(result.penalty_applied, false);
    assert.equal(result.k_penalty, 1);
  });

  it('computes accurate BMI rounded to 2 decimals', () => {
    assert.equal(computeBMI(64, 160), 25);
    assert.equal(computeBMI(70, 175), 22.86);
  });
});
