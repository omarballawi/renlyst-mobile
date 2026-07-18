import { translateCopy } from '@/localization/copy';

describe('localized product copy', () => {
  it('translates core navigation and preserves unknown clinical values', () => {
    expect(translateCopy('Today', 'ar')).toBe('اليوم');
    expect(translateCopy('Backup & Data', 'ar')).toBe('النسخ الاحتياطي والبيانات');
    expect(translateCopy('Metformin XR', 'ar')).toBe('Metformin XR');
    expect(translateCopy('Today', 'en')).toBe('Today');
  });

  it('localizes dynamic accessibility and destructive-confirmation copy', () => {
    expect(translateCopy('Package photo 3', 'ar')).toBe('صورة العبوة 3');
    expect(translateCopy('Remove ingredient 2', 'ar')).toBe('إزالة المادة الفعّالة 2');
    expect(translateCopy('Furosemide, mastery 4 of 6, due for review', 'ar')).toBe(
      'Furosemide، الإتقان 4 من 6، مستحق للمراجعة',
    );
    expect(translateCopy('Delete Lasix?', 'ar')).toBe('حذف Lasix؟');
    expect(
      translateCopy(
        '2 brands and 3 relationships will be removed. Choose whether 4 reviews and 5 encounters should keep their snapshots.',
        'ar',
      ),
    ).toBe(
      'ستُحذف 2 علامات تجارية و3 علاقات. اختر ما إذا كان ينبغي أن تحتفظ 4 مراجعات و5 حالات تعليمية بلقطاتها.',
    );
  });

  it('does not let an entity-label fallback partially translate a full sentence', () => {
    const fullSentence =
      'Capture a known medicine or save it as unknown. You can complete the clinical profile when you have time.';

    expect(translateCopy('Capture ACE inhibitor', 'ar')).not.toBe('Capture ACE inhibitor');
    expect(translateCopy(fullSentence, 'ar')).not.toContain('known medicine');
    expect(translateCopy(fullSentence, 'ar')).not.toBe(fullSentence);
  });

  it('keeps dynamic Today copy together in Arabic', () => {
    expect(translateCopy('Review 43 due drugs', 'ar')).toBe('راجع 43 من الأدوية المستحقة');
    expect(translateCopy('58 weak drugs need a short return', 'ar')).toBe(
      '58 من الأدوية الضعيفة تحتاج إلى مراجعة قصيرة',
    );
  });

  it('localizes visual library navigation and common clinical chapters', () => {
    expect(translateCopy('FIRST', 'ar')).toBe('الأول');
    expect(translateCopy('Choose second profile', 'ar')).toBe('اختر الملف الثاني');
    expect(translateCopy('Cardiovascular', 'ar')).toBe('القلبي الوعائي');
    expect(translateCopy('ACE inhibitor', 'ar')).toBe('مثبط الإنزيم المحول للأنجيوتنسين');
    expect(translateCopy('Not found on your shelf yet', 'ar')).toBe('غير موجود على رفك بعد');
  });
});
