import { describe, expect, it } from 'vitest';
import { isOwnerCredentials, getOwnerRoleRoute, isOwnerBypassMode, getRoleRouteFromEmail } from './ownerAccess';

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

  it('maps official school accounts to the correct dashboard routes', () => {
    expect(getRoleRouteFromEmail('salikmasoud1@gmail.com')).toBe('/school');
    expect(getRoleRouteFromEmail('kateandrew78.20@gmail.com')).toBe('/school');
    expect(getRoleRouteFromEmail('salikmasoud621@gmail.com')).toBe('/district');
    expect(getRoleRouteFromEmail('zahrasalik87@gmail.com')).toBe('/province');
    expect(getRoleRouteFromEmail('manotofaza@gmail.com')).toBe('/ministry');
    expect(getRoleRouteFromEmail('unknown@example.com')).toBeNull();
  });
});
