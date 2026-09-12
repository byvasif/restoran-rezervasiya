import { describe, it, expect } from 'vitest'
import { generateSlots, filterSlots, filterPastSlots, slotEnd, overlaps } from '@/lib/time/slots'

describe('generateSlots', () => {
  it('10:00–22:00 aralığında 60 dəqiqəlik slotlar yaradır', () => {
    expect(
      generateSlots({ openingTime: '10:00', closingTime: '22:00', durationMinutes: 60 }),
    ).toEqual([
      '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
      '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
    ])
  })

  it('bağlanışdan sonra bitəcək slotu daxil etmir', () => {
    expect(generateSlots({ openingTime: '10:00', closingTime: '11:30', durationMinutes: 60 })).toEqual(['10:00'])
  })

  it('fasilə ilə kəsişən slotları çıxarır', () => {
    expect(
      generateSlots({
        openingTime: '10:00',
        closingTime: '14:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        durationMinutes: 60,
      }),
    ).toEqual(['10:00', '11:00', '13:00'])
  })

  it('fasilə slotun ortasına düşəndə həmin slotu çıxarır', () => {
    expect(
      generateSlots({
        openingTime: '10:00',
        closingTime: '13:00',
        breakStart: '11:30',
        breakEnd: '12:00',
        durationMinutes: 60,
      }),
    ).toEqual(['10:00', '12:00'])
  })

  it('bağlanış açılışdan əvvəldirsə boş siyahı qaytarır', () => {
    expect(generateSlots({ openingTime: '22:00', closingTime: '10:00', durationMinutes: 60 })).toEqual([])
  })

  it('90 dəqiqəlik konfiqurasiyanı dəstəkləyir', () => {
    expect(generateSlots({ openingTime: '10:00', closingTime: '14:00', durationMinutes: 90 })).toEqual([
      '10:00', '11:30',
    ])
  })
})

describe('filterSlots', () => {
  it('məşğul aralıqla kəsişən slotu gizlədir', () => {
    expect(filterSlots(['10:00', '11:00', '12:00'], [{ start: '11:00', end: '12:00' }], 60)).toEqual([
      '10:00',
      '12:00',
    ])
  })

  it('qismən kəsişən aralıq da slotu bağlayır', () => {
    expect(filterSlots(['10:00', '11:00'], [{ start: '10:30', end: '11:15' }], 60)).toEqual([])
  })

  it('toxunan sərhədlər slotu bağlamır', () => {
    expect(filterSlots(['11:00'], [{ start: '10:00', end: '11:00' }], 60)).toEqual(['11:00'])
  })

  it('məşğul aralıq yoxdursa siyahını dəyişmir', () => {
    expect(filterSlots(['10:00', '11:00'], [], 60)).toEqual(['10:00', '11:00'])
  })
})

describe('filterPastSlots', () => {
  it('həddən əvvəl başlayan slotları çıxarır', () => {
    expect(filterPastSlots(['10:00', '11:00', '12:00'], 11 * 60)).toEqual(['11:00', '12:00'])
  })
})

describe('köməkçi funksiyalar', () => {
  it('slotun bitmə saatını hesablayır', () => {
    expect(slotEnd('21:00', 60)).toBe('22:00')
  })

  it('kəsişməni düzgün müəyyən edir', () => {
    expect(overlaps(600, 660, 660, 720)).toBe(false)
    expect(overlaps(600, 660, 630, 720)).toBe(true)
  })
})
