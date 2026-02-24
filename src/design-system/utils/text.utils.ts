export function _sanitizeTextInput(value: string, maxlength: number = 255) {
    if (!value) return ''

    return value
      .normalize('NFKC')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/[<>]/g, '')
      .slice(0, maxlength)
      .trim()
  }