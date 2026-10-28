import { PRODUCT } from './products'

export const ASSET_CONFIG = {
  mode: PRODUCT.model.source ? ('real' as const) : ('placeholder' as const),
  modelPath: PRODUCT.model.source,
  format: PRODUCT.model.format,
}

export const USE_REAL_MODEL = ASSET_CONFIG.mode === 'real'
