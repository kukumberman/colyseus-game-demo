export class NameSanitizer {
  constructor(public readonly defaultValue: string, public readonly maxLength: number) {}

  sanitize(value: unknown) {
    if (typeof value !== "string") {
      return this.defaultValue
    }

    const valueTrimmed = value.trim()
    if (valueTrimmed.length === 0) {
      return this.defaultValue
    }

    return valueTrimmed.slice(0, this.maxLength)
  }
}

export class SkinSanitizer {
  constructor(public readonly defaultSkin: string, public readonly skins: string[]) {}

  sanitize(value: unknown) {
    if (typeof value === "string") {
      if (this.skins.includes(value)) {
        return value
      }

      const valueAsNumber = Number(value)
      return this.sanitizeNumber(valueAsNumber)
    }

    if (typeof value === "number") {
      return this.sanitizeNumber(value)
    }

    return this.defaultSkin
  }

  sanitizeNumber(valueAsNumber: number) {
    if (Number.isNaN(valueAsNumber) || !Number.isFinite(valueAsNumber)) {
      return this.defaultSkin
    }

    if (!Number.isInteger(valueAsNumber)) {
      valueAsNumber = Math.floor(valueAsNumber)
    }

    if (valueAsNumber < 0 || valueAsNumber >= this.skins.length) {
      return this.defaultSkin
    }

    return this.skins[valueAsNumber]
  }
}
