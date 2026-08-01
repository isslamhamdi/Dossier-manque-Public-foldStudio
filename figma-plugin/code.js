// #60: Fold Studio Figma Plugin — import dieline SVG + apply brand colors
// Runs in the Figma plugin sandbox (main thread)

figma.showUI(__html__, { width: 340, height: 520, themeColors: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import-dieline') {
    const { svgContent, projectName } = msg;
    if (!svgContent) {
      figma.notify('No dieline SVG received', { error: true });
      return;
    }

    // Create a frame to hold the dieline
    const frame = figma.createFrame();
    frame.name = projectName || 'Fold Studio Dieline';
    frame.resize(400, 300);
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

    // Import SVG as a vector node
    const svgBytes = new TextEncoder().encode(svgContent);
    const node = figma.createNodeFromSvg(svgContent);
    node.name = 'Dieline';
    frame.appendChild(node);
    figma.currentPage.appendChild(frame);

    // Center in viewport
    figma.viewport.scrollAndZoomIntoView([frame]);
    figma.notify(`✓ Dieline "${frame.name}" importée avec succès`);
    figma.ui.postMessage({ type: 'import-success', frameId: frame.id });
  }

  if (msg.type === 'apply-color') {
    const { hex, target } = msg;
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.notify('Sélectionnez des éléments d\'abord', { error: true });
      return;
    }
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    for (const node of selection) {
      if ('fills' in node && target === 'fill') {
        node.fills = [{ type: 'SOLID', color: { r, g, b } }];
      }
      if ('strokes' in node && target === 'stroke') {
        node.strokes = [{ type: 'SOLID', color: { r, g, b } }];
      }
    }
    figma.notify(`✓ Couleur appliquée (${hex})`);
  }

  if (msg.type === 'get-selection') {
    const sel = figma.currentPage.selection;
    figma.ui.postMessage({
      type: 'selection',
      count: sel.length,
      types: sel.map(n => n.type),
    });
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
