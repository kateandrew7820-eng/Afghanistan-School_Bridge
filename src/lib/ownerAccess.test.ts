import { describe, expect, it } from 'vitest';
import { isOwnerCredentials, getOwnerRoleRoute, isOwnerBypassMode } from './ownerAccess';

describe('owner access helpers', () => {
  it('recognizes the configured owner credentials', () => {
    expect(isOwnerCredentials('masoudsalik2024@gmail.com', 'KfR94hZkAE4edz$3')).toBe(true);
    expect(isOwnerCredentials('someone@example.com', 'wrong-password')).toBe(false);
  });

  it('maps role buttons to the real app routes', () => {
    expect(getOwnerRoleRoute('teacher')).toBe('/school');
    expect(getOwnerRoleRoute('principal')).toBe('/school');
    expect(getOwnerRoleRoute('district_admin')).toBe('/district');
    expect(getOwnerRoleRoute('province_admin')).toBe('/province');
    expect(getOwnerRoleRoute('ministry_admin')).toBe('/ministry');
  });

  it('detects owner bypass mode for the configured owner account', () => {
    expect(isOwnerBypassMode('masoudsalik2024@gmail.com', 'KfR94hZkAE4edz$3')).toBe(true);
    expect(isOwnerBypassMode('someone@example.com', 'wrong-password')).toBe(false);
  });
});
