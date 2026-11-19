# Architecture images

`finance-architecture.png` is the image embedded in the root architecture document. `finance-architecture.svg` is its editable source. Keep both in sync when boundaries or labels change; visually inspect the rendered image for clipping, overlapping arrows and misleading flow direction.

Regenerate from the repository root after installing the existing workspace dependencies:

```sh
node --input-type=module - <<'JS'
import sharp from 'sharp';
await sharp('docs/diagrams/finance-architecture.svg')
  .png()
  .toFile('docs/diagrams/finance-architecture.png');
JS
```

The source uses system fonts and requires the existing Sharp dependency. Rendering is an asset operation, not an application build. The image communicates system boundaries; it does not certify live provider availability or financial execution.
