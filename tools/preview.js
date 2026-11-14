'use strict';
// Build the real sibling site's content with this working tree, without changing it.
const fs = require('node:fs');
const path = require('node:path');
const Hexo = require('hexo');
const theme = path.resolve(__dirname, '..');
const site = path.resolve(process.env.WHYL_SITE || path.join(theme, '../photo.naaln.com'));
const base = path.join(theme, '.preview');
const buildOnly = process.argv.includes('--build');
if (!fs.existsSync(path.join(site, '_config.yml'))) {
  console.error('Missing photo.naaln.com. Clone it beside this theme or set WHYL_SITE.');
  process.exit(1);
}
fs.mkdirSync(path.join(base, 'themes'), {recursive:true});
const link = path.join(base, 'themes/WhyL');
// Link only theme inputs: linking the entire repository would recurse into .preview.
if (fs.existsSync(link) && fs.lstatSync(link).isSymbolicLink()) fs.unlinkSync(link);
fs.mkdirSync(link, {recursive:true});
for (const item of ['layout', 'source', 'scripts', '_config.yml']) {
  const target = path.join(link, item);
  if (!fs.existsSync(target)) fs.symlinkSync(path.join(theme, item), target);
}
const sourceLink = path.join(base, 'source');
if (fs.existsSync(sourceLink) && fs.lstatSync(sourceLink).isSymbolicLink()) fs.unlinkSync(sourceLink);
fs.symlinkSync(path.join(site, 'source'), sourceLink, 'dir');
const configText = fs.readFileSync(path.join(site, '_config.yml'), 'utf8');
const pinnedConfig = configText.replace(/^theme:.*$/m, 'theme: WhyL').replace(/^public_dir:.*$/m, 'public_dir: public');
fs.writeFileSync(path.join(base, '_config.yml'), pinnedConfig + (/^theme:/m.test(configText) ? '' : '\ntheme: WhyL\n'));
const override = path.join(site, '_config.WhyL.yml');
const previewOverride = path.join(base, '_config.WhyL.yml');
if (fs.existsSync(override)) fs.copyFileSync(override, previewOverride);
else if (fs.existsSync(previewOverride)) fs.unlinkSync(previewOverride);
const manifest = JSON.parse(fs.readFileSync(path.join(theme, 'package.json'), 'utf8'));
manifest.hexo = {version: require('hexo/package.json').version};
fs.writeFileSync(path.join(base, 'package.json'), JSON.stringify(manifest));
const modules = path.join(base, 'node_modules');
if (!fs.existsSync(modules)) fs.symlinkSync(path.join(theme, 'node_modules'), modules, 'dir');
// Pin the preview theme even when the sibling site's configuration changes.
const hexo = new Hexo(base, {silent:false});
(async function () {
  await hexo.init();
  if (buildOnly) await hexo.call('clean');
  await hexo.call('generate');
  if (buildOnly) { await hexo.exit(); return; }
  await hexo.call('server', {port:Number(process.env.PORT || 4000), ip:'127.0.0.1'});
})().catch(async error => { console.error(error); await hexo.exit(error); process.exitCode = 1; });
