import { describe, expect, test } from 'bun:test'
import { canManageGuild } from '../src/api/discord'

describe('canManageGuild', () => {
  test('オーナーは権限ビットに関係なく管理できる', () => {
    expect(canManageGuild({ id: '1', name: 'g', owner: true, permissions: '0' })).toBe(true)
  })

  test('ManageGuildビットが立っていれば管理できる', () => {
    // 0x20 = ManageGuild
    expect(canManageGuild({ id: '1', name: 'g', permissions: '32' })).toBe(true)
  })

  test('Administratorなど他のビットのみでは管理できない', () => {
    // 0x8 = Administrator（ManageGuildは含まない）
    expect(canManageGuild({ id: '1', name: 'g', permissions: '8' })).toBe(false)
  })

  test('64bitを超える権限値でも判定できる', () => {
    // ビット40相当 + ManageGuild
    const permissions = ((1n << 40n) | 0x20n).toString()
    expect(canManageGuild({ id: '1', name: 'g', permissions })).toBe(true)
  })

  test('permissionsが無ければ管理できない', () => {
    expect(canManageGuild({ id: '1', name: 'g' })).toBe(false)
  })
})
