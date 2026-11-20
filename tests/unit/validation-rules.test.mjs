import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  checkHoneypot,
  isDisposableEmailDomain,
} from '../../src/lib/validationRules.ts';

describe('Security & Input Validation Rules', () => {
  it('TC-SEC-01: blocks disposable and temporary email domains', () => {
    assert.equal(isDisposableEmailDomain('tempmail.com'), true);
    assert.equal(isDisposableEmailDomain('yopmail.com'), true);
    assert.equal(validateEmail('hacker@tempmail.com').valid, false);
    assert.equal(validateEmail('bot@10minutemail.com').valid, false);
  });

  it('TC-SEC-02: accepts valid global/institutional emails and Vietnamese phone numbers', () => {
    assert.equal(validateEmail('customer@gmail.com').valid, true);
    assert.equal(validateEmail('student@dtu.edu.vn').valid, true);
    assert.equal(validatePhoneNumber('0912345678').valid, true);
    assert.equal(validatePhoneNumber('+84912345678').valid, true);
    assert.equal(validatePhoneNumber('12345').valid, false);
  });

  it('TC-SEC-03: enforces password complexity and detects bot honeypot traps', () => {
    assert.equal(validatePassword('12345').valid, false);
    assert.equal(validatePassword('abcdef123').valid, false);
    assert.equal(validatePassword('FitVision@2026').valid, true);

    assert.equal(checkHoneypot(''), false);
    assert.equal(checkHoneypot(undefined), false);
    assert.equal(checkHoneypot('http://spam-bot.example'), true);
  });
});
