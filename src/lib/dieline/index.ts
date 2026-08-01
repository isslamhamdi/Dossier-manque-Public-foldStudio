import type { TemplateType } from '../types'
import { computeBox, computeTuckEnd } from './box'
import { computeDisplay, computeSealEnd, computeSnapLock } from './openTop'
import { computeMailer, computeFlipTop, computeGable, computeAutoBottom } from './others'
import { computeLidBox, computePillowBox, computeDrawerBox, computeHexagonalBox, computeCylinderBox, computeTrayBox, computeReverseTuck, computeBookBox, computeStandUpPouch } from './newTemplates'
import { computeCrashLockBottom, computeWindowBox, computeSleeveInsert } from './makerTemplates'
import { computeShrinkSleeve, computeIMLLabel, computeFlowWrap, computeBlisterPack, computeBallotin, computeFourreauRigide, computeThermoformTray } from './advancedTemplates'
import { computeHSCBox, computeOSCBox, computeFOLBox } from './fefcoSlotted'
import { computeEnvelope, computeShallowBox } from './extraTemplates'
import {
  computeEarBox, computeSouffletPartiel, computeSouffletFerme,
  computeBanderole, computeBanderoleFine, computeHandleBox, computeHangingBox,
  computeDispenserBox, computeDisplayStand, computeBerlingot,
  computeFourreauAuto, computeFourreauSemiAuto, computeCalageInsert,
  computeSeparateur, computeEtiquetteSacOvale, computePlateauSnap,
  computeDeluxeSoufflet,
} from './packlyTemplates'
import { computeFEFCOTray } from './fefcoTray'
import { computeRSCFull } from './fefcoRSC'
import { computeFEFCO0713 } from './fefcoTuckEnd'

export { mmToPx, foldAxisFrom2D } from './helpers'
export type { DielineData, Panel, FoldNode, FaceName } from './helpers'
export { boxFoldNode, buildPolygonFoldNode, trayFoldNode } from './box'

export function computeDieline(p: Parameters<typeof computeBox>[0], template: TemplateType = 'box') {
  switch (template) {
    case 'tuck-end':      return computeTuckEnd(p)
    case 'display':       return computeDisplay(p)
    case 'seal-end':      return computeSealEnd(p)
    case 'snap-lock':     return computeSnapLock(p)
    case 'mailer':        return computeMailer(p)
    case 'flip-top':      return computeFlipTop(p)
    case 'gable':         return computeGable(p)
    case 'auto-bottom':   return computeAutoBottom(p)
    case 'lid-box':       return computeLidBox(p)
    case 'pillow-box':    return computePillowBox(p)
    case 'drawer-box':    return computeDrawerBox(p)
    case 'hexagonal-box': return computeHexagonalBox(p)
    case 'cylinder-box':  return computeCylinderBox(p)
    case 'tray-box':      return computeTrayBox(p)
    case 'reverse-tuck':  return computeReverseTuck(p)
    case 'book-box':        return computeBookBox(p)
    case 'stand-up-pouch':    return computeStandUpPouch(p)
    case 'crash-lock-bottom': return computeCrashLockBottom(p)
    case 'window-box':        return computeWindowBox(p)
    case 'sleeve-insert':     return computeSleeveInsert(p)
    case 'shrink-sleeve':     return computeShrinkSleeve(p)
    case 'iml-label':         return computeIMLLabel(p)
    case 'flow-wrap':         return computeFlowWrap(p)
    case 'blister-pack':      return computeBlisterPack(p)
    case 'ballotin':          return computeBallotin(p)
    case 'fourreau-rigide':   return computeFourreauRigide(p)
    case 'thermoform-tray':   return computeThermoformTray(p)
    case 'osc-box':           return computeOSCBox(p)
    case 'fol-box':           return computeFOLBox(p)
    case 'fefco-tray':        return computeFEFCOTray(p)
    case 'fefco-rsc':         return computeRSCFull(p)
    case 'fefco-0713':        return computeFEFCO0713(p)
    case 'hsc-box':           return computeHSCBox(p)
    case 'envelope':          return computeEnvelope(p)
    case 'shallow-box':       return computeShallowBox(p)
    case 'ear-box':           return computeEarBox(p)
    case 'soufflet-partiel':  return computeSouffletPartiel(p)
    case 'soufflet-ferme':    return computeSouffletFerme(p)
    case 'banderole':         return computeBanderole(p)
    case 'banderole-fine':    return computeBanderoleFine(p)
    case 'handle-box':        return computeHandleBox(p)
    case 'hanging-box':       return computeHangingBox(p)
    case 'dispenser-box':     return computeDispenserBox(p)
    case 'display-stand':     return computeDisplayStand(p)
    case 'berlingot':         return computeBerlingot(p)
    case 'fourreau-auto':     return computeFourreauAuto(p)
    case 'fourreau-semi-auto':return computeFourreauSemiAuto(p)
    case 'calage-insert':     return computeCalageInsert(p)
    case 'separateur':        return computeSeparateur(p)
    case 'etiquette-sac-ovale':return computeEtiquetteSacOvale(p)
    case 'plateau-snap':      return computePlateauSnap(p)
    case 'deluxe-soufflet':   return computeDeluxeSoufflet(p)
    case 'box':
    default:              return computeBox(p)
  }
}
