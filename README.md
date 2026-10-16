# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--skoda-eds-learn--senjutihaldervw.aem.page/
- Live: https://main--skoda-eds-learn--senjutihaldervw.aem.live/

## Documentation

Before using the aem-boilerplate, we recommend you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `skoda-eds-learn` directory in your favorite IDE and start coding :)

## DriveMatch vehicle catalog

Vehicle content stays in the authored document. Use a two-column block table
named `Vehicle Catalog`, with an image and description in each vehicle row.
Format the model name as a heading or bold text so search matches the name.
For body-type filtering, add an optional third column containing a category
such as `Hatchback`, `Liftback`, or `SUV`. Keep the block-name header merged
across all columns. Categories appear on the cards and populate the dropdown;
name search and body type apply together. Rows without a category remain visible
under `All body types`. The dropdown is disabled if no categories are authored.
The existing `Cards (vehicles)` table is also supported: `buildAutoBlocks` in
`scripts/scripts.js` routes it to the catalog before the EDS block loader runs.
Ordinary `Cards` tables are unaffected.

- `blocks/vehicle-catalog/vehicle-catalog.html`: search controls, result count,
	empty state, list, and repeated-card template.
- `blocks/vehicle-catalog/vehicle-catalog.js`: loads the HTML template, inserts
	authored vehicle cells, optimizes images, and handles search input.
- `blocks/vehicle-catalog/vehicle-catalog.css`: catalog layout and styling.

The HTML template is served with the code and fetched once per catalog block.
If it cannot be loaded, the block keeps the original authored content visible.
Preview document changes to update content; deploy all three block files with
the loader change to update the remote site's code.
