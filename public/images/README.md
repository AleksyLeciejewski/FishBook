# Logo Upload Instructions

## How to Use Your Own Logo

To replace the current FishHub logo with your own image:

1. **Save your logo image** to this folder (`public/images/`)
   - Recommended filename: `fishhub-logo.png` or `fishhub-logo.svg`
   - Recommended size: At least 200x80 pixels for best quality
   - Supported formats: PNG, SVG, JPG, WEBP

2. **Update the logo reference** in the following files:
   - `views/layout.ejs` (line 7-8 and line 72)
   - `views/partials/header.ejs` (line 7-8 and line 72)
   - `views/trips/index.ejs` (line 7-8 and line 30)
   - Any other view files that use the navigation

3. **Change the file path** from:
   ```html
   <img src="/images/fishhub-logo.svg" alt="FishHub" class="h-10">
   ```
   
   To (if using PNG):
   ```html
   <img src="/images/fishhub-logo.png" alt="FishHub" class="h-10">
   ```

4. **Update the favicon** (browser tab icon) in the same files:
   ```html
   <link rel="icon" type="image/png" href="/images/fishhub-logo.png">
   <link rel="shortcut icon" type="image/png" href="/images/fishhub-logo.png">
   ```

## Quick Replace

If you want to keep the same filename, simply:
1. Delete or rename the current `fishhub-logo.svg`
2. Upload your logo as `fishhub-logo.svg` (if SVG) or `fishhub-logo.png` (if PNG)
3. If using PNG, update the file extension in the HTML files mentioned above

## Current Logo Location

The current logo is at: `public/images/fishhub-logo.svg`
