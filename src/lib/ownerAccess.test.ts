import { describe, expect, it } from 'vitest';
import { getOwnerRoleRoute } from './ownerAccess';

describe('owner access helpers', () => {
  it('maps role buttons to the real app routes', () => {
    expect(getOwnerRoleRoute('teacher')).toBe('/school');
    expect(getOwnerRoleRoute('principal')).toBe('/school');
    expect(getOwnerRoleRoute('district_admin')).toBe('/district');
    expect(getOwnerRoleRoute('province_admin')).toBe('/province');
    expect(getOwnerRoleRoute('ministry_admin')).toBe('/ministry');
  });

});
